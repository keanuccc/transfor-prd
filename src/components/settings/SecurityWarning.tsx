import { ShieldAlert, Trash2 } from 'lucide-react'
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
    <div className="rounded-lg border border-amber-300/50 bg-amber-50/50 px-4 py-3 dark:border-amber-900/50 dark:bg-amber-950/30">
      <div className="flex items-start gap-3">
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
        <div className="flex-1">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-200">安全提示</p>
          <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
            API Key 使用 AES-256-GCM 加密后存储，加密密钥保存在浏览器 IndexedDB 中。
            虽然已加密，仍建议避免在公共或不受信任的设备上保存密钥。
          </p>
          {configs.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="mt-2 gap-1.5 text-xs text-destructive hover:text-destructive"
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
