import { useEffect, useCallback, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { AlertCircle, FileText } from 'lucide-react'
import { streamChatCompletion } from '@/services/llm'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MessageBubble } from '@/components/run/MessageBubble'
import { ThinkingPanel } from '@/components/run/ThinkingPanel'
import { ChatInput } from '@/components/run/ChatInput'
import { StopButton } from '@/components/run/StopButton'
import { ContinueButton } from '@/components/run/ContinueButton'
import { MarkdownPreview } from '@/components/run/MarkdownPreview'
import { EditorToolbar } from '@/components/run/EditorToolbar'
import { ProgressIndicator } from '@/components/run/ProgressIndicator'
import { useConversationStore } from '@/stores/conversationStore'
import { useLLMStream } from '@/hooks/useLLMStream'
import { useAppStore } from '@/stores/appStore'
import { useLLMStore } from '@/stores/llmStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { db } from '@/db'
import type { Message, ChatMessage } from '@/types'

export function RunPage() {
  const { id } = useParams<{ id: string }>()
  const { setActiveConversation, messages, activeConversationId, conversations, addMessage } =
    useConversationStore()
  const { streamState, stopStreaming, continueGeneration, startGeneration } = useLLMStream()
  const { setSidebarCollapsed } = useAppStore()
  const { getConfigById } = useLLMStore()
  const { systemPrompt } = useSettingsStore()
  const startedRef = useRef(false)
  const streamingRef = useRef(false)

  useEffect(() => {
    setSidebarCollapsed(true)
    if (id) {
      setActiveConversation(id)
    }
    return () => setSidebarCollapsed(false)
  }, [id, setActiveConversation, setSidebarCollapsed])

  const conversation = conversations.find((c) => c.id === id)
  const modelConfig = conversation ? getConfigById(conversation.llmConfigId) : undefined
  const hasAssistantMessage = messages.some((m) => m.role === 'assistant')

  useEffect(() => {
    if (id && conversation && !hasAssistantMessage && !streamState.isStreaming && !startedRef.current) {
      startedRef.current = true
      startGeneration(
        id,
        conversation.llmConfigId,
        conversation.sourceFileContent,
        conversation.userDescription,
      ).catch((err) => {
        toast.error(err instanceof Error ? err.message : '生成失败')
      })
    }
  }, [id, conversation, hasAssistantMessage, streamState.isStreaming, startGeneration])

  useEffect(() => {
    startedRef.current = false
  }, [id])

  const handleSendMessage = useCallback(
    async (input: string) => {
      if (!activeConversationId || !conversation || !modelConfig) return
      // Guard against concurrent streams
      if (streamingRef.current || useConversationStore.getState().streamState.isStreaming) {
        toast.error('请等待当前生成完成后再发送消息')
        return
      }

      streamingRef.current = true

      const userMessage: Message = {
        id: crypto.randomUUID(),
        conversationId: activeConversationId,
        role: 'user',
        content: input,
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
        conversationId: activeConversationId,
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

      const chatMessages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
      ]
      for (const msg of [...messages, userMessage]) {
        if (msg.role === 'user' || msg.role === 'assistant') {
          chatMessages.push({ role: msg.role, content: msg.content })
        }
      }

      const abortController = new AbortController()
      useConversationStore.getState().setStreamState({
        isStreaming: true,
        currentPartIndex: 1,
        totalParts: null,
        abortController,
      })

      try {
        const generator = streamChatCompletion(modelConfig, chatMessages, abortController.signal)
        let accumulated = ''

        for await (const chunk of generator) {
          accumulated += chunk
          await useConversationStore.getState().updateMessage(assistantMessage.id, {
            content: accumulated,
          })
        }
        await useConversationStore.getState().updateMessage(assistantMessage.id, {
          status: 'completed',
          totalParts: 1,
        })
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          await useConversationStore.getState().updateMessage(assistantMessage.id, { status: 'stopped' })
        } else {
          await useConversationStore.getState().updateMessage(assistantMessage.id, {
            status: 'error',
            errorMessage: err instanceof Error ? err.message : 'Unknown error',
          })
        }
      } finally {
        streamingRef.current = false
        useConversationStore.getState().setStreamState({
          isStreaming: false,
          currentPartIndex: 0,
          totalParts: null,
          abortController: null,
        })
        await db.conversations.update(activeConversationId, { updatedAt: Date.now() })
      }
    },
    [activeConversationId, conversation, modelConfig, messages, systemPrompt, addMessage],
  )

  const assistantMessage = messages.find((m) => m.role === 'assistant')
  const needsManualContinue =
    assistantMessage?.status === 'stopped' &&
    streamState.currentPartIndex > 0 &&
    !streamState.isStreaming

  if (conversation && !modelConfig) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
          <h2 className="mt-4 text-lg font-medium">模型不可用</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            该对话使用的模型已被删除，请重新配置。
          </p>
          <Button variant="outline" className="mt-4" onClick={() => window.history.back()}>
            返回
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full">
      {/* Middle: Conversation panel */}
      <div className="flex w-80 shrink-0 flex-col border-r">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <h2 className="text-sm font-medium">对话</h2>
          {streamState.isStreaming && <StopButton onClick={stopStreaming} />}
        </div>

        {streamState.isStreaming && (
          <ProgressIndicator
            partIndex={streamState.currentPartIndex}
            totalParts={streamState.totalParts}
          />
        )}

        <ScrollArea className="flex-1">
          <div className="px-3">
            {messages.length === 0 && !streamState.isStreaming && (
              <div className="flex items-center justify-center py-8 text-xs text-muted-foreground">
                准备生成...
              </div>
            )}
            {messages.map((msg) => (
              <div key={msg.id}>
                <MessageBubble message={msg} />
                {msg.role === 'assistant' && msg.thinkingContent && (
                  <ThinkingPanel
                    content={msg.thinkingContent}
                    isStreaming={msg.status === 'streaming'}
                  />
                )}
              </div>
            ))}
            {needsManualContinue && (
              <div className="py-2">
                <ContinueButton onClick={continueGeneration} />
              </div>
            )}
          </div>
        </ScrollArea>

        <ChatInput onSend={handleSendMessage} disabled={streamState.isStreaming || !modelConfig} />
      </div>

      {/* Right: Editor/Preview panel */}
      <div className="flex min-w-0 flex-1 flex-col">
        <EditorToolbar
          content={assistantMessage?.content || ''}
          fileName={conversation?.title ? `${conversation.title}.md` : undefined}
        />
        <ScrollArea className="flex-1">
          {assistantMessage?.content ? (
            <div className="px-8 py-6">
              <MarkdownPreview content={assistantMessage.content} />
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
              <FileText className="h-10 w-10 opacity-30" />
              <p className="text-sm">
                {streamState.isStreaming ? '正在生成...' : '等待生成'}
              </p>
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  )
}
