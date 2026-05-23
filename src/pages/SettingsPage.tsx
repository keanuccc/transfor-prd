import { Separator } from '@/components/ui/separator'
import { LLMConfigList } from '@/components/settings/LLMConfigList'
import { SystemPromptEditor } from '@/components/settings/SystemPromptEditor'
import { SecurityWarning } from '@/components/settings/SecurityWarning'

export function SettingsPage() {
  return (
    <div className="h-full overflow-auto">
      <div className="mx-auto max-w-2xl space-y-8 p-8">
        <h1 className="text-xl font-semibold">设置</h1>

        <SecurityWarning />

        <LLMConfigList />

        <Separator />

        <SystemPromptEditor />
      </div>
    </div>
  )
}
