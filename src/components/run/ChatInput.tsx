import { useState, useCallback, useRef, useEffect } from 'react'
import { Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { StyleSelector } from '@/components/home/StyleSelector'
import { STYLE_OPTIONS } from '@/lib/stylePrompts'

const QUICK_ACTIONS = [
  { label: '补充细节', prompt: '请补充更多实现细节，包括具体的字段定义、接口设计和错误处理逻辑。' },
  { label: '优化结构', prompt: '请重新组织结构，让逻辑更清晰，层次更分明。' },
  { label: '修正术语', prompt: '请检查并修正文档中的技术术语，确保用词准确、统一。' },
  { label: '简化表达', prompt: '请简化冗余描述，用更精炼的语言表达核心要点。' },
  { label: '增加示例', prompt: '请为关键功能点补充具体的代码示例或使用场景。' },
]

interface ChatInputProps {
  onSend: (message: string) => void
  disabled?: boolean
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState('')
  const [styleId, setStyleId] = useState('default')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSend = useCallback(() => {
    const trimmed = value.trim()
    if (!trimmed) return
    const stylePrompt = STYLE_OPTIONS.find((s) => s.id === styleId)?.prompt || ''
    onSend(trimmed + stylePrompt)
    setValue('')
  }, [value, styleId, onSend])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend],
  )

  const handleQuickAction = (prompt: string) => {
    setValue(prompt)
    textareaRef.current?.focus()
  }

  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`
    }
  }, [value])

  const hasContent = value.trim().length > 0

  return (
    <div className="border-t px-3 py-3">
      <StyleSelector value={styleId} onChange={setStyleId} />
      <div className="mb-2.5 mt-2.5 flex flex-wrap gap-1.5">
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action.label}
            type="button"
            onClick={() => handleQuickAction(action.prompt)}
            disabled={disabled}
            className="inline-flex cursor-pointer items-center rounded-full border border-border/50 bg-muted/40 px-2.5 py-1 text-[11px] leading-none text-muted-foreground transition-all hover:border-border hover:bg-muted hover:text-foreground active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40"
          >
            {action.label}
          </button>
        ))}
      </div>

      <div className="relative flex items-end rounded-xl border border-input bg-muted/30 transition-all focus-within:border-ring/60 focus-within:bg-background focus-within:ring-2 focus-within:ring-ring/15">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入优化要求，例如「补充实现细节」「优化文档结构」..."
          rows={1}
          disabled={disabled}
          className="min-h-[38px] max-h-[160px] flex-1 resize-none border-0 bg-transparent px-3.5 py-2.5 text-sm leading-relaxed placeholder:text-muted-foreground/50 outline-none disabled:cursor-not-allowed disabled:opacity-40"
        />
        <div className={`shrink-0 pr-2 pb-2 transition-all ${hasContent ? 'opacity-100 scale-100' : 'opacity-30 scale-95'}`}>
          <Button
            size="icon-sm"
            className="rounded-lg transition-all hover:scale-110 active:scale-90"
            onClick={handleSend}
            disabled={disabled || !hasContent}
          >
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
