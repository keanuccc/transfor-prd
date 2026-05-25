import { useMemo } from 'react'
import { Command } from 'lucide-react'

interface Shortcut {
  keys: string[]
  macKeys: string[]
  description: string
}

const shortcuts: Shortcut[] = [
  { keys: ['Ctrl', 'N'], macKeys: ['⌘', 'N'], description: '新建会话 / 返回首页' },
  { keys: ['Ctrl', 'E'], macKeys: ['⌘', 'E'], description: '切换编辑模式' },
  { keys: ['Ctrl', 'S'], macKeys: ['⌘', 'S'], description: '导出 Markdown 文件' },
]

function KeyCap({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-6 min-w-[22px] items-center justify-center rounded-md border bg-muted px-1.5 text-[11px] font-mono font-medium text-muted-foreground shadow-xs">
      {children}
    </kbd>
  )
}

function KeyCombo({ keys, isMac }: { keys: string[]; isMac: boolean }) {
  return (
    <div className="flex items-center gap-1">
      {keys.map((key, i) => (
        <span key={i} className="flex items-center gap-1">
          <KeyCap>
            {key === 'Ctrl' && !isMac ? 'Ctrl' : key === '⌘' ? <Command className="h-3 w-3" /> : key}
          </KeyCap>
          {i < keys.length - 1 && (
            <span className="text-[10px] text-muted-foreground/40">+</span>
          )}
        </span>
      ))}
    </div>
  )
}

export function KeyboardShortcuts() {
  const isMac = useMemo(() => {
    if (typeof navigator === 'undefined') return false
    return /Mac|iPod|iPhone|iPad/.test(navigator.platform || navigator.userAgent)
  }, [])

  return (
    <div>
      <div>
        <h2 className="text-base font-semibold">快捷键</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          以下快捷键在非输入状态下生效，当前检测到你使用的是 {isMac ? 'macOS' : 'Windows/Linux'} 系统
        </p>
      </div>

      <div className="mt-4 space-y-2">
        {shortcuts.map(({ keys, macKeys, description }) => (
          <div
            key={keys.join('+')}
            className="flex items-center justify-between rounded-xl border bg-card/40 px-5 py-3.5 transition-all hover:border-primary/15 hover:shadow-sm"
          >
            <span className="text-sm">{description}</span>
            <div className="flex items-center gap-2">
              <KeyCombo keys={isMac ? macKeys : keys} isMac={isMac} />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-xl border bg-card/40 px-5 py-4">
        <p className="text-xs text-muted-foreground leading-relaxed">
          macOS 上使用 <KeyCap><Command className="h-3 w-3" /></KeyCap> (Cmd) ，Windows/Linux 上使用 <KeyCap>Ctrl</KeyCap> 。
          快捷键仅在非文本输入状态下生效，避免与编辑器冲突。
        </p>
      </div>
    </div>
  )
}
