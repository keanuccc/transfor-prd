import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ChevronDown, Settings2 } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { FileUpload, type FileItem } from '@/components/home/FileUpload'
import { ModelSelector } from '@/components/home/ModelSelector'
import { TemplateSelector } from '@/components/home/TemplateSelector'
import { StyleSelector } from '@/components/home/StyleSelector'
import { GenerateButton } from '@/components/home/GenerateButton'
import { ClarifyToggle } from '@/components/home/ClarifyToggle'
import { ClarificationDialog } from '@/components/home/ClarificationDialog'
import { MindMapTree } from '@/components/home/MindMapTree'
import { BatchProgress, type BatchFileStatus } from '@/components/home/BatchProgress'
import { defaultTemplate } from '@/lib/templates'
import { STYLE_OPTIONS } from '@/lib/stylePrompts'
import { cn } from '@/lib/utils'
import { useLLMStore } from '@/stores/llmStore'
import { useConversationStore } from '@/stores/conversationStore'
import { useLLMStream } from '@/hooks/useLLMStream'
import { sendChatCompletion } from '@/services/llm'
import { SUPPORTED_FILE_EXTENSIONS } from '@/lib/constants'

export function HomePage() {
  const navigate = useNavigate()
  const { getDefaultConfig, configs } = useLLMStore()
  const { createConversation, setActiveConversation } = useConversationStore()
  const { startGeneration } = useLLMStream()

  const [files, setFiles] = useState<FileItem[]>([])
  const [userInput, setUserInput] = useState('')
  const [selectedModelId, setSelectedModelId] = useState<string | undefined>()
  const [selectedTemplateId, setSelectedTemplateId] = useState(defaultTemplate.id)
  const [styleId, setStyleId] = useState('default')
  const [loading, setLoading] = useState(false)
  const [clarifyEnabled, setClarifyEnabled] = useState(true)
  const [clarifyQuestions, setClarifyQuestions] = useState<string[]>([])
  const [showClarifyDialog, setShowClarifyDialog] = useState(false)
  const [clarifyLoading, setClarifyLoading] = useState(false)
  const [batchItems, setBatchItems] = useState<BatchFileStatus[]>([])
  const [batchRunning, setBatchRunning] = useState(false)
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set())
  const [showAdvanced, setShowAdvanced] = useState(false)

  const handleFilesChange = useCallback((newFiles: FileItem[]) => {
    // Validate extensions
    const valid: FileItem[] = []
    for (const item of newFiles) {
      const ext = '.' + item.file.name.split('.').pop()?.toLowerCase()
      if (!SUPPORTED_FILE_EXTENSIONS.includes(ext)) {
        valid.push({ ...item, error: '不支持的文件格式，请上传 .md 或 .markdown 文件' })
      } else {
        valid.push(item)
      }
    }
    setFiles(valid)
    setSelectedPaths(new Set())
  }, [])

  const doGenerate = useCallback(async (finalUserInput: string, fileContent: string, fileName: string) => {
    const config = selectedModelId
      ? useLLMStore.getState().getConfigById(selectedModelId)
      : getDefaultConfig()

    if (!config) {
      toast.error('请先在设置中配置模型')
      return
    }

    const convId = crypto.randomUUID()
    const title = fileName.replace(/\.(md|markdown)$/i, '') || '新对话'

    const stylePrompt = STYLE_OPTIONS.find((s) => s.id === styleId)?.prompt || ''
    const fullDescription = finalUserInput + stylePrompt

    const selectedContent = selectedPaths.size > 0
      ? Array.from(selectedPaths).join('\n')
      : fileContent

    await createConversation({
      id: convId,
      title,
      llmConfigId: config.id,
      templateId: selectedTemplateId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      sourceFileName: fileName,
      sourceFileContent: selectedContent,
      userDescription: fullDescription,
      tags: [],
      starred: false,
    })

    await setActiveConversation(convId)
    navigate(`/run/${convId}`)
    // RunPage auto-start effect handles startGeneration
  }, [selectedModelId, styleId, selectedTemplateId, selectedPaths, createConversation, setActiveConversation, navigate, getDefaultConfig])

  const doBatchGenerate = useCallback(async () => {
    const config = selectedModelId
      ? useLLMStore.getState().getConfigById(selectedModelId)
      : getDefaultConfig()

    if (!config) {
      toast.error('请先在设置中配置模型')
      return
    }

    setBatchRunning(true)
    const validFiles = files.filter((f) => !f.error && f.content)
    const items: BatchFileStatus[] = validFiles.map((f) => ({ file: f, status: 'pending' as const }))
    setBatchItems(items)

    let errorCount = 0

    for (let i = 0; i < validFiles.length; i++) {
      const item = validFiles[i]
      setBatchItems((prev) => prev.map((bi, idx) => idx === i ? { ...bi, status: 'running' } : bi))

      const convId = crypto.randomUUID()
      const title = item.file.name.replace(/\.(md|markdown)$/i, '') || '新对话'

      const stylePrompt = STYLE_OPTIONS.find((s) => s.id === styleId)?.prompt || ''
      const fullDescription = userInput + stylePrompt

      try {
        await createConversation({
          id: convId,
          title,
          llmConfigId: config.id,
          templateId: selectedTemplateId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          sourceFileName: item.file.name,
          sourceFileContent: item.content,
          userDescription: fullDescription,
          tags: [],
          starred: false,
        })

        await setActiveConversation(convId)
        await startGeneration(convId, config.id, item.content, fullDescription, selectedTemplateId)

        setBatchItems((prev) => prev.map((bi, idx) => idx === i ? { ...bi, status: 'completed' } : bi))
      } catch (err) {
        errorCount++
        const errMsg = err instanceof Error ? err.message : '生成失败'
        setBatchItems((prev) => prev.map((bi, idx) => idx === i ? {
          ...bi,
          status: 'error',
          error: errMsg,
        } : bi))
        toast.error(`${item.file.name}: ${errMsg}`)
      }
    }

    setBatchRunning(false)
    const completed = validFiles.length - errorCount
    toast.success(`批量生成完成: ${completed}/${validFiles.length}`)
  }, [files, userInput, styleId, selectedModelId, selectedTemplateId, createConversation, setActiveConversation, getDefaultConfig, startGeneration])

  const handleGenerate = useCallback(async () => {
    if (clarifyLoading || showClarifyDialog) return
    const validFiles = files.filter((f) => !f.error && f.content)
    if (validFiles.length === 0) {
      toast.error('请先上传有效的 Markdown 文件')
      return
    }

    const config = selectedModelId
      ? useLLMStore.getState().getConfigById(selectedModelId)
      : getDefaultConfig()

    if (!config) {
      toast.error('请先在设置中配置模型')
      return
    }

    // Batch mode: multiple files
    if (validFiles.length > 1) {
      doBatchGenerate()
      return
    }

    // Single file mode
    if (!clarifyEnabled) {
      setLoading(true)
      doGenerate(userInput, validFiles[0].content, validFiles[0].file.name).finally(() => setLoading(false))
      return
    }

    setClarifyQuestions([])
    setClarifyLoading(true)
    setShowClarifyDialog(true)
    try {
      const response = await sendChatCompletion(config, [
        {
          role: 'user',
          content: `基于以下产品思维导图，请提出 2-3 个关键的需求澄清问题。请以 JSON 字符串数组格式返回，只返回 JSON 数组，不要包含其他内容。\n\n示例格式：["问题1", "问题2", "问题3"]\n\n思维导图内容：\n${validFiles[0].content}`,
        },
      ])

      const jsonMatch = response.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        const questions = [...new Set(JSON.parse(jsonMatch[0]) as string[])]
        if (Array.isArray(questions) && questions.length > 0) {
          setClarifyQuestions(questions)
        } else {
          setClarifyQuestions(['系统的主要目标用户是谁？', '预期的用户量级是多少？', '有没有特别的技术约束？'])
        }
      } else {
        setClarifyQuestions(['系统的主要目标用户是谁？', '预期的用户量级是多少？', '有没有特别的技术约束？'])
      }
    } catch {
      setClarifyQuestions(['系统的主要目标用户是谁？', '预期的用户量级是多少？', '有没有特别的技术约束？'])
    } finally {
      setClarifyLoading(false)
    }
  }, [files, clarifyEnabled, userInput, selectedModelId, getDefaultConfig, doGenerate, doBatchGenerate, clarifyLoading, showClarifyDialog])

  const handleClarifyConfirm = useCallback((answers: string[]) => {
    setShowClarifyDialog(false)
    const validFile = files.find((f) => !f.error && f.content)
    if (!validFile) return
    const qaText = clarifyQuestions
      .map((q, i) => `Q: ${q}\nA: ${answers[i] || '未回答'}`)
      .join('\n\n')
    const finalInput = userInput
      ? `${userInput}\n\n需求澄清：\n${qaText}`
      : `需求澄清：\n${qaText}`
    setLoading(true)
    doGenerate(finalInput, validFile.content, validFile.file.name).finally(() => setLoading(false))
  }, [clarifyQuestions, userInput, files, doGenerate])

  const handleClarifySkip = useCallback(() => {
    setShowClarifyDialog(false)
    if (clarifyLoading) return
    const validFile = files.find((f) => !f.error && f.content)
    if (!validFile) return
    setLoading(true)
    doGenerate(userInput, validFile.content, validFile.file.name).finally(() => setLoading(false))
  }, [userInput, files, doGenerate, clarifyLoading])

  const isBatch = files.filter((f) => !f.error && f.content).length > 1

  const hasValidFiles = files.filter((f) => !f.error && f.content).length > 0

  return (
    <div className="flex h-full justify-center overflow-auto bg-gradient-to-b from-background via-background to-muted/20">
      <div className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 size-[40rem] rounded-full bg-foreground/[0.02] blur-3xl" />
      <div className="relative flex w-full max-w-2xl flex-col px-6 py-6">

        {/* Header */}
        <div className="mb-5 text-center">
          <h1 className="text-2xl font-bold tracking-tight">
            Markdown 思维导图转 PRD
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            上传产品功能结构思维导图，生成详细的产品功能描述文档
          </p>
        </div>

        {/* Upload card */}
        <div className="rounded-xl border border-border/40 bg-card/80 p-4 shadow-sm backdrop-blur-sm">
          <Label className="text-xs font-medium">
            上传文件 <span className="text-destructive">*</span>
          </Label>
          <div className="mt-1.5">
            <FileUpload
              files={files}
              multiple
              onFilesChange={handleFilesChange}
            />
          </div>

          {!isBatch && files.length === 1 && files[0].content && (
            <div className="mt-3">
              <MindMapTree
                content={files[0].content}
                selectedPaths={selectedPaths}
                onSelectedPathsChange={setSelectedPaths}
              />
            </div>
          )}
        </div>

        {/* Quick settings row */}
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-border/40 bg-card/80 p-3 shadow-sm backdrop-blur-sm">
            <Label className="text-xs font-medium">写作风格</Label>
            <div className="mt-1.5">
              <StyleSelector value={styleId} onChange={setStyleId} />
            </div>
          </div>
          <div className="rounded-xl border border-border/40 bg-card/80 p-3 shadow-sm backdrop-blur-sm">
            <Label className="text-xs font-medium">选择模型</Label>
            <div className="mt-1.5">
              <ModelSelector value={selectedModelId} onChange={setSelectedModelId} />
            </div>
          </div>
        </div>

        {/* Advanced settings collapsible */}
        <div className="mt-3 rounded-xl border border-border/40 bg-card/80 shadow-sm backdrop-blur-sm overflow-hidden">
          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className="flex w-full items-center justify-between px-4 py-2.5 text-xs font-medium text-muted-foreground hover:bg-muted/40 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <Settings2 className="h-3.5 w-3.5" />
              更多设置
            </span>
            <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', showAdvanced && 'rotate-180')} />
          </button>
          {showAdvanced && (
            <div className="border-t border-border/40 px-4 py-3 space-y-3">
              <div>
                <Label className="text-xs font-medium">选择模板</Label>
                <div className="mt-1.5">
                  <TemplateSelector value={selectedTemplateId} onChange={setSelectedTemplateId} />
                </div>
              </div>
              {!isBatch && (
                <ClarifyToggle checked={clarifyEnabled} onChange={setClarifyEnabled} />
              )}
            </div>
          )}
        </div>

        {/* Supplement + Generate */}
        <div className="mt-3 rounded-xl border border-border/40 bg-card/80 p-4 shadow-sm backdrop-blur-sm">
          <Label className="text-xs font-medium">补充要求</Label>
          <Textarea
            placeholder="输入对功能描述的要求（可选）"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            rows={2}
            className="resize-none mt-1.5"
          />
          <div className="mt-3">
            <GenerateButton
              loading={loading || batchRunning || clarifyLoading}
              disabled={!hasValidFiles || configs.length === 0 || clarifyLoading}
              onClick={handleGenerate}
              label={isBatch ? `批量生成 (${files.filter((f) => !f.error).length} 个文件)` : undefined}
            />
          </div>
        </div>

        <BatchProgress items={batchItems} isRunning={batchRunning} />

        <ClarificationDialog
          open={showClarifyDialog}
          questions={clarifyQuestions}
          loading={clarifyLoading}
          onConfirm={handleClarifyConfirm}
          onSkip={handleClarifySkip}
        />
      </div>
    </div>
  )
}
