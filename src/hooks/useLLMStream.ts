import { useCallback, useRef } from 'react'
import { streamChatCompletion, type StreamResult } from '@/services/llm'
import { pingLLM } from '@/services/ping'
import { useConversationStore } from '@/stores/conversationStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useLLMStore } from '@/stores/llmStore'
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

  for await (const chunk of generator) {
    accumulated += chunk
    // Throttle: batch chunks within the same animation frame (max ~16ms)
    // Fall back to timer if rAF is not available
    if (typeof requestAnimationFrame !== 'undefined') {
      if (!pendingRaf) {
        pendingRaf = true
        requestAnimationFrame(flush)
      }
    } else {
      // Fallback: throttle to ~80ms intervals
      if (Date.now() - lastFlush > 80) {
        await onChunk(accumulated, thinkingContent)
        lastFlush = Date.now()
      }
    }
  }

  // Final flush to ensure all content is rendered
  await onChunk(accumulated, thinkingContent)

  const { value } = await generator.next()
  if (value) {
    thinkingContent = value.thinkingContent
    if (thinkingContent) {
      await onChunk(accumulated, thinkingContent)
    }
    return value
  }

  return { content: accumulated, finishReason: null, thinkingContent }
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
      await addMessage(userMessage)
      await addMessage(assistantMessage)

      setStreamState({
        isStreaming: true,
        currentPartIndex: 1,
        totalParts: null,
        abortController,
      })

      try {
        await streamWithAutoContinue(
          config,
          chatMessages,
          assistantMessage.id,
          abortController.signal,
          autoContinue,
        )
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
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
      const config = getConfigById(configId)
      if (!config) throw new Error('未找到模型配置')

      const pingResult = await pingLLM(config)
      if (!pingResult.success) {
        throw new Error(`模型连通性检查失败: ${pingResult.error}`)
      }

      accumulateRef.current = ''

      const template = getTemplateById(templateId)
      const prompt = template?.systemPrompt || systemPrompt

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
      const prompt = template?.systemPrompt || systemPrompt

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
    const prompt = template?.systemPrompt || systemPrompt

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
      if (err instanceof Error && err.name === 'AbortError') {
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

  const refine = useCallback(async () => {
    if (!activeConversationId || streamState.abortController) return

    const conv = useConversationStore.getState().conversations.find(
      (c) => c.id === activeConversationId,
    )
    if (!conv) return
    const config = getConfigById(conv.llmConfigId)
    if (!config) return

    const template = getTemplateById(conv.templateId)
    const prompt = template?.systemPrompt || systemPrompt

    const lastAssistantMsg = [...messages].reverse().find((m) => m.role === 'assistant')
    if (!lastAssistantMsg || !lastAssistantMsg.content) return

    accumulateRef.current = ''

    const refinePrompt = `请对以下产品文档进行精修优化：补充遗漏的细节，修正不合理的描述，增强专业性和可读性。将优化后的完整文档输出。\n\n<document>\n${lastAssistantMsg.content}\n</document>`

    const userMessage: Message = {
      id: crypto.randomUUID(),
      conversationId: activeConversationId,
      role: 'user',
      content: refinePrompt,
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
    chatMessages.push({ role: 'user', content: refinePrompt })

    await executeStream(
      activeConversationId,
      config,
      userMessage,
      makeAssistantMsg(activeConversationId),
      chatMessages,
      new AbortController(),
    )
  }, [activeConversationId, messages, systemPrompt, streamState, getConfigById, executeStream])

  const review = useCallback(async () => {
    if (!activeConversationId || streamState.abortController) return

    const conv = useConversationStore.getState().conversations.find(
      (c) => c.id === activeConversationId,
    )
    if (!conv) return
    const config = getConfigById(conv.llmConfigId)
    if (!config) return

    const template = getTemplateById(conv.templateId)
    const prompt = template?.systemPrompt || systemPrompt

    const lastAssistantMsg = [...messages].reverse().find((m) => m.role === 'assistant')
    if (!lastAssistantMsg || !lastAssistantMsg.content) return

    accumulateRef.current = ''

    const reviewPrompt = `请作为资深产品评审专家，对以下文档进行专业审阅。

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
${lastAssistantMsg.content}
</document>`

    const userMessage: Message = {
      id: crypto.randomUUID(),
      conversationId: activeConversationId,
      role: 'user',
      content: reviewPrompt,
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
    chatMessages.push({ role: 'user', content: reviewPrompt })

    await executeStream(
      activeConversationId,
      config,
      userMessage,
      makeAssistantMsg(activeConversationId),
      chatMessages,
      new AbortController(),
    )
  }, [activeConversationId, messages, systemPrompt, streamState, getConfigById, executeStream])

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
    const prompt = template?.systemPrompt || systemPrompt

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

  return {
    startGeneration,
    sendMessage,
    continueGeneration,
    refine,
    review,
    startComparison,
    stopStreaming,
    streamState,
  }
}
