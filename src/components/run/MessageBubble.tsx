import { cn } from '@/lib/utils'
import { User, Bot } from 'lucide-react'
import type { Message } from '@/types'

interface MessageBubbleProps {
  message: Message
}

function getUserMessagePreview(content: string): string {
  // User messages are long structured prompts; show a compact preview
  const fileMatch = content.match(/产品功能结构思维导图[：:]\s*\\n<content>([\s\S]*?)<\/content>/)
  const inputMatch = content.match(/用户输入[：:]\s*\\n<content>([\s\S]*?)<\/content>/)

  const parts: string[] = []
  if (fileMatch) {
    const preview = fileMatch[1].trim().slice(0, 80)
    parts.push(`已上传文件${preview ? `：${preview}...` : ''}`)
  }
  if (inputMatch) {
    const preview = inputMatch[1].trim().slice(0, 80)
    parts.push(`要求：${preview}${inputMatch[1].trim().length > 80 ? '...' : ''}`)
  }
  return parts.length > 0 ? parts.join('\n') : content.slice(0, 100)
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user'
  const isStructuredPrompt = isUser && message.content.includes('<content>')

  const displayContent = isStructuredPrompt
    ? getUserMessagePreview(message.content)
    : message.content

  return (
    <div className={cn('flex gap-2.5 py-2', isUser && 'justify-end')}>
      {!isUser && (
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-muted ring-1 ring-border/40">
          <Bot className="h-3.5 w-3.5 text-foreground/60" />
        </div>
      )}
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed',
          isUser
            ? 'bg-primary text-primary-foreground shadow-sm'
            : 'bg-muted/60 text-foreground/85 ring-1 ring-border/40',
        )}
      >
        <p className="whitespace-pre-wrap">{displayContent || '...'}</p>
        {message.status === 'error' && message.errorMessage && (
          <p className="mt-1 text-xs text-destructive">{message.errorMessage}</p>
        )}
        {message.status === 'streaming' && !isUser && (
          <span className="ml-0.5 inline-block h-3 w-0.5 animate-pulse rounded-full bg-foreground/50" />
        )}
      </div>
      {isUser && (
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-primary shadow-xs">
          <User className="h-3.5 w-3.5 text-primary-foreground" />
        </div>
      )}
    </div>
  )
}
