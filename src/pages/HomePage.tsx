import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { FileUpload } from '@/components/home/FileUpload'
import { ModelSelector } from '@/components/home/ModelSelector'
import { TemplateSelector } from '@/components/home/TemplateSelector'
import { GenerateButton } from '@/components/home/GenerateButton'
import { defaultTemplate } from '@/lib/templates'
import { useLLMStore } from '@/stores/llmStore'
import { useConversationStore } from '@/stores/conversationStore'
import { useLLMStream } from '@/hooks/useLLMStream'
import { SUPPORTED_FILE_EXTENSIONS } from '@/lib/constants'

export function HomePage() {
  const navigate = useNavigate()
  const { getDefaultConfig, configs } = useLLMStore()
  const { createConversation, setActiveConversation } = useConversationStore()
  const { startGeneration } = useLLMStream()

  const [file, setFile] = useState<File | null>(null)
  const [fileContent, setFileContent] = useState('')
  const [fileError, setFileError] = useState<string | null>(null)
  const [userInput, setUserInput] = useState('')
  const [selectedModelId, setSelectedModelId] = useState<string | undefined>()
  const [selectedTemplateId, setSelectedTemplateId] = useState(defaultTemplate.id)
  const [loading, setLoading] = useState(false)

  const handleFileSelect = useCallback(async (f: File) => {
    const ext = '.' + f.name.split('.').pop()?.toLowerCase()
    if (!SUPPORTED_FILE_EXTENSIONS.includes(ext)) {
      setFileError('请上传 Markdown 格式的文件（.md 或 .markdown）')
      return
    }
    try {
      const content = await f.text()
      setFile(f)
      setFileContent(content)
      setFileError(null)
    } catch {
      setFileError('文件读取失败')
    }
  }, [])

  const handleClearFile = useCallback(() => {
    setFile(null)
    setFileContent('')
    setFileError(null)
  }, [])

  const handleGenerate = useCallback(async () => {
    if (!fileContent) {
      toast.error('请先上传 Markdown 文件')
      return
    }

    const config = selectedModelId
      ? useLLMStore.getState().getConfigById(selectedModelId)
      : getDefaultConfig()

    if (!config) {
      toast.error('请先在设置中配置模型')
      return
    }

    setLoading(true)
    try {
      const convId = crypto.randomUUID()
      const title = file?.name?.replace(/\.(md|markdown)$/i, '') || '新对话'

      await createConversation({
        id: convId,
        title,
        llmConfigId: config.id,
        templateId: selectedTemplateId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        sourceFileName: file?.name || '',
        sourceFileContent: fileContent,
        userDescription: userInput,
      })

      await setActiveConversation(convId)
      navigate(`/run/${convId}`)

      startGeneration(convId, config.id, fileContent, userInput, selectedTemplateId).catch((err) => {
        toast.error(err instanceof Error ? err.message : '生成失败')
      })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '创建对话失败')
    } finally {
      setLoading(false)
    }
  }, [fileContent, file, userInput, selectedModelId, selectedTemplateId, createConversation, setActiveConversation, navigate, getDefaultConfig, startGeneration])

  return (
    <div className="flex h-full items-center justify-center overflow-auto">
      <div className="w-full max-w-xl space-y-5 px-6 py-12">
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Markdown 思维导图转 PRD
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            上传产品功能结构思维导图，生成详细的产品功能描述文档
          </p>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-medium">
            上传文件 <span className="text-destructive">*</span>
          </Label>
          <FileUpload
            file={file}
            fileContent={fileContent}
            error={fileError}
            onFileSelect={handleFileSelect}
            onClear={handleClearFile}
          />
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

        <GenerateButton
          loading={loading}
          disabled={!fileContent || configs.length === 0}
          onClick={handleGenerate}
        />
      </div>
    </div>
  )
}
