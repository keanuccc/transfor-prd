import { useState } from 'react'
import { ChevronRight, Brain } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'

interface ThinkingPanelProps {
  content: string
  isStreaming?: boolean
}

export function ThinkingPanel({ content, isStreaming }: ThinkingPanelProps) {
  const [open, setOpen] = useState(isStreaming ?? false)

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted/60">
        <ChevronRight className={cn('h-3 w-3 transition-transform', open && 'rotate-90')} />
        <Brain className="h-3 w-3 text-foreground/50" />
        <span>{isStreaming ? '思考中...' : '思考过程'}</span>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mx-2 mt-1 rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground">
          <p className="whitespace-pre-wrap">{content}</p>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
