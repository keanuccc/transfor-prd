import { CheckCircle2, Loader2, Circle } from 'lucide-react'
import type { FileItem } from '@/components/home/FileUpload'

export interface BatchFileStatus {
  file: FileItem
  status: 'pending' | 'running' | 'completed' | 'error'
  error?: string
}

interface BatchProgressProps {
  items: BatchFileStatus[]
  isRunning: boolean
}

export function BatchProgress({ items, isRunning }: BatchProgressProps) {
  if (items.length === 0) return null

  const completed = items.filter((i) => i.status === 'completed').length

  return (
    <div className="rounded-lg border p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium">
          {isRunning ? '批量生成中' : '批量生成完成'}
        </span>
        <span className="text-xs text-muted-foreground tabular-nums">
          {completed}/{items.length}
        </span>
      </div>
      {/* Progress bar */}
      <div className="mb-3 h-1 w-full rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${items.length > 0 ? (completed / items.length) * 100 : 0}%` }}
        />
      </div>
      <div className="space-y-1">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-2 rounded px-2 py-1">
            {item.status === 'completed' ? (
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
            ) : item.status === 'running' ? (
              <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-primary" />
            ) : item.status === 'error' ? (
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-destructive" />
            ) : (
              <Circle className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />
            )}
            <span className="min-w-0 flex-1 truncate text-xs">{item.file.file.name}</span>
            {item.error && (
              <span className="shrink-0 text-[10px] text-destructive">{item.error}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
