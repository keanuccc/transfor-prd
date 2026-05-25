import { useEffect, useCallback, useRef, useState, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { AlertCircle, Columns2, FileText, GitCompare, Loader2, Trophy, X } from 'lucide-react'
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
import { SkeletonPrd } from '@/components/run/SkeletonPrd'
import { TableOfContents } from '@/components/run/TableOfContents'
import { DiffView } from '@/components/run/DiffView'
import { BackToTop } from '@/components/run/BackToTop'
import { ScorePanel } from '@/components/run/ScorePanel'
import { CompetitionView } from '@/components/run/CompetitionView'
import { VersionHistory } from '@/components/run/VersionHistory'
import { ShareDialog } from '@/components/run/ShareDialog'
import { SyncDialog } from '@/components/run/SyncDialog'
import { IssueSyncPanel } from '@/components/run/IssueSyncPanel'
import { useSnapshotStore } from '@/stores/snapshotStore'
import { parseScores, type ReviewScores } from '@/lib/reviewScoring'
import { useConversationStore } from '@/stores/conversationStore'
import { useLLMStream } from '@/hooks/useLLMStream'
import { useAppStore } from '@/stores/appStore'
import { useLLMStore } from '@/stores/llmStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { cn } from '@/lib/utils'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { playCompletionSound } from '@/lib/sound'

export function RunPage() {
  const { id } = useParams<{ id: string }>()
  const { setActiveConversation, messages, activeConversationId, conversations, updateMessage } =
    useConversationStore()
  const { streamState, stopStreaming, continueGeneration, startGeneration, sendMessage, refine, review, scoreReview, estimateTimeline, reverseToMindMap, generateCodeSkeleton, startComparison, startCompetition } =
    useLLMStream()
  const { setSidebarCollapsed } = useAppStore()
  const { getConfigById, configs } = useLLMStore()
  const startedForIdRef = useRef<string | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [editContent, setEditContent] = useState('')
  const [compareModelId, setCompareModelId] = useState<string>('')
  const [compareLoading, setCompareLoading] = useState(false)
  const [showCompare, setShowCompare] = useState(false)
  const [compareDiffMode, setCompareDiffMode] = useState(false)
  const [scoreReviewResult, setScoreReviewResult] = useState<ReviewScores | null>(null)
  const [scoreReviewLoading, setScoreReviewLoading] = useState(false)
  const [reverseMindMapPending, setReverseMindMapPending] = useState(false)
  const [competitionModelIds, setCompetitionModelIds] = useState<string[]>([])
  const [competitionRunning, setCompetitionRunning] = useState(false)
  const [showCompetition, setShowCompetition] = useState(false)
  const [competitionMsgIds, setCompetitionMsgIds] = useState<string[]>([])
  const [showVersionHistory, setShowVersionHistory] = useState(false)
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [showSyncDialog, setShowSyncDialog] = useState(false)
  const [showIssueSync, setShowIssueSync] = useState(false)
  const { loadSnapshots, createSnapshot } = useSnapshotStore()
  const prdViewportRef = useRef<HTMLDivElement>(null)
  const enableCompletionSound = useSettingsStore((s) => s.enableCompletionSound)

  const collapsedSnapshot = useRef(false)

  useEffect(() => {
    // Only set active if not already set (avoids redundant loadMessages + race with streaming)
    if (id && activeConversationId !== id) {
      setActiveConversation(id)
    }
  }, [id, activeConversationId, setActiveConversation])

  useEffect(() => {
    // Auto-collapse sidebar on mount, restore on unmount
    if (!collapsedSnapshot.current) {
      collapsedSnapshot.current = true
      setSidebarCollapsed(true)
    }
    return () => {
      setSidebarCollapsed(false)
      collapsedSnapshot.current = false
    }
  }, [setSidebarCollapsed])

  const conversation = conversations.find((c) => c.id === id)

  // Load snapshots when conversation changes
  useEffect(() => {
    if (id) {
      loadSnapshots(id)
    }
  }, [id, loadSnapshots])

  const modelConfig = conversation ? getConfigById(conversation.llmConfigId) : undefined
  const hasAssistantMessage = messages.some((m) => m.role === 'assistant')

  useEffect(() => {
    if (id && conversation && !hasAssistantMessage && !streamState.isStreaming && startedForIdRef.current !== id) {
      startedForIdRef.current = id
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


  const prevIsStreaming = useRef(false)
  const assistantMessage = messages.find((m) => m.role === 'assistant')
  // Collect all assistant messages with smart labels for view switching
  const allAssistantMsgs = useMemo(() => {
    const assistantMsgs = messages.filter((m) => m.role === 'assistant')
    return assistantMsgs.map((msg, idx) => {
      if (idx === 0) return { ...msg, label: 'PRD 文档' }
      const ac = msg.content || ''
      // Detect by assistant output content pattern
      if (ac.includes('项目目录结构') || ac.includes('```typescript') || ac.includes('```sql')) {
        return { ...msg, label: '代码骨架' }
      }
      if (ac.includes('"completeness"')) {
        return { ...msg, label: '评分结果' }
      }
      if (ac.includes('mermaid') && ac.includes('gantt')) {
        return { ...msg, label: '时间轴' }
      }
      // Fallback: check preceding user prompt
      const msgIndex = messages.indexOf(msg)
      const prevUserMsg = [...messages.slice(0, msgIndex)].reverse().find((m) => m.role === 'user')
      const uc = prevUserMsg?.content || ''
      if (uc.includes('精修')) return { ...msg, label: '精修' }
      if (uc.includes('审阅')) return { ...msg, label: '审阅' }
      if (uc.includes('逆向') || uc.includes('思维导图')) return { ...msg, label: '思维导图' }
      return { ...msg, label: '输出 ' + String(idx + 1) }
    })
  }, [messages])

  const [activeViewId, setActiveViewId] = useState<string | null>(null)
  const prevAssistantCount = useRef(0)

  // Auto-switch to latest assistant message, or default to first PRD
  useEffect(() => {
    if (allAssistantMsgs.length === 0) {
      setActiveViewId(null)
      prevAssistantCount.current = 0
      return
    }
    if (allAssistantMsgs.length > prevAssistantCount.current) {
      setActiveViewId(allAssistantMsgs[allAssistantMsgs.length - 1].id)
    } else if (!activeViewId || !allAssistantMsgs.find((m) => m.id === activeViewId)) {
      setActiveViewId(allAssistantMsgs[0].id)
    }
    prevAssistantCount.current = allAssistantMsgs.length
  }, [allAssistantMsgs])

  // Active view message
  const activeAssistantMsg = useMemo(
    () => allAssistantMsgs.find((m) => m.id === activeViewId) || null,
    [allAssistantMsgs, activeViewId],
  )

  useEffect(() => {
    if (prevIsStreaming.current && !streamState.isStreaming && assistantMessage?.content && enableCompletionSound) {
      playCompletionSound()
    }
    prevIsStreaming.current = streamState.isStreaming
  }, [streamState.isStreaming, assistantMessage?.content, enableCompletionSound])

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

  const needsManualContinue =
    assistantMessage?.status === 'stopped' &&
    streamState.currentPartIndex > 0 &&
    !streamState.isStreaming

  const handleRefine = useCallback(() => {
    if (streamState.isStreaming) {
      toast.error('请等待当前生成完成后再执行精修')
      return
    }
    const content = assistantMessage?.content
    if (content && id) {
      createSnapshot(id, content, `精修前自动保存 - ${new Date().toLocaleString('zh-CN')}`)
    }
    refine().catch((err) => {
      toast.error(err instanceof Error ? err.message : '精修失败')
    })
  }, [refine, streamState.isStreaming, assistantMessage?.content, id, createSnapshot])

  const handleReview = useCallback(() => {
    if (streamState.isStreaming) {
      toast.error('请等待当前生成完成后再执行审阅')
      return
    }
    review().catch((err) => {
      toast.error(err instanceof Error ? err.message : '审阅失败')
    })
  }, [review, streamState.isStreaming])

  const handleScoreReview = useCallback(() => {
    if (streamState.isStreaming) {
      toast.error('请等待当前生成完成后再执行评审')
      return
    }
    setScoreReviewLoading(true)
    setScoreReviewResult(null)
    scoreReview().catch((err) => {
      toast.error(err instanceof Error ? err.message : '评审失败')
      setScoreReviewLoading(false)
    })
  }, [scoreReview, streamState.isStreaming])

  // Auto-parse scores when score review stream completes
  const prevScoreStreaming = useRef(false)
  useEffect(() => {
    if (scoreReviewLoading) {
      if (prevScoreStreaming.current && !streamState.isStreaming) {
        // Stream just finished
        const latestMsg = [...messages].reverse().find((m) => m.role === 'assistant')
        if (latestMsg?.content && latestMsg.status !== 'error') {
          const parsed = parseScores(latestMsg.content)
          setScoreReviewResult(parsed)
        }
        setScoreReviewLoading(false)
      }
      prevScoreStreaming.current = streamState.isStreaming
    } else {
      prevScoreStreaming.current = false
    }
  }, [streamState.isStreaming, scoreReviewLoading, messages])

  const handleEstimateTimeline = useCallback(() => {
    if (streamState.isStreaming) {
      toast.error('请等待当前生成完成后再执行预估')
      return
    }
    estimateTimeline().catch((err) => {
      toast.error(err instanceof Error ? err.message : '预估失败')
    })
  }, [estimateTimeline, streamState.isStreaming])

  const handleReverseToMindMap = useCallback(() => {
    if (streamState.isStreaming) {
      toast.error('请等待当前生成完成后再执行')
      return
    }
    setReverseMindMapPending(true)
    reverseToMindMap().catch((err) => {
      toast.error(err instanceof Error ? err.message : '反向生成失败')
      setReverseMindMapPending(false)
    })
  }, [reverseToMindMap, streamState.isStreaming])

  const handleToggleVersionHistory = useCallback(() => {
    setShowVersionHistory((prev) => !prev)
  }, [])

  const handleRestoreVersion = useCallback((content: string) => {
    const target = activeAssistantMsg || assistantMessage
    if (target) {
      updateMessage(target.id, { content })
      toast.success('已恢复历史版本')
    }
  }, [activeAssistantMsg, assistantMessage, updateMessage])

  const handleGenerateCodeSkeleton = useCallback(() => {
    if (streamState.isStreaming) {
      toast.error('请等待当前生成完成后再执行')
      return
    }
    generateCodeSkeleton().catch((err) => {
      toast.error(err instanceof Error ? err.message : '代码骨架生成失败')
    })
  }, [generateCodeSkeleton, streamState.isStreaming])

  // Auto-download mind map when reverse generation completes
  const prevReverseStreaming = useRef(false)
  useEffect(() => {
    if (reverseMindMapPending) {
      if (prevReverseStreaming.current && !streamState.isStreaming) {
        const latestMsg = [...messages].reverse().find((m) => m.role === 'assistant')
        if (latestMsg?.content && latestMsg.status !== 'error') {
          const title = conversation?.title || '思维导图'
          const blob = new Blob([latestMsg.content], { type: 'text/markdown;charset=utf-8' })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `${title}-思维导图.md`
          a.click()
          URL.revokeObjectURL(url)
          toast.success('思维导图已下载')
        }
        setReverseMindMapPending(false)
      }
      prevReverseStreaming.current = streamState.isStreaming
    } else {
      prevReverseStreaming.current = false
    }
  }, [streamState.isStreaming, reverseMindMapPending, messages, conversation?.title])

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

  const handleStartCompetition = useCallback(async () => {
    if (streamState.isStreaming) {
      toast.error('请等待当前生成完成后再开始竞赛')
      return
    }
    if (competitionModelIds.filter(Boolean).length < 2) {
      toast.error('请至少选择 2 个竞赛模型')
      return
    }

    // Snapshot message IDs before competition, so we can find new ones after
    const beforeIds = new Set(messages.map((m) => m.id))

    setCompetitionRunning(true)
    setShowCompetition(true)

    try {
      // Include the current conversation's model as first competitor
      const allCompetitorIds = conversation?.llmConfigId
        ? [conversation.llmConfigId, ...competitionModelIds]
        : competitionModelIds
      await startCompetition(allCompetitorIds.slice(0, 3))

      // Find competition messages (new ones added during competition)
      const currentMsgs = useConversationStore.getState().messages
      const newAssistantIds = currentMsgs
        .filter((m) => !beforeIds.has(m.id) && m.role === 'assistant')
        .map((m) => m.id)
      setCompetitionMsgIds(newAssistantIds)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '竞赛失败')
    } finally {
      setCompetitionRunning(false)
    }
  }, [competitionModelIds, conversation?.llmConfigId, messages, streamState.isStreaming, startCompetition])

  // Compile competition competitors info
  const competitionCompetitors = useMemo(() => {
    if (!showCompetition || competitionMsgIds.length === 0) return []
    const currentMsgs = useConversationStore.getState().messages
    return competitionMsgIds.map((id) => {
      const msg = currentMsgs.find((m) => m.id === id) || null
      // Extract model name from the preceding user message
      const msgIdx = currentMsgs.findIndex((m) => m.id === id)
      let modelName = 'Unknown'
      if (msgIdx > 0) {
        const prevUserMsg = currentMsgs[msgIdx - 1]
        if (prevUserMsg?.role === 'user') {
          const match = prevUserMsg.content.match(/\[竞赛: (.+?)\]/)
          if (match) modelName = match[1]
        }
      }
      return { modelName, message: msg }
    })
  }, [showCompetition, competitionMsgIds, messages])

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
    const target = activeAssistantMsg || assistantMessage
    if (!editMode && target) {
      setEditContent(target.content)
    } else if (editMode && target && editContent !== target.content) {
      updateMessage(target.id, { content: editContent })
      if (id && target.content) {
        createSnapshot(id, target.content, `编辑前自动保存 - ${new Date().toLocaleString('zh-CN')}`)
      }
    }
    setEditMode((prev) => !prev)
  }, [editMode, activeAssistantMsg, assistantMessage, editContent, updateMessage, id, createSnapshot])

  const handleDownloadMd = useCallback(() => {
    const target = activeAssistantMsg || assistantMessage
    const content = target?.content
    if (!content) return
    const fileName = conversation?.title ? `${conversation.title}.md` : '文档.md'
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Markdown 下载成功')
  }, [activeAssistantMsg, assistantMessage?.content, conversation?.title])

  useKeyboardShortcuts({
    onToggleEdit: (activeAssistantMsg || assistantMessage) ? handleToggleEditMode : undefined,
    onExportMd: (activeAssistantMsg || assistantMessage) ? handleDownloadMd : undefined,
  })

  const currentContent = editMode ? editContent : ((activeAssistantMsg || assistantMessage)?.content || '')

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
      <div className="flex w-80 shrink-0 flex-col border-r border-border/50 bg-card/80 backdrop-blur-sm">
        <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
          <h2 className="text-sm font-semibold tracking-tight text-foreground/80">对话</h2>
          {streamState.isStreaming && <StopButton onClick={stopStreaming} />}
        </div>

        {streamState.isStreaming && (
          <ProgressIndicator
            partIndex={streamState.currentPartIndex}
            totalParts={streamState.totalParts}
          />
        )}

        <ScrollArea className="min-h-0 flex-1">
          <div className="px-3">
            {messages.length === 0 && !streamState.isStreaming && (
              <div className="flex items-center justify-center py-16 text-xs text-muted-foreground/50 italic">
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
          onReview={handleReview}
          onScoreReview={handleScoreReview}
          onEstimateTimeline={handleEstimateTimeline}
          onReverseToMindMap={handleReverseToMindMap}
          onGenerateCodeSkeleton={handleGenerateCodeSkeleton}
          onToggleVersionHistory={handleToggleVersionHistory}
          showVersionHistory={showVersionHistory}
          onShare={() => setShowShareDialog(true)}
          onSync={() => setShowSyncDialog(true)}
          onIssueSync={() => setShowIssueSync((p) => !p)}
          showIssueSync={showIssueSync}
        />

        

        {/* View switcher tabs for multiple assistant outputs */}
        {allAssistantMsgs.length > 1 && (
          <div className="flex items-center gap-1 border-b border-border/50 bg-muted/20 px-3 py-1.5 overflow-x-auto">
            {allAssistantMsgs.map((msg) => (
              <button
                key={msg.id}
                type="button"
                onClick={() => setActiveViewId(msg.id)}
                className={cn(
                  'shrink-0 px-3 py-1 text-xs rounded-md transition-colors',
                  msg.id === activeViewId
                    ? 'bg-card shadow-sm text-foreground font-medium ring-1 ring-border/30'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                )}
              >
                {msg.label}
                {msg.status === 'streaming' && (
                  <span className="ml-1 inline-block h-2 w-2 animate-pulse rounded-full bg-primary/60 align-middle" />
                )}
              </button>
            ))}
          </div>
        )}
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
              <div className="ml-auto flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon-xs"
                  title={compareDiffMode ? '并排对比' : '差异对比'}
                  onClick={() => setCompareDiffMode((p) => !p)}
                >
                  <Columns2 className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => { setShowCompare(false); setCompareDiffMode(false) }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Competition bar */}
        {currentContent && configs.length >= 2 && (
          <div className="flex items-center gap-2 border-b px-3 py-1.5">
            <Trophy className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-xs text-muted-foreground">竞赛模式</span>
            {Array.from({ length: 2 }).map((_, i) => (
              <Select
                key={i}
                value={competitionModelIds[i] || ''}
                onValueChange={(v) => {
                  setCompetitionModelIds((prev) => {
                    const next = [...prev]
                    next[i] = v || ''
                    return next
                  })
                }}
              >
                <SelectTrigger className="h-7 w-36 text-xs">
                  <SelectValue placeholder={`模型 ${i + 2}`} />
                </SelectTrigger>
                <SelectContent>
                  {configs.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.modelName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ))}
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={handleStartCompetition}
              disabled={competitionModelIds.length < 2 || competitionRunning || streamState.isStreaming}
            >
              {competitionRunning ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
              开始竞赛
            </Button>
            {showCompetition && (
              <Button
                variant="ghost"
                size="icon-xs"
                className="ml-auto"
                onClick={() => { setShowCompetition(false); setCompetitionMsgIds([]) }}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        )}

        <div className="flex min-h-0 flex-1">
          <ScrollArea className="min-h-0 flex-1" viewportRef={prdViewportRef}>
            {currentContent ? (
              showCompetition && competitionCompetitors.length > 0 ? (
                <CompetitionView competitors={competitionCompetitors} />
              ) : showCompare && comparisonAssistantMsg ? (
                compareDiffMode ? (
                  <div className="px-4 py-4">
                    <DiffView
                      original={currentContent}
                      updated={comparisonAssistantMsg.content || ''}
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 divide-x divide-border/50 h-full">
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
                )
              ) : (
                <div className="px-10 py-8">
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
            ) : streamState.isStreaming ? (
              <SkeletonPrd />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-muted-foreground/50 animate-[subtle-pulse_3s_ease-in-out_infinite]">
                <FileText className="h-12 w-12 opacity-20" />
                <p className="text-sm">等待生成</p>
              </div>
            )}
          </ScrollArea>

          {currentContent && !editMode && !showCompare && showVersionHistory && id && (
            <VersionHistory
              conversationId={id}
              currentContent={currentContent}
              onRestore={handleRestoreVersion}
              onClose={() => setShowVersionHistory(false)}
            />
          )}
          {currentContent && !editMode && !showCompare && showIssueSync && (
            <IssueSyncPanel
              content={currentContent}
              onClose={() => setShowIssueSync(false)}
            />
          )}
          {currentContent && !editMode && !showCompare && !showVersionHistory && !showIssueSync && (
            <div className="w-44 shrink-0 overflow-auto border-l border-border/50 bg-muted/20 px-3 py-4">
              <TableOfContents content={currentContent} />
            </div>
          )}
        </div>

        <ScorePanel scores={scoreReviewResult} loading={scoreReviewLoading} onClose={() => { setScoreReviewResult(null); setScoreReviewLoading(false) }} />

        <BackToTop container={prdViewportRef.current} />

        <ShareDialog
          open={showShareDialog}
          onOpenChange={setShowShareDialog}
          content={currentContent}
        />

        <SyncDialog
          open={showSyncDialog}
          onOpenChange={setShowSyncDialog}
          content={currentContent}
          title={conversation?.title || 'PRD 文档'}
        />
      </div>
    </div>
  )
}
