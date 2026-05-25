import os
base = r"D:\code\transfor-prd\src\components\settings"

files = {}

# --- LLMConfigForm.tsx ---
files["LLMConfigForm.tsx"] = """import { useState, useEffect } from 'react'
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
"""

# --- ThemeSettings.tsx ---
files["ThemeSettings.tsx"] = """import { Sun, Moon, Monitor } from 'lucide-react'
import { useAppStore, type Theme } from '@/stores/appStore'
import { cn } from '@/lib/utils'

const themeOptions: { value: Theme; icon: typeof Sun; label: string; desc: string }[] = [
  { value: 'light', icon: Sun, label: '浅色', desc: '明亮舒适的日间阅读体验' },
  { value: 'dark', icon: Moon, label: '深色', desc: '护眼的夜间暗色模式' },
  { value: 'system', icon: Monitor, label: '跟随系统', desc: '自动匹配操作系统的主题设置' },
]

export function ThemeSettings() {
  const { theme, setTheme } = useAppStore()

  return (
    <div>
      <div>
        <h2 className="text-base font-semibold">主题外观</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          选择适合你的界面配色方案
        </p>
      </div>

      <div className="mt-4 grid gap-3">
        {themeOptions.map(({ value, icon: Icon, label, desc }) => (
          <button
            key={value}
            onClick={() => setTheme(value)}
            className={cn(
              'flex items-start gap-4 rounded-xl border px-5 py-4 text-left transition-all',
              theme === value
                ? 'border-primary/30 bg-primary/5 shadow-sm ring-1 ring-primary/10'
                : 'border-border bg-card/40 hover:border-primary/15 hover:bg-card/60 hover:shadow-sm'
            )}
          >
            <div
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                theme === value ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className={cn(
                'text-sm font-medium',
                theme === value && 'text-primary'
              )}>
                {label}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>
            </div>
            {theme === value && (
              <span className="ml-auto shrink-0 self-center rounded-full bg-primary px-2.5 py-0.5 text-[10px] font-medium text-primary-foreground">
                当前
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="mt-5 rounded-xl border bg-card/40 px-5 py-4">
        <p className="text-xs text-muted-foreground leading-relaxed">
          提示：你也可以通过左侧边栏底部的快捷按钮快速切换主题。
        </p>
      </div>
    </div>
  )
}
"""

# --- KeyboardShortcuts.tsx ---
files["KeyboardShortcuts.tsx"] = """import { Command } from 'lucide-react'

interface Shortcut {
  keys: string[]
  description: string
}

const shortcuts: Shortcut[] = [
  { keys: ['Ctrl', 'N'], description: '新建会话 / 返回首页' },
  { keys: ['Ctrl', 'E'], description: '切换编辑模式' },
  { keys: ['Ctrl', 'S'], description: '导出 Markdown 文件' },
]

export function KeyboardShortcuts() {
  return (
    <div>
      <div>
        <h2 className="text-base font-semibold">快捷键</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          以下快捷键在非输入状态下生效
        </p>
      </div>

      <div className="mt-4 space-y-2">
        {shortcuts.map(({ keys, description }) => (
          <div
            key={keys.join('+')}
            className="flex items-center justify-between rounded-xl border bg-card/40 px-5 py-3 transition-all hover:border-primary/15 hover:shadow-sm"
          >
            <span className="text-sm">{description}</span>
            <div className="flex items-center gap-1">
              {keys.map((key, i) => (
                <span key={i} className="flex items-center gap-1">
                  <kbd className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-md border bg-muted px-1.5 text-[11px] font-mono text-muted-foreground shadow-xs">
                    {key === 'Ctrl' ? <Command className="h-3 w-3" /> : key}
                  </kbd>
                  {i < keys.length - 1 && (
                    <span className="text-[10px] text-muted-foreground/50">+</span>
                  )}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-xl border bg-card/40 px-5 py-4">
        <p className="text-xs text-muted-foreground leading-relaxed">
          在 macOS 上使用 <kbd className="inline-flex h-5 items-center rounded border bg-muted px-1 text-[10px] font-mono">Cmd</kbd> 替代 <kbd className="inline-flex h-5 items-center rounded border bg-muted px-1 text-[10px] font-mono">Ctrl</kbd>。
        </p>
      </div>
    </div>
  )
}
"""

# --- DataManagement.tsx ---
files["DataManagement.tsx"] = """import { useState } from 'react'
import {
  Trash2,
  RotateCcw,
  Download,
  Upload,
  AlertTriangle,
  Database,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

export function DataManagement() {
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  const estimateStorage = (): string => {
    let total = 0
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key) total += localStorage.getItem(key)?.length || 0
    }
    if (total < 1024) return `${total} B`
    if (total < 1024 * 1024) return `${(total / 1024).toFixed(1)} KB`
    return `${(total / (1024 * 1024)).toFixed(1)} MB`
  }

  const handleClearConversations = () => {
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith('conversation-store')) keysToRemove.push(key)
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k))
    setShowClearConfirm(false)
    toast.success('所有会话数据已清除')
  }

  const handleResetSettings = () => {
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && (key.startsWith('settings-store') || key.startsWith('llm-store') || key.startsWith('template-store') || key.startsWith('knowledge-store'))) {
        keysToRemove.push(key)
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k))
    toast.success('所有设置已重置为默认值，请刷新页面生效')
  }

  const handleExportAll = () => {
    const data: Record<string, unknown> = {}
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key) {
        try {
          data[key] = JSON.parse(localStorage.getItem(key) || '')
        } catch {
          data[key] = localStorage.getItem(key)
        }
      }
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `transfor-prd-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('数据已导出')
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      try {
        const text = await file.text()
        const data = JSON.parse(text)
        let count = 0
        for (const [key, value] of Object.entries(data)) {
          if (typeof key === 'string' && key.includes('-store')) {
            localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value))
            count++
          }
        }
        toast.success(`已导入 ${count} 条数据，请刷新页面生效`)
      } catch {
        toast.error('导入失败，请检查文件格式')
      }
    }
    input.click()
  }

  return (
    <div>
      <div>
        <h2 className="text-base font-semibold">数据管理</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          管理本地存储的会话数据与配置
        </p>
      </div>

      <div className="mt-4 space-y-3">
        <div className="flex items-center gap-3 rounded-xl border bg-card/40 px-5 py-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted">
            <Database className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium">本地存储用量</p>
            <p className="text-xs text-muted-foreground">约 {estimateStorage()}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="h-auto flex-col gap-1.5 rounded-xl py-4"
            onClick={handleExportAll}
          >
            <Download className="h-5 w-5" />
            <span className="text-xs">导出数据</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto flex-col gap-1.5 rounded-xl py-4"
            onClick={handleImport}
          >
            <Upload className="h-5 w-5" />
            <span className="text-xs">导入数据</span>
          </Button>
        </div>

        <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-destructive/10">
              <RotateCcw className="h-4 w-4 text-destructive" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-destructive">重置所有设置</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                将 LLM 配置、模板、知识库和系统提示词恢复为默认值。会话数据不受影响。
              </p>
              <Button
                variant="destructive"
                size="sm"
                className="mt-3 gap-1.5"
                onClick={handleResetSettings}
              >
                <RotateCcw className="h-3 w-3" />
                重置设置
              </Button>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-destructive">清除所有会话</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                永久删除所有历史会话记录。此操作不可撤销。
              </p>
              {!showClearConfirm ? (
                <Button
                  variant="destructive"
                  size="sm"
                  className="mt-3 gap-1.5"
                  onClick={() => setShowClearConfirm(true)}
                >
                  <Trash2 className="h-3 w-3" />
                  清除会话
                </Button>
              ) : (
                <div className="mt-3 flex items-center gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    className="gap-1.5"
                    onClick={handleClearConversations}
                  >
                    <Trash2 className="h-3 w-3" />
                    确认清除
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowClearConfirm(false)}
                  >
                    取消
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
"""

# --- AboutSection.tsx ---
files["AboutSection.tsx"] = """import {
  Brain,
  ExternalLink,
  Globe,
  Heart,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const techStack = [
  { label: '框架', value: 'React 19 + TypeScript' },
  { label: '构建工具', value: 'Vite' },
  { label: '样式方案', value: 'Tailwind CSS v4' },
  { label: 'UI 组件', value: 'shadcn/ui' },
  { label: '状态管理', value: 'Zustand' },
  { label: '路由', value: 'React Router v7' },
  { label: '加密', value: 'AES-256-GCM (Web Crypto)' },
]

export function AboutSection() {
  return (
    <div>
      <div>
        <h2 className="text-base font-semibold">关于</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          关于本应用的版本和技术信息
        </p>
      </div>

      <div className="mt-4 flex flex-col items-center rounded-xl border bg-card/40 px-6 py-8 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
          <Brain className="h-7 w-7 text-primary" />
        </div>
        <h3 className="mt-4 text-lg font-semibold">Transfor PRD</h3>
        <p className="mt-1 text-xs text-muted-foreground">v0.0.0</p>
        <p className="mt-3 max-w-sm text-xs text-muted-foreground leading-relaxed">
          将 Markdown 格式的思维导图智能转换为结构化的产品功能描述文档（PRD），
          支持多模型协同、自定义模板和知识库增强。
        </p>
        <div className="mt-4 flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            asChild
          >
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Globe className="h-3.5 w-3.5" />
              GitHub
              <ExternalLink className="h-3 w-3" />
            </a>
          </Button>
        </div>
      </div>

      <div className="mt-4 rounded-xl border bg-card/40">
        <div className="border-b px-5 py-3">
          <p className="text-sm font-medium">技术栈</p>
        </div>
        <div className="divide-y">
          {techStack.map(({ label, value }) => (
            <div
              key={label}
              className="flex items-center justify-between px-5 py-2.5"
            >
              <span className="text-xs text-muted-foreground">{label}</span>
              <span className="text-xs font-medium">{value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
        <span>Made with</span>
        <Heart className="h-3 w-3 text-destructive" />
        <span>by the Transfor Team</span>
      </div>
    </div>
  )
}
"""

for name, content in files.items():
    path = os.path.join(base, name)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Written: {name}")
