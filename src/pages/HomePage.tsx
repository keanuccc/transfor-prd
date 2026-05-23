import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { FileUpload, type FileItem } from '@/components/home/FileUpload'
import { ModelSelector } from '@/components/home/ModelSelector'
import { TemplateSelector } from '@/components/home/TemplateSelector'
import { StyleSelector } from '@/components/home/StyleSelector'
import { GenerateButton } from '@/components/home/GenerateButton'
import { ClarifyToggle } from '@/components/home/ClarifyToggle'
import { ClarificationDialog } from '@/components/home/ClarificationDialog'
import { BatchProgress, type BatchFileStatus } from '@/components/home/BatchProgress'
import { defaultTemplate } from '@/lib/templates'
import { STYLE_OPTIONS } from '@/lib/stylePrompts'
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

    await createConversation({
      id: convId,
      title,
      llmConfigId: config.id,
      templateId: selectedTemplateId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      sourceFileName: fileName,
      sourceFileContent: fileContent,
      userDescription: fullDescription,
      tags: [],
      starred: false,
    })

    await setActiveConversation(convId)
    navigate(`/run/${convId}`)
    // RunPage auto-start effect handles startGeneration
  }, [selectedModelId, styleId, selectedTemplateId, createConversation, setActiveConversation, navigate, getDefaultConfig])

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

        startGeneration(convId, config.id, item.content, userInput, selectedTemplateId).catch((err) => {
          toast.error(`${item.file.name}: ${err instanceof Error ? err.message : '生成失败'}`)
        })

        // Wait for streaming to complete
        await new Promise<void>((resolve) => {
          const check = () => {
            const state = useConversationStore.getState().streamState
            if (!state.isStreaming) {
              resolve()
            } else {
              setTimeout(check, 500)
            }
          }
          check()
        })

        setBatchItems((prev) => prev.map((bi, idx) => idx === i ? { ...bi, status: 'completed' } : bi))
      } catch (err) {
        setBatchItems((prev) => prev.map((bi, idx) => idx === i ? {
          ...bi,
          status: 'error',
          error: err instanceof Error ? err.message : '失败',
        } : bi))
      }
    }

    setBatchRunning(false)
    const completed = validFiles.length - items.filter((i) => i.status === 'error').length
    toast.success(`批量生成完成: ${completed}/${validFiles.length}`)
  }, [files, userInput, styleId, selectedModelId, selectedTemplateId, createConversation, setActiveConversation, getDefaultConfig, startGeneration])

  const handleGenerate = useCallback(async () => {
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
        const questions = JSON.parse(jsonMatch[0])
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
  }, [files, clarifyEnabled, userInput, selectedModelId, getDefaultConfig, doGenerate, doBatchGenerate])

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
    const validFile = files.find((f) => !f.error && f.content)
    if (!validFile) return
    setLoading(true)
    doGenerate(userInput, validFile.content, validFile.file.name).finally(() => setLoading(false))
  }, [userInput, files, doGenerate])

  const isBatch = files.filter((f) => !f.error && f.content).length > 1

  return (
    <div className="flex h-full justify-center overflow-hidden bg-gradient-to-b from-background via-background to-muted/20">
      {/* Decorative background orb */}
      <div className="pointer-events-none fixed top-0 left-1/2 -translate-x-1/2 size-[40rem] rounded-full bg-foreground/[0.02] blur-3xl" />
      <div className="relative flex w-full max-w-xl flex-col justify-center px-6 py-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">
            Markdown 思维导图转 PRD
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            上传产品功能结构思维导图，生成详细的产品功能描述文档
          </p>
        </div>

        <div className="mt-4 rounded-xl border border-border/40 bg-card/80 p-5 shadow-sm backdrop-blur-sm space-y-3">

        <div className="space-y-1.5">
          <Label className="text-xs font-medium">
            上传文件 <span className="text-destructive">*</span>
          </Label>
          <FileUpload
            files={files}
            multiple
            onFilesChange={handleFilesChange}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-medium">写作风格</Label>
          <StyleSelector value={styleId} onChange={setStyleId} />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-medium">补充要求</Label>
          <Textarea
            placeholder="输入对功能描述的要求（可选）"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            rows={2}
            className="resize-none"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-medium">选择模型</Label>
          <ModelSelector value={selectedModelId} onChange={setSelectedModelId} />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-medium">选择模板</Label>
          <TemplateSelector value={selectedTemplateId} onChange={setSelectedTemplateId} />
        </div>

        {!isBatch && (
          <ClarifyToggle checked={clarifyEnabled} onChange={setClarifyEnabled} />
        )}

        <GenerateButton
          loading={loading || batchRunning}
          disabled={files.filter((f) => !f.error && f.content).length === 0 || configs.length === 0}
          onClick={handleGenerate}
          label={isBatch ? `批量生成 (${files.filter((f) => !f.error).length} 个文件)` : undefined}
        />

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
