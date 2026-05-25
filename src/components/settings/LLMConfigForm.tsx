import { useState, useEffect } from 'react'
import { Loader2, CheckCircle, XCircle, Cpu } from 'lucide-react'
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
    if (!newOpen) resetForm()
    onOpenChange(newOpen)
  }

  const isValid = baseUrl.trim() && modelName.trim() && apiKey.trim()

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <Cpu className="h-4 w-4 text-primary" />
            </div>
            <div>
              <DialogTitle>{editingConfig ? '编辑模型' : '添加模型'}</DialogTitle>
              <DialogDescription>
                {editingConfig ? '修改模型连接配置' : '配置一个新的大模型连接'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="baseUrl" className="text-xs font-medium">Base URL</Label>
            <Input
              id="baseUrl"
              placeholder="https://api.openai.com/v1"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              className="h-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="modelName" className="text-xs font-medium">Model Name</Label>
            <Input
              id="modelName"
              placeholder="gpt-4o"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              className="h-9"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="apiKey" className="text-xs font-medium">API Key</Label>
            <Input
              id="apiKey"
              type="password"
              placeholder="sk-..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="h-9"
            />
            <p className="text-[11px] text-amber-600/80 dark:text-amber-400/80">
              API Key 将存储在浏览器 localStorage 中，存在泄露风险。
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTest}
              disabled={testing || !isValid}
              className="gap-1.5"
            >
              {testing ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : null}
              测试连通性
            </Button>
            {pingResult && (
              <span
                className={`flex items-center gap-1 text-xs ${
                  pingResult.success
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-destructive'
                }`}
              >
                {pingResult.success ? (
                  <CheckCircle className="h-3 w-3" />
                ) : (
                  <XCircle className="h-3 w-3" />
                )}
                {pingResult.success ? '连接成功' : pingResult.error}
              </span>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button size="sm" onClick={handleSave} disabled={!isValid}>
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
