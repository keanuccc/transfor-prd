import { Sun, Moon, Monitor } from 'lucide-react'
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
