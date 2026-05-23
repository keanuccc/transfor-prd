import { ScoreRadar } from '@/components/run/ScoreRadar'
import { type ReviewScores, SCORE_DIMENSIONS } from '@/lib/reviewScoring'
import { cn } from '@/lib/utils'

interface ScorePanelProps {
  scores: ReviewScores | null
  loading: boolean
}

export function ScorePanel({ scores, loading }: ScorePanelProps) {
  if (!scores && !loading) return null

  return (
    <div className="border-t px-6 py-4">
      <h3 className="mb-3 text-sm font-semibold">PRD 评审打分</h3>
      {loading && !scores ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          正在评审...
        </div>
      ) : scores ? (
        <div className="flex flex-wrap items-start gap-6">
          <ScoreRadar scores={scores} />
          <div className="min-w-[180px] flex-1 space-y-2">
            {SCORE_DIMENSIONS.map((dim) => {
              const val = scores[dim.key]
              return (
                <div key={dim.key}>
                  <div className="flex items-center justify-between text-xs">
                    <span>{dim.label}</span>
                    <span className="font-semibold tabular-nums">{val}/10</span>
                  </div>
                  <div className="mt-0.5 h-1.5 w-full rounded-full bg-muted">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-500',
                        val >= 8 ? 'bg-emerald-500' : val >= 6 ? 'bg-amber-500' : 'bg-red-500',
                      )}
                      style={{ width: `${(val / 10) * 100}%` }}
                    />
                  </div>
                </div>
              )
            })}
            {scores.summary && (
              <p className="mt-3 border-t pt-3 text-xs leading-relaxed text-muted-foreground">
                {scores.summary}
              </p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
