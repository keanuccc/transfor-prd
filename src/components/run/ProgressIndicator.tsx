import { Loader2 } from 'lucide-react'

interface ProgressIndicatorProps {
  partIndex: number
  totalParts: number | null
}

export function ProgressIndicator({ partIndex, totalParts }: ProgressIndicatorProps) {
  if (partIndex <= 1 && totalParts === null) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>正在生成...</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground">
      <Loader2 className="h-3 w-3 animate-spin" />
      <span>
        正在生成第 {partIndex} 段{totalParts ? `/${totalParts}` : ''}...
      </span>
    </div>
  )
}
