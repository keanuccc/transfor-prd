import { useState, useMemo } from 'react'
import { Trophy, ThumbsUp } from 'lucide-react'
import { MarkdownPreview } from '@/components/run/MarkdownPreview'
import type { Message } from '@/types'

interface CompetitorInfo {
  modelName: string
  message: Message | null
}

interface CompetitionViewProps {
  competitors: CompetitorInfo[]
}

export function CompetitionView({ competitors }: CompetitionViewProps) {
  const [votedIndex, setVotedIndex] = useState<number | null>(null)
  const [votes, setVotes] = useState<number[]>([0, 0, 0])

  const handleVote = (index: number) => {
    if (votedIndex !== null) return
    setVotedIndex(index)
    setVotes((prev) => {
      const next = [...prev]
      next[index]++
      return next
    })
  }

  const winnerIndex = useMemo(() => {
    if (votes.every((v) => v === 0)) return null
    return votes.indexOf(Math.max(...votes))
  }, [votes])

  const visibleCompetitors = competitors.slice(0, 3)

  return (
    <div className="flex h-full gap-0">
      {visibleCompetitors.map((comp, i) => {
        const isWinner = winnerIndex !== null && winnerIndex === i
        return (
          <div
            key={i}
            className={`flex flex-1 flex-col border-r border-border/30 last:border-r-0 ${
              isWinner ? 'ring-2 ring-amber-400/50 bg-amber-50/10 dark:bg-amber-900/5' : ''
            }`}
          >
            <div className="flex items-center justify-between border-b border-border/30 px-4 py-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium">{comp.modelName}</span>
                {isWinner && <Trophy className="h-3.5 w-3.5 text-amber-400" />}
              </div>
              <button
                onClick={() => handleVote(i)}
                disabled={votedIndex !== null}
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs transition-all ${
                  votedIndex === i
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                } disabled:cursor-default`}
              >
                <ThumbsUp className="h-3 w-3" />
                {votes[i] > 0 && votes[i]}
              </button>
            </div>
            <div className="flex-1 overflow-auto px-6 py-4">
              {comp.message?.status === 'streaming' ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="inline-block size-2 animate-pulse rounded-full bg-primary" />
                  正在生成...
                </div>
              ) : comp.message?.content ? (
                <MarkdownPreview content={comp.message.content} />
              ) : comp.message?.status === 'error' ? (
                <p className="text-sm text-destructive">{comp.message.errorMessage || '生成失败'}</p>
              ) : (
                <p className="text-sm text-muted-foreground">等待生成...</p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
