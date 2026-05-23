import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'

interface ProgressIndicatorProps {
  partIndex: number
  totalParts: number | null
}

const STAGES = ['分析思维导图结构...', '生成文档框架...', '撰写功能描述...', '补充实现细节...', '检查完整性与一致性...']

export function ProgressIndicator({ partIndex, totalParts }: ProgressIndicatorProps) {
  const [stageIndex, setStageIndex] = useState(0)
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const start = Date.now()
    const timer = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setStageIndex((prev) => (prev + 1) % STAGES.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  const elapsedStr = elapsed < 60 ? `${elapsed}s` : `${Math.floor(elapsed / 60)}m${elapsed % 60}s`

  return (
    <div className="border-b px-3 py-2.5">
      <div className="mb-2 flex items-center gap-2">
        <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" />
        <span className="text-xs font-medium">
          {STAGES[stageIndex]}
        </span>
        <span className="ml-auto text-[10px] tabular-nums text-muted-foreground">
          {elapsedStr}
        </span>
      </div>

      <div className="h-1 overflow-hidden rounded-full bg-muted">
        <div className="h-full animate-[indeterminate_1.5s_ease-in-out_infinite] rounded-full bg-blue-500/60" />
      </div>

      {partIndex > 1 && (
        <div className="mt-1.5 text-[10px] text-muted-foreground">
          已续写 {partIndex - 1} 次{totalParts ? `，共 ${totalParts} 段` : ''}
        </div>
      )}
    </div>
  )
}
