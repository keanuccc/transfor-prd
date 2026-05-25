keyboard = """import { useMemo } from 'react'
import { Command } from 'lucide-react'

interface Shortcut {
  keys: string[]
  macKeys: string[]
  description: string
}

const shortcuts: Shortcut[] = [
  { keys: ['Ctrl', 'N'], macKeys: ['\u2318', 'N'], description: '\u65b0\u5efa\u4f1a\u8bdd / \u8fd4\u56de\u9996\u9875' },
  { keys: ['Ctrl', 'E'], macKeys: ['\u2318', 'E'], description: '\u5207\u6362\u7f16\u8f91\u6a21\u5f0f' },
  { keys: ['Ctrl', 'S'], macKeys: ['\u2318', 'S'], description: '\u5bfc\u51fa Markdown \u6587\u4ef6' },
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
            {key === 'Ctrl' && !isMac ? 'Ctrl' : key === '\u2318' ? <Command className="h-3 w-3" /> : key}
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
        <h2 className="text-base font-semibold">\u5feb\u6377\u952e</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          \u4ee5\u4e0b\u5feb\u6377\u952e\u5728\u975e\u8f93\u5165\u72b6\u6001\u4e0b\u751f\u6548\uff0c\u5f53\u524d\u68c0\u6d4b\u5230\u4f60\u4f7f\u7528\u7684\u662f {isMac ? 'macOS' : 'Windows/Linux'} \u7cfb\u7edf
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
          macOS \u4e0a\u4f7f\u7528 <KeyCap><Command className="h-3 w-3" /></KeyCap> (Cmd) \uff0cWindows/Linux \u4e0a\u4f7f\u7528 <KeyCap>Ctrl</KeyCap> \u3002
          \u5feb\u6377\u952e\u4ec5\u5728\u975e\u6587\u672c\u8f93\u5165\u72b6\u6001\u4e0b\u751f\u6548\uff0c\u907f\u514d\u4e0e\u7f16\u8f91\u5668\u51b2\u7a81\u3002
        </p>
      </div>
    </div>
  )
}
"""

with open(r'D:\code\transfor-prd\src\components\settings\KeyboardShortcuts.tsx', 'w', encoding='utf-8') as f:
    f.write(keyboard)
print('KeyboardShortcuts fixed')
