import { ShieldAlert, Trash2, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useLLMStore } from '@/stores/llmStore'

export function SecurityWarning() {
  const { configs } = useLLMStore()

  const handleClearAllKeys = () => {
    const confirmed = window.confirm('确定要清除所有保存的 API Key 吗？此操作不可撤销。')
    if (!confirmed) return

    for (const config of configs) {
      useLLMStore.getState().updateConfig(config.id, { apiKey: '' })
    }
    toast.success('所有 API Key 已清除')
  }

  return (
    <div className="rounded-xl border border-amber-200/60 bg-gradient-to-br from-amber-50/80 to-amber-50/30 px-5 py-4 shadow-xs dark:border-amber-900/40 dark:from-amber-950/30 dark:to-amber-950/10">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100/80 dark:bg-amber-900/40">
          <ShieldAlert className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">安全提示</p>
          <div className="mt-1 flex items-start gap-1.5">
            <Info className="mt-0.5 h-3 w-3 shrink-0 text-amber-500/70 dark:text-amber-400/70" />
            <p className="text-xs text-amber-700/80 dark:text-amber-300/80 leading-relaxed">
              API Key 使用 AES-256-GCM 加密后存储，加密密钥保存在浏览器 IndexedDB 中。虽已加密，仍建议避免在公共或不可信任的设备上保存密钥。
            </p>
          </div>
          {configs.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="mt-3 gap-1.5 border-amber-300/60 bg-amber-50 text-xs text-amber-700 hover:bg-amber-100 hover:text-amber-800 dark:border-amber-800/60 dark:bg-amber-950/50 dark:text-amber-300 dark:hover:bg-amber-900/50 dark:hover:text-amber-200"
              onClick={handleClearAllKeys}
            >
              <Trash2 className="h-3 w-3" />
              清除所有密钥
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}