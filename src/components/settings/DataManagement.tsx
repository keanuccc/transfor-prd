import { useState } from 'react'
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
