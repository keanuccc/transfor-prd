import { useCallback, useRef } from 'react'
import { streamChatCompletion, type StreamResult } from '@/services/llm'
import { pingLLM } from '@/services/ping'
import { useConversationStore } from '@/stores/conversationStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useLLMStore } from '@/stores/llmStore'
import { useKnowledgeStore } from '@/stores/knowledgeStore'
import { db } from '@/db'
import { MAX_AUTO_CONTINUE_RETRIES } from '@/lib/constants'
import { getTemplateById } from '@/lib/templates'
import type { LLMConfig, ChatMessage, Message } from '@/types'

function buildUserPrompt(fileContent: string, userInput: string): string {
  let prompt = `产品功能结构思维导图：\n<content>${fileContent}</content>`
  if (userInput.trim()) {
    prompt += `\n用户输入：\n<content>${userInput}</content>`
  }
  return prompt
}

function buildKnowledgeContext(): string {
  const docs = useKnowledgeStore.getState().docs
  if (docs.length === 0) return ''
  const sections = docs.map((doc) => `### ${doc.name}\n${doc.content}`).join('\n\n')
  return `\n\n<knowledge_base>\n以下是项目背景知识，请在生成 PRD 时参考：\n\n${sections}\n</knowledge_base>`
}

function enhanceSystemPrompt(basePrompt: string): string {
  const knowledge = buildKnowledgeContext()
  return basePrompt + knowledge
}

async function readStreamResult(
  generator: AsyncGenerator<string, StreamResult>,
  onChunk: (accumulated: string, thinking: string | null) => Promise<void>,
): Promise<StreamResult> {
  let accumulated = ''
  let thinkingContent: string | null = null
  let pendingRaf = false
  let lastFlush = 0

  function flush() {
    pendingRaf = false
    lastFlush = Date.now()
    onChunk(accumulated, thinkingContent)
  }

  let iterResult = await generator.next()
  while (!iterResult.done) {
    accumulated += iterResult.value

    // Throttle: batch chunks within the same animation frame (max ~16ms)
    if (typeof requestAnimationFrame !== 'undefined') {
      if (!pendingRaf) {
        pendingRaf = true
        requestAnimationFrame(flush)
      }
    } else {
      if (Date.now() - lastFlush > 80) {
        await onChunk(accumulated, thinkingContent)
        lastFlush = Date.now()
      }
    }

    iterResult = await generator.next()
  }

  // Final flush to ensure all content is rendered
  await onChunk(accumulated, thinkingContent)

  // iterResult.done === true, iterResult.value is the generator's return value
  const value = iterResult.value
  if (value && value.thinkingContent && !thinkingContent) {
    thinkingContent = value.thinkingContent
    await onChunk(accumulated, thinkingContent)
  }

  return value || { content: accumulated, finishReason: null, thinkingContent }
}

export function useLLMStream() {
  const accumulateRef = useRef('')
  const {
    addMessage,
    updateMessage,
    setStreamState,
    stopStreaming,
    streamState,
    activeConversationId,
    messages,
  } = useConversationStore()
  const { systemPrompt, autoContinue } = useSettingsStore()
  const { getConfigById } = useLLMStore()

  const streamWithAutoContinue = useCallback(
    async (
      config: LLMConfig,
      chatMessages: ChatMessage[],
      messageId: string,
      signal: AbortSignal,
      autoCont: boolean,
    ) => {
      let currentMessages = [...chatMessages]
      let partIndex = 1

      for (let retry = 0; retry <= MAX_AUTO_CONTINUE_RETRIES; retry++) {
        if (signal.aborted) throw new DOMException('Aborted', 'AbortError')
        let partContent = ''

        const generator = streamChatCompletion(config, currentMessages, signal)
        const result = await readStreamResult(
          generator,
          async (accumulated, thinking) => {
            accumulateRef.current = accumulated
            partContent = accumulated
            await updateMessage(messageId, {
              content: accumulated,
              partIndex,
              thinkingContent: thinking,
            })
          },
        )

        if (result.finishReason !== 'length') {
          await updateMessage(messageId, {
            status: 'completed',
            totalParts: partIndex,
          })
          return
        }

        if (!autoCont) {
          await updateMessage(messageId, {
            status: 'stopped',
            totalParts: partIndex,
          })
          setStreamState({ isStreaming: false })
          return
        }

        partIndex++
        currentMessages.push({ role: 'assistant', content: partContent })
        currentMessages.push({ role: 'user', content: '请继续生成' })

        setStreamState({
          currentPartIndex: partIndex,
          totalParts: partIndex,
        })
      }

      await updateMessage(messageId, {
        status: 'stopped',
        totalParts: partIndex,
      })
    },
    [updateMessage, setStreamState],
  )

  const executeStream = useCallback(
    async (
      conversationId: string,
      config: LLMConfig,
      userMessage: Message,
      assistantMessage: Message,
      chatMessages: ChatMessage[],
      abortController: AbortController,
    ) => {
      // Abort any existing stream before starting a new one (defense-in-depth against race conditions)
      const prev = useConversationStore.getState().streamState
      prev.abortController?.abort()

      // Set stream state FIRST, before any async ops — so stopStreaming() can find the abortController immediately
      setStreamState({
        isStreaming: true,
        currentPartIndex: 1,
        totalParts: null,
        abortController,
      })

      try {
        await addMessage(userMessage)
        await addMessage(assistantMessage)
        await streamWithAutoContinue(
          config,
          chatMessages,
          assistantMessage.id,
          abortController.signal,
          autoContinue,
        )
      } catch (err) {
        if (abortController.signal.aborted) {
          await updateMessage(assistantMessage.id, { status: 'stopped' })
        } else {
          await updateMessage(assistantMessage.id, {
            status: 'error',
            errorMessage: err instanceof Error ? err.message : 'Unknown error',
          })
        }
      } finally {
        setStreamState({
          isStreaming: false,
          currentPartIndex: 0,
          totalParts: null,
          abortController: null,
        })
        await db.conversations.update(conversationId, { updatedAt: Date.now() })
      }
    },
    [autoContinue, addMessage, updateMessage, setStreamState, streamWithAutoContinue],
  )

  function makeAssistantMsg(conversationId: string): Message {
    return {
      id: crypto.randomUUID(),
      conversationId,
      role: 'assistant',
      content: '',
      status: 'streaming',
      partIndex: 1,
      totalParts: null,
      thinkingContent: null,
      errorMessage: null,
      createdAt: Date.now(),
    }
  }

  const startGeneration = useCallback(
    async (conversationId: string, configId: string, fileContent: string, userInput: string, templateId: string) => {
      // Guard against concurrent generation — let RunPage's auto-start be the sole entry point
      const currentStream = useConversationStore.getState().streamState
      if (currentStream.abortController || currentStream.isStreaming) return

      const config = getConfigById(configId)
      if (!config) throw new Error('未找到模型配置')

      const pingResult = await pingLLM(config)
      if (!pingResult.success) {
        throw new Error(`模型连通性检查失败: ${pingResult.error}`)
      }

      accumulateRef.current = ''

      const template = getTemplateById(templateId)
      const prompt = enhanceSystemPrompt(template?.systemPrompt || systemPrompt)

      const userContent = buildUserPrompt(fileContent, userInput)
      const userMessage: Message = {
        id: crypto.randomUUID(),
        conversationId,
        role: 'user',
        content: userContent,
        status: 'completed',
        partIndex: 0,
        totalParts: null,
        thinkingContent: null,
        errorMessage: null,
        createdAt: Date.now(),
      }

      await executeStream(
        conversationId,
        config,
        userMessage,
        makeAssistantMsg(conversationId),
        [
          { role: 'system', content: prompt },
          { role: 'user', content: userContent },
        ],
        new AbortController(),
      )
    },
    [systemPrompt, getConfigById, executeStream],
  )

  const sendMessage = useCallback(
    async (conversationId: string, configId: string, userInput: string, existingMessages: Message[]) => {
      const config = getConfigById(configId)
      if (!config) throw new Error('未找到模型配置')

      const pingResult = await pingLLM(config)
      if (!pingResult.success) {
        throw new Error(`模型连通性检查失败: ${pingResult.error}`)
      }

      accumulateRef.current = ''

      const conv = useConversationStore.getState().conversations.find((c) => c.id === conversationId)
      const template = conv ? getTemplateById(conv.templateId) : undefined
      const prompt = enhanceSystemPrompt(template?.systemPrompt || systemPrompt)

      const userMessage: Message = {
        id: crypto.randomUUID(),
        conversationId,
        role: 'user',
        content: userInput,
        status: 'completed',
        partIndex: 0,
        totalParts: null,
        thinkingContent: null,
        errorMessage: null,
        createdAt: Date.now(),
      }

      const chatMessages: ChatMessage[] = [
        { role: 'system', content: prompt },
      ]
      for (const msg of existingMessages) {
        if (msg.role === 'user' || msg.role === 'assistant') {
          chatMessages.push({ role: msg.role, content: msg.content })
        }
      }
      chatMessages.push({ role: 'user', content: userInput })

      await executeStream(
        conversationId,
        config,
        userMessage,
        makeAssistantMsg(conversationId),
        chatMessages,
        new AbortController(),
      )
    },
    [systemPrompt, getConfigById, executeStream],
  )

  const continueGeneration = useCallback(async () => {
    if (!activeConversationId || streamState.abortController) return

    const conv = useConversationStore.getState().conversations.find(
      (c) => c.id === activeConversationId,
    )
    if (!conv) return
    const config = getConfigById(conv.llmConfigId)
    if (!config) return

    const template = getTemplateById(conv.templateId)
    const prompt = enhanceSystemPrompt(template?.systemPrompt || systemPrompt)

    const lastAssistantMsg = [...messages].reverse().find((m) => m.role === 'assistant')
    if (!lastAssistantMsg) return

    const abortController = new AbortController()
    setStreamState({
      isStreaming: true,
      abortController,
    })

    await updateMessage(lastAssistantMsg.id, { status: 'streaming' })

    const chatMessages: ChatMessage[] = [
      { role: 'system', content: prompt },
    ]
    for (const msg of messages) {
      if (msg.role === 'user' || msg.role === 'assistant') {
        chatMessages.push({ role: msg.role, content: msg.content })
      }
    }
    chatMessages.push({ role: 'user', content: '请继续生成' })

    try {
      await streamWithAutoContinue(
        config,
        chatMessages,
        lastAssistantMsg.id,
        abortController.signal,
        autoContinue,
      )
    } catch (err) {
      if (abortController.signal.aborted) {
        await updateMessage(lastAssistantMsg.id, { status: 'stopped' })
      } else {
        await updateMessage(lastAssistantMsg.id, {
          status: 'error',
          errorMessage: err instanceof Error ? err.message : 'Unknown error',
        })
      }
    } finally {
      setStreamState({
        isStreaming: false,
        currentPartIndex: 0,
        totalParts: null,
        abortController: null,
      })
    }
  }, [activeConversationId, messages, systemPrompt, autoContinue, streamState, updateMessage, setStreamState, getConfigById, streamWithAutoContinue])

  // Shared helper for actions that send a prompt based on the last assistant message
  const streamAction = useCallback(
    async (buildPrompt: (lastContent: string) => string) => {
      if (!activeConversationId || streamState.abortController) return

      const conv = useConversationStore.getState().conversations.find(
        (c) => c.id === activeConversationId,
      )
      if (!conv) return
      const config = getConfigById(conv.llmConfigId)
      if (!config) return

      const template = getTemplateById(conv.templateId)
      const prompt = enhanceSystemPrompt(template?.systemPrompt || systemPrompt)

      const lastAssistantMsg = [...messages].reverse().find((m) => m.role === 'assistant')
      if (!lastAssistantMsg || !lastAssistantMsg.content) return

      accumulateRef.current = ''

      const userContent = buildPrompt(lastAssistantMsg.content)

      const userMessage: Message = {
        id: crypto.randomUUID(),
        conversationId: activeConversationId,
        role: 'user',
        content: userContent,
        status: 'completed',
        partIndex: 0,
        totalParts: null,
        thinkingContent: null,
        errorMessage: null,
        createdAt: Date.now(),
      }

      const chatMessages: ChatMessage[] = [
        { role: 'system', content: prompt },
      ]
      for (const msg of messages) {
        if (msg.role === 'user' || msg.role === 'assistant') {
          chatMessages.push({ role: msg.role, content: msg.content })
        }
      }
      chatMessages.push({ role: 'user', content: userContent })

      await executeStream(
        activeConversationId,
        config,
        userMessage,
        makeAssistantMsg(activeConversationId),
        chatMessages,
        new AbortController(),
      )
    },
    [activeConversationId, messages, systemPrompt, streamState, getConfigById, executeStream],
  )

  const refine = useCallback(
    () => streamAction((content) => `请对以下产品文档进行精修优化：补充遗漏的细节，修正不合理的描述，增强专业性和可读性。将优化后的完整文档输出。\n\n<document>\n${content}\n</document>`),
    [streamAction],
  )

  const review = useCallback(
    () => streamAction((content) => `请作为资深产品评审专家，对以下文档进行专业审阅。

从以下 4 个维度打分（1-10 分）并给出详细意见：
1. **完整性** — 是否覆盖了所有必要的功能模块和场景
2. **可执行性** — 描述是否足够具体，能够直接指导开发
3. **清晰度** — 逻辑是否清晰，表达是否准确无歧义
4. **技术可行性** — 技术方案是否合理

请同时指出：
- 逻辑漏洞或不一致之处
- 缺失的边界条件（corner case）
- 建议补充的内容

请以清晰的评审报告格式输出，包含总分、各维度评分、详细意见和改进建议。

<document>
${content}
</document>`),
    [streamAction],
  )

  const scoreReview = useCallback(
    () => streamAction((content) => `请作为资深产品评审专家，对以下文档进行量化打分。

请从以下 4 个维度评分（1-10 分，整数）：
1. **completeness**（完整性）— 是否覆盖了所有必要的功能模块和场景
2. **executability**（可执行性）— 描述是否足够具体，能够直接指导开发
3. **clarity**（清晰度）— 逻辑是否清晰，表达是否准确无歧义
4. **technicalFeasibility**（技术可行性）— 技术方案是否合理

请严格以以下 JSON 格式输出评分结果（放在 \`\`\`json 代码块中）：
{
  "completeness": 8,
  "executability": 7,
  "clarity": 9,
  "technicalFeasibility": 8,
  "summary": "一句话总体评价"
}

<document>
${content}
</document>`),
    [streamAction],
  )

  const estimateTimeline = useCallback(
    () => streamAction((content) => `请作为技术项目经理，对以下产品文档进行开发时间轴估算。

请：
1. 列出各个功能模块
2. 估算每个模块的开发人天（person-days）
3. 给出建议的开发阶段和依赖关系
4. 输出一个 Mermaid Gantt 图（放在 \`\`\`mermaid 代码块中），展示各模块的时间安排

Gantt 图格式示例：
\`\`\`mermaid
gantt
    title 开发时间轴
    dateFormat  YYYY-MM-DD
    section 模块A
    任务1           :a1, 2025-01-01, 5d
    任务2           :a2, after a1, 3d
    section 模块B
    任务3           :b1, 2025-01-01, 7d
\`\`\`

<document>
${content}
</document>`),
    [streamAction],
  )

  const reverseToMindMap = useCallback(
    () => streamAction((content) => `请将以下产品需求文档（PRD）逆向解析为思维导图格式（Markdown 缩进列表）。

要求：
1. 提取文档的层级结构，还原为模块→功能组→功能点的树形关系
2. 使用 - 开头的缩进列表格式（每层缩进 2 个空格）
3. 保持简洁，每个节点一行描述

输出格式示例：
- 产品名称
  - 功能模块一
    - 功能组A
      - 功能点1
      - 功能点2
    - 功能组B
      - 功能点3
  - 功能模块二
    - 功能组C
      - 功能点4

请直接输出思维导图 Markdown 内容，不要包含其他说明文字。

<document>
${content}
</document>`),
    [streamAction],
  )

  const generateCodeSkeleton = useCallback(
    () => streamAction((content) => `请作为资深全栈工程师，根据以下产品需求文档（PRD）生成完整的代码骨架。

请输出以下内容（使用 Markdown 格式）：

## 1. 项目目录结构
\`\`\`
project-root/
├── src/
│   ├── ...
\`\`\`

## 2. 核心数据模型/接口定义（TypeScript）
\`\`\`typescript
// 实体和 DTO 类型定义
\`\`\`

## 3. API 接口设计（RESTful）
- 列出所有 API 端点及其 Method、Path、Request/Response 类型

## 4. 数据库建表语句（DDL）
\`\`\`sql
-- 核心表的 CREATE TABLE 语句
\`\`\`

## 5. 核心业务逻辑伪代码
- 关键流程的描述或伪代码

请确保代码骨架与 PRD 中的功能模块一一对应，覆盖所有核心功能。

<document>
${content}
</document>`),
    [streamAction],
  )

  const startComparison = useCallback(async (comparisonConfigId: string) => {
    if (!activeConversationId || streamState.abortController) return

    const conv = useConversationStore.getState().conversations.find(
      (c) => c.id === activeConversationId,
    )
    if (!conv) return
    const config = getConfigById(comparisonConfigId)
    if (!config) throw new Error('未找到对比模型配置')

    const pingResult = await pingLLM(config)
    if (!pingResult.success) {
      throw new Error(`模型连通性检查失败: ${pingResult.error}`)
    }

    const template = getTemplateById(conv.templateId)
    const prompt = enhanceSystemPrompt(template?.systemPrompt || systemPrompt)

    // Find the original user message to reuse as prompt
    const firstUserMsg = messages.find((m) => m.role === 'user')
    if (!firstUserMsg) throw new Error('未找到原始提示词')

    accumulateRef.current = ''

    const userMessage: Message = {
      id: crypto.randomUUID(),
      conversationId: activeConversationId,
      role: 'user',
      content: `[模型对比: ${config.modelName}]\n${firstUserMsg.content}`,
      status: 'completed',
      partIndex: 0,
      totalParts: null,
      thinkingContent: null,
      errorMessage: null,
      createdAt: Date.now(),
    }

    await executeStream(
      activeConversationId,
      config,
      userMessage,
      makeAssistantMsg(activeConversationId),
      [
        { role: 'system', content: prompt },
        { role: 'user', content: firstUserMsg.content },
      ],
      new AbortController(),
    )
  }, [activeConversationId, messages, systemPrompt, streamState, getConfigById, executeStream])

  const startCompetition = useCallback(async (competitorConfigIds: string[]) => {
    if (!activeConversationId || streamState.abortController || streamState.isStreaming) return

    const conv = useConversationStore.getState().conversations.find(
      (c) => c.id === activeConversationId,
    )
    if (!conv) return

    const template = getTemplateById(conv.templateId)
    const prompt = enhanceSystemPrompt(template?.systemPrompt || systemPrompt)

    const firstUserMsg = messages.find((m) => m.role === 'user')
    if (!firstUserMsg) throw new Error('未找到原始提示词')

    accumulateRef.current = ''

    const competitors = competitorConfigIds.map((configId) => {
      const config = getConfigById(configId)
      if (!config) throw new Error(`未找到模型配置: ${configId}`)
      return config
    })

    const abortController = new AbortController()
    setStreamState({ isStreaming: true, abortController })

    const runOne = async (config: LLMConfig, label: string) => {
      const userMessage: Message = {
        id: crypto.randomUUID(),
        conversationId: activeConversationId,
        role: 'user',
        content: `[竞赛: ${label}]\n${firstUserMsg.content}`,
        status: 'completed',
        partIndex: 0,
        totalParts: null,
        thinkingContent: null,
        errorMessage: null,
        createdAt: Date.now(),
      }

      const assistantMessage = makeAssistantMsg(activeConversationId)

      await addMessage(userMessage)
      await addMessage(assistantMessage)

      try {
        await streamWithAutoContinue(
          config,
          [
            { role: 'system', content: prompt },
            { role: 'user', content: firstUserMsg.content },
          ],
          assistantMessage.id,
          abortController.signal,
          false,
        )
      } catch (err) {
        if (abortController.signal.aborted) {
          await updateMessage(assistantMessage.id, { status: 'stopped' })
        } else {
          await updateMessage(assistantMessage.id, { status: 'error', errorMessage: `${label} 生成失败` })
        }
      }
    }

    try {
      await Promise.allSettled(
        competitors.map((c) => runOne(c, c.modelName)),
      )
    } finally {
      setStreamState({ isStreaming: false, abortController: null })
    }
  }, [activeConversationId, messages, systemPrompt, streamState, getConfigById, addMessage, updateMessage, setStreamState, streamWithAutoContinue])

  return {
    startGeneration,
    sendMessage,
    continueGeneration,
    refine,
    review,
    scoreReview,
    estimateTimeline,
    reverseToMindMap,
    generateCodeSkeleton,
    startComparison,
    startCompetition,
    stopStreaming,
    streamState,
  }
}
