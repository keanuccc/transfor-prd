import { useEffect, useCallback, useRef, useState, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { AlertCircle, FileText, GitCompare, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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

export function RunPage() {
  const { id } = useParams<{ id: string }>()
  const { setActiveConversation, messages, activeConversationId, conversations, updateMessage } =
    useConversationStore()
  const { streamState, stopStreaming, continueGeneration, startGeneration, sendMessage, refine, startComparison } =
    useLLMStream()
  const { setSidebarCollapsed } = useAppStore()
  const { getConfigById, configs } = useLLMStore()
  const startedRef = useRef(false)
  const [editMode, setEditMode] = useState(false)
  const [editContent, setEditContent] = useState('')
  const [compareModelId, setCompareModelId] = useState<string>('')
  const [compareLoading, setCompareLoading] = useState(false)
  const [showCompare, setShowCompare] = useState(false)

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
        conversation.templateId,
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
      if (streamState.isStreaming) {
        toast.error('请等待当前生成完成后再发送消息')
        return
      }

      sendMessage(activeConversationId, conversation.llmConfigId, input, messages).catch((err) => {
        toast.error(err instanceof Error ? err.message : '发送失败')
      })
    },
    [activeConversationId, conversation, modelConfig, messages, streamState.isStreaming, sendMessage],
  )

  const assistantMessage = messages.find((m) => m.role === 'assistant')
  const needsManualContinue =
    assistantMessage?.status === 'stopped' &&
    streamState.currentPartIndex > 0 &&
    !streamState.isStreaming

  const handleRefine = useCallback(() => {
    if (streamState.isStreaming) {
      toast.error('请等待当前生成完成后再执行精修')
      return
    }
    refine().catch((err) => {
      toast.error(err instanceof Error ? err.message : '精修失败')
    })
  }, [refine, streamState.isStreaming])

  const handleCompare = useCallback(async () => {
    if (streamState.isStreaming) {
      toast.error('请等待当前生成完成后再进行对比')
      return
    }
    if (!compareModelId) {
      toast.error('请选择对比模型')
      return
    }
    setCompareLoading(true)
    try {
      await startComparison(compareModelId)
      setShowCompare(true)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '对比生成失败')
    } finally {
      setCompareLoading(false)
    }
  }, [compareModelId, streamState.isStreaming, startComparison])

  // Find comparison assistant message
  const comparisonAssistantMsg = useMemo(() => {
    const compareUserIdx = messages.findIndex((m) => m.role === 'user' && m.content.startsWith('[模型对比:'))
    if (compareUserIdx === -1) return null
    // The assistant message right after the comparison user message
    for (let i = compareUserIdx + 1; i < messages.length; i++) {
      if (messages[i].role === 'assistant') return messages[i]
    }
    return null
  }, [messages])

  // Other models (exclude the current conversation's model)
  const otherModels = useMemo(() => {
    if (!conversation) return configs
    return configs.filter((c) => c.id !== conversation.llmConfigId)
  }, [configs, conversation])

  const handleToggleEditMode = useCallback(() => {
    setEditMode((prev) => {
      if (!prev && assistantMessage) {
        setEditContent(assistantMessage.content)
      } else if (prev && assistantMessage) {
        updateMessage(assistantMessage.id, { content: editContent })
      }
      return !prev
    })
  }, [assistantMessage, editContent, updateMessage])

  const currentContent = editMode ? editContent : (assistantMessage?.content || '')

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
          content={currentContent}
          fileName={conversation?.title ? `${conversation.title}.md` : undefined}
          editMode={editMode}
          isStreaming={streamState.isStreaming}
          onToggleEditMode={handleToggleEditMode}
          onRefine={handleRefine}
        />

        {/* Comparison bar */}
        {currentContent && otherModels.length > 0 && (
          <div className="flex items-center gap-2 border-b px-3 py-1.5">
            <GitCompare className="h-3.5 w-3.5 text-muted-foreground" />
            <Select value={compareModelId} onValueChange={(v) => setCompareModelId(v || '')}>
              <SelectTrigger className="h-7 w-44 text-xs">
                <SelectValue placeholder="选择对比模型" />
              </SelectTrigger>
              <SelectContent>
                {otherModels.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.modelName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={handleCompare}
              disabled={!compareModelId || compareLoading || streamState.isStreaming}
            >
              {compareLoading ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
              开始对比
            </Button>
            {showCompare && (
              <Button
                variant="ghost"
                size="icon-xs"
                className="ml-auto"
                onClick={() => setShowCompare(false)}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        )}

        <ScrollArea className="flex-1">
          {currentContent ? (
            showCompare && comparisonAssistantMsg ? (
              <div className="grid grid-cols-2 divide-x h-full">
                {/* Original */}
                <div className="px-6 py-4 overflow-auto">
                  <div className="mb-2 text-xs font-medium text-muted-foreground">
                    主模型
                  </div>
                  {editMode ? (
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="min-h-[40vh] font-mono text-sm leading-relaxed resize-none"
                    />
                  ) : (
                    <MarkdownPreview content={currentContent} />
                  )}
                </div>
                {/* Comparison */}
                <div className="px-6 py-4 overflow-auto">
                  <div className="mb-2 text-xs font-medium text-muted-foreground">
                    对比模型
                  </div>
                  {comparisonAssistantMsg.status === 'streaming' ? (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      正在生成...
                    </div>
                  ) : null}
                  <MarkdownPreview content={comparisonAssistantMsg.content || ' '} />
                </div>
              </div>
            ) : (
              <div className="px-8 py-6">
                {editMode ? (
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="min-h-[60vh] font-mono text-sm leading-relaxed resize-none"
                  />
                ) : (
                  <MarkdownPreview content={currentContent} />
                )}
              </div>
            )
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
