settings_page = """import { useState } from 'react'
import { Switch } from '@/components/ui/switch'
import { LLMConfigList } from '@/components/settings/LLMConfigList'
import { SystemPromptEditor } from '@/components/settings/SystemPromptEditor'
import { CustomTemplateList } from '@/components/settings/CustomTemplateList'
import { SecurityWarning } from '@/components/settings/SecurityWarning'
import { KnowledgeBaseList } from '@/components/settings/KnowledgeBaseList'
import { ThemeSettings } from '@/components/settings/ThemeSettings'
import { KeyboardShortcuts } from '@/components/settings/KeyboardShortcuts'
import { DataManagement } from '@/components/settings/DataManagement'
import { AboutSection } from '@/components/settings/AboutSection'
import { useSettingsStore } from '@/stores/settingsStore'
import {
  Cpu,
  FileText,
  BookOpen,
  MessageSquare,
  Settings2,
  Shield,
  Palette,
  Keyboard,
  Database,
  Info,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type TabId = 'llm' | 'templates' | 'knowledge' | 'prompt' | 'general' | 'theme' | 'shortcuts' | 'data' | 'about'

interface Tab {
  id: TabId
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const TABS: Tab[] = [
  { id: 'llm', label: '大模型配置', icon: Cpu },
  { id: 'templates', label: '自定义模板', icon: FileText },
  { id: 'knowledge', label: '知识库', icon: BookOpen },
  { id: 'prompt', label: '系统提示词', icon: MessageSquare },
  { id: 'general', label: '通用设置', icon: Settings2 },
  { id: 'theme', label: '主题外观', icon: Palette },
  { id: 'shortcuts', label: '快捷键', icon: Keyboard },
  { id: 'data', label: '数据管理', icon: Database },
  { id: 'about', label: '关于', icon: Info },
]

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('llm')
  const autoContinue = useSettingsStore((s) => s.autoContinue)
  const enableCompletionSound = useSettingsStore((s) => s.enableCompletionSound)
  const setAutoContinue = useSettingsStore((s) => s.setAutoContinue)
  const setEnableCompletionSound = useSettingsStore((s) => s.setEnableCompletionSound)

  return (
    <div className="flex h-full animate-fade-in">
      <aside className="flex w-52 shrink-0 flex-col border-r bg-card/40">
        <div className="px-4 pt-6 pb-4">
          <h1 className="text-lg font-semibold tracking-tight">设置</h1>
          <p className="mt-0.5 text-[11px] text-muted-foreground leading-relaxed">
            配置模型、模板与偏好
          </p>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-auto px-2 pb-4">
          {TABS.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all duration-150',
                  isActive
                    ? 'bg-primary/10 text-primary font-medium shadow-sm'
                    : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                )}
              >
                <Icon
                  className={cn(
                    'h-4 w-4 shrink-0 transition-colors',
                    isActive ? 'text-primary' : 'text-muted-foreground/60'
                  )}
                />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </nav>
        <div className="border-t px-4 py-3">
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <Shield className="h-3 w-3 shrink-0" />
            <span>密钥加密存储</span>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-2xl space-y-8 p-8">
          {activeTab === 'llm' && (
            <section className="animate-fade-in-up">
              <SecurityWarning />
              <div className="mt-6">
                <LLMConfigList />
              </div>
            </section>
          )}

          {activeTab === 'templates' && (
            <section className="animate-fade-in-up">
              <CustomTemplateList />
            </section>
          )}

          {activeTab === 'knowledge' && (
            <section className="animate-fade-in-up">
              <KnowledgeBaseList />
            </section>
          )}

          {activeTab === 'prompt' && (
            <section className="animate-fade-in-up">
              <SystemPromptEditor />
            </section>
          )}

          {activeTab === 'general' && (
            <section className="animate-fade-in-up space-y-6">
              <div>
                <h2 className="text-base font-semibold">通用偏好</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  调整 PRD 生成过程中的行为偏好
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-xl border bg-card/60 px-5 py-4 shadow-xs transition-all hover:border-primary/20 hover:shadow-sm">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">自动续写</p>
                    <p className="text-xs text-muted-foreground">
                      模型返回超长时自动追加"请继续生成"
                    </p>
                  </div>
                  <Switch
                    checked={autoContinue}
                    onCheckedChange={setAutoContinue}
                  />
                </div>

                <div className="flex items-center justify-between rounded-xl border bg-card/60 px-5 py-4 shadow-xs transition-all hover:border-primary/20 hover:shadow-sm">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">生成完成提示音</p>
                    <p className="text-xs text-muted-foreground">
                      PRD 生成结束后播放清脆的提示音
                    </p>
                  </div>
                  <Switch
                    checked={enableCompletionSound}
                    onCheckedChange={setEnableCompletionSound}
                  />
                </div>
              </div>
            </section>
          )}

          {activeTab === 'theme' && (
            <section className="animate-fade-in-up">
              <ThemeSettings />
            </section>
          )}

          {activeTab === 'shortcuts' && (
            <section className="animate-fade-in-up">
              <KeyboardShortcuts />
            </section>
          )}

          {activeTab === 'data' && (
            <section className="animate-fade-in-up">
              <DataManagement />
            </section>
          )}

          {activeTab === 'about' && (
            <section className="animate-fade-in-up">
              <AboutSection />
            </section>
          )}
        </div>
      </main>
    </div>
  )
}
"""

with open(r'D:\code\transfor-prd\src\pages\SettingsPage.tsx', 'w', encoding='utf-8') as f:
    f.write(settings_page)
print('SettingsPage fixed')
