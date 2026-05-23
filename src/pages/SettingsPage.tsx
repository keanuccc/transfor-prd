import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { LLMConfigList } from '@/components/settings/LLMConfigList'
import { SystemPromptEditor } from '@/components/settings/SystemPromptEditor'
import { CustomTemplateList } from '@/components/settings/CustomTemplateList'
import { SecurityWarning } from '@/components/settings/SecurityWarning'
import { useSettingsStore } from '@/stores/settingsStore'

export function SettingsPage() {
  const autoContinue = useSettingsStore((s) => s.autoContinue)
  const enableCompletionSound = useSettingsStore((s) => s.enableCompletionSound)
  const setAutoContinue = useSettingsStore((s) => s.setAutoContinue)
  const setEnableCompletionSound = useSettingsStore((s) => s.setEnableCompletionSound)

  return (
    <div className="h-full overflow-auto">
      <div className="mx-auto max-w-2xl space-y-8 p-8">
        <h1 className="text-xl font-semibold">设置</h1>

        <SecurityWarning />

        <LLMConfigList />

        <Separator />

        <CustomTemplateList />

        <Separator />

        <section className="space-y-4">
          <h2 className="text-sm font-semibold">通用</h2>
          <div className="flex items-center justify-between rounded-lg border px-4 py-3">
            <div>
              <p className="text-sm font-medium">自动续写</p>
              <p className="text-xs text-muted-foreground">模型返回超长时自动追加"请继续生成"</p>
            </div>
            <Switch checked={autoContinue} onCheckedChange={setAutoContinue} />
          </div>
          <div className="flex items-center justify-between rounded-lg border px-4 py-3">
            <div>
              <p className="text-sm font-medium">生成完成提示音</p>
              <p className="text-xs text-muted-foreground">PRD 生成结束后播放清脆的提示音</p>
            </div>
            <Switch checked={enableCompletionSound} onCheckedChange={setEnableCompletionSound} />
          </div>
        </section>

        <Separator />

        <SystemPromptEditor />
      </div>
    </div>
  )
}
