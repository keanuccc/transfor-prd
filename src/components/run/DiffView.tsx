import { useMemo } from 'react'
import { computeDiff } from '@/lib/diffUtils'
import { cn } from '@/lib/utils'

interface DiffViewProps {
  original: string
  updated: string
  className?: string
}

function DiffLineCell({
  text,
  type,
  lineNum,
}: {
  text: string
  type: 'added' | 'removed' | 'unchanged'
  lineNum: number
}) {
  const isEmpty = text === '' && lineNum === 0
  if (isEmpty) {
    return <div className="h-5 border-b border-transparent" />
  }

  return (
    <div
      className={cn(
        'flex h-5 text-xs leading-5 font-mono',
        type === 'added' && 'bg-green-100 dark:bg-green-950/40',
        type === 'removed' && 'bg-red-100 dark:bg-red-950/40',
      )}
    >
      <span className="w-10 shrink-0 select-none pr-2 text-right text-[10px] text-muted-foreground/50">
        {lineNum || ' '}
      </span>
      <span className="truncate pr-2">{text}</span>
    </div>
  )
}

export function DiffView({ original, updated, className }: DiffViewProps) {
  const diff = useMemo(() => computeDiff(original, updated), [original, updated])

  const addedCount = diff.right.filter((l) => l.type === 'added').length
  const removedCount = diff.left.filter((l) => l.type === 'removed').length

  return (
    <div className={cn('flex flex-col', className)}>
      <div className="mb-2 flex items-center gap-3 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-green-100 dark:bg-green-950/40" />
          +{addedCount} 新增
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-2.5 rounded-sm bg-red-100 dark:bg-red-950/40" />
          -{removedCount} 移除
        </span>
      </div>

      <div className="grid grid-cols-2 gap-0 overflow-auto rounded border text-xs">
        <div className="min-w-0 border-r">
          <div className="sticky top-0 z-10 bg-muted/50 px-2 py-1 text-[10px] font-medium text-muted-foreground border-b">
            主模型
          </div>
          <div className="py-0.5">
            {diff.left.map((line, i) => (
              <DiffLineCell
                key={i}
                text={line.text}
                type={line.type}
                lineNum={line.lineNum}
              />
            ))}
          </div>
        </div>
        <div className="min-w-0">
          <div className="sticky top-0 z-10 bg-muted/50 px-2 py-1 text-[10px] font-medium text-muted-foreground border-b">
            对比模型
          </div>
          <div className="py-0.5">
            {diff.right.map((line, i) => (
              <DiffLineCell
                key={i}
                text={line.text}
                type={line.type}
                lineNum={line.lineNum}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
