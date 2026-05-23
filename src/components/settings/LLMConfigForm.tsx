import { useState, useEffect } from 'react'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { pingLLM } from '@/services/ping'
import type { LLMConfig } from '@/types'

interface LLMConfigFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingConfig?: LLMConfig | null
  onSave: (config: LLMConfig) => void
}

export function LLMConfigForm({ open, onOpenChange, editingConfig, onSave }: LLMConfigFormProps) {
  const [baseUrl, setBaseUrl] = useState('')
  const [modelName, setModelName] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [testing, setTesting] = useState(false)
  const [pingResult, setPingResult] = useState<{ success: boolean; error?: string } | null>(null)

  // Sync form when dialog opens with a config (add or edit)
  useEffect(() => {
    if (open) {
      setBaseUrl(editingConfig?.baseUrl || '')
      setModelName(editingConfig?.modelName || '')
      setApiKey(editingConfig?.apiKey || '')
      setPingResult(null)
    }
  }, [open, editingConfig])

  const handleTest = async () => {
    setTesting(true)
    setPingResult(null)
    try {
      const result = await pingLLM({
        id: editingConfig?.id || '',
        baseUrl,
        modelName,
        apiKey,
        displayOrder: 0,
        isDefault: false,
      })
      setPingResult(result)
    } catch (err) {
      setPingResult({ success: false, error: err instanceof Error ? err.message : '测试失败' })
    } finally {
      setTesting(false)
    }
  }

  const handleSave = () => {
    if (!baseUrl.trim() || !modelName.trim() || !apiKey.trim()) return

    const config: LLMConfig = {
      id: editingConfig?.id || crypto.randomUUID(),
      baseUrl: baseUrl.trim(),
      modelName: modelName.trim(),
      apiKey: apiKey.trim(),
      displayOrder: editingConfig?.displayOrder ?? Date.now(),
      isDefault: editingConfig?.isDefault ?? false,
      lastPingSuccess: pingResult?.success,
    }
    onSave(config)
    onOpenChange(false)
    resetForm()
  }

  const resetForm = () => {
    setBaseUrl('')
    setModelName('')
    setApiKey('')
    setPingResult(null)
  }

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editingConfig ? '编辑模型' : '添加模型'}</DialogTitle>
          <DialogDescription>
            {editingConfig ? '修改模型连接配置' : '配置一个大模型连接'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="baseUrl">Base URL</Label>
            <Input
              id="baseUrl"
              placeholder="https://api.openai.com/v1"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="modelName">Model Name</Label>
            <Input
              id="modelName"
              placeholder="gpt-4o"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key</Label>
            <Input
              id="apiKey"
              type="password"
              placeholder="sk-..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <p className="text-xs text-amber-600 dark:text-amber-400">
              API Key 将存储在浏览器 localStorage 中，存在泄露风险。
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleTest} disabled={testing || !baseUrl || !modelName || !apiKey}>
              {testing ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
              测试连通性
            </Button>
            {pingResult && (
              <span className={`flex items-center gap-1 text-xs ${pingResult.success ? 'text-green-600 dark:text-green-400' : 'text-destructive'}`}>
                {pingResult.success ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                {pingResult.success ? '连接成功' : pingResult.error}
              </span>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={!baseUrl.trim() || !modelName.trim() || !apiKey.trim()}>
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
