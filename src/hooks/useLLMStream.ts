import { useCallback, useRef } from 'react'
import { streamChatCompletion, type StreamResult } from '@/services/llm'
import { pingLLM } from '@/services/ping'
import { useConversationStore } from '@/stores/conversationStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useLLMStore } from '@/stores/llmStore'
import { db } from '@/db'
import { MAX_AUTO_CONTINUE_RETRIES } from '@/lib/constants'
import type { LLMConfig, ChatMessage, Message } from '@/types'

function buildUserPrompt(fileContent: string, userInput: string): string {
  let prompt = `产品功能结构思维导图：\n<content>${fileContent}</content>`
  if (userInput.trim()) {
    prompt += `\n用户输入：\n<content>${userInput}</content>`
  }
  return prompt
}

async function consumeStream(
  config: LLMConfig,
  chatMessages: ChatMessage[],
  signal: AbortSignal,
  onChunk: (accumulated: string, thinking: string | null) => Promise<void>,
): Promise<StreamResult> {
  const generator = streamChatCompletion(config, chatMessages, signal)
  let accumulated = ''
  let thinkingContent: string | null = null
  let result: StreamResult = { content: '', finishReason: null, thinkingContent: null }

  for await (const chunk of generator) {
    accumulated += chunk
    await onChunk(accumulated, thinkingContent)
  }

  const returnResult = await generator.return(undefined as never)
  if (returnResult.done && returnResult.value) {
    result = returnResult.value
    thinkingContent = result.thinkingContent
    if (thinkingContent) {
      await onChunk(accumulated, thinkingContent)
    }
  }

  return result
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

        const result = await consumeStream(
          config,
          currentMessages,
          signal,
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

  const startGeneration = useCallback(
    async (conversationId: string, configId: string, fileContent: string, userInput: string) => {
      const config = getConfigById(configId)
      if (!config) throw new Error('未找到模型配置')

      const pingResult = await pingLLM(config)
      if (!pingResult.success) {
        throw new Error(`模型连通性检查失败: ${pingResult.error}`)
      }

      accumulateRef.current = ''
      const abortController = new AbortController()

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
      await addMessage(userMessage)

      const assistantMessage: Message = {
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
      await addMessage(assistantMessage)

      setStreamState({
        isStreaming: true,
        currentPartIndex: 1,
        totalParts: null,
        abortController,
      })

      const chatMessages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ]

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
    [systemPrompt, autoContinue, addMessage, updateMessage, setStreamState, getConfigById, streamWithAutoContinue],
  )

  const continueGeneration = useCallback(async () => {
    if (!activeConversationId || streamState.abortController) return

    const configId = useConversationStore.getState().conversations.find(
      (c) => c.id === activeConversationId,
    )?.llmConfigId
    if (!configId) return
    const config = getConfigById(configId)
    if (!config) return

    const lastAssistantMsg = [...messages].reverse().find((m) => m.role === 'assistant')
    if (!lastAssistantMsg) return

    const abortController = new AbortController()
    setStreamState({
      isStreaming: true,
      abortController,
    })

    await updateMessage(lastAssistantMsg.id, { status: 'streaming' })

    const chatMessages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
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

  return {
    startGeneration,
    continueGeneration,
    stopStreaming,
    streamState,
  }
}
