import { SCORE_DIMENSIONS } from '@/lib/reviewScoring'

interface ScoreRadarProps {
  scores: Record<string, number>
  maxValue?: number
}

export function ScoreRadar({ scores, maxValue = 10 }: ScoreRadarProps) {
  const size = 240
  const cx = size / 2
  const cy = size / 2
  const radius = 100
  const count = SCORE_DIMENSIONS.length
  const angleStep = (2 * Math.PI) / count
  const startAngle = -Math.PI / 2 // First axis at top

  const levels = [0.25, 0.5, 0.75, 1.0]

  function point(angle: number, r: number): [number, number] {
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)]
  }

  const gridPolygons = levels.map((level) => {
    const r = radius * level
    const pts = SCORE_DIMENSIONS.map((_, i) => {
      const a = startAngle + i * angleStep
      const [px, py] = point(a, r)
      return `${px},${py}`
    }).join(' ')
    return pts
  })

  // Data polygon
  const dataPts = SCORE_DIMENSIONS.map((dim, i) => {
    const val = scores[dim.key] ?? 0
    const a = startAngle + i * angleStep
    const r = (val / maxValue) * radius
    const [px, py] = point(a, r)
    return `${px},${py}`
  }).join(' ')

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="h-[240px] w-[240px]">
      {/* Grid */}
      {gridPolygons.map((pts, i) => (
        <polygon
          key={i}
          points={pts}
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth="0.5"
        />
      ))}

      {/* Axes */}
      {SCORE_DIMENSIONS.map((_, i) => {
        const a = startAngle + i * angleStep
        const [x, y] = point(a, radius)
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={x}
            y2={y}
            stroke="hsl(var(--border))"
            strokeWidth="0.5"
          />
        )
      })}

      {/* Level labels */}
      {levels.map((level) => {
        const r = radius * level
        const [lx, ly] = point(startAngle, r)
        return (
          <text
            key={level}
            x={lx}
            y={ly - 4}
            textAnchor="middle"
            className="fill-muted-foreground"
            fontSize="8"
          >
            {Math.round(maxValue * level)}
          </text>
        )
      })}

      {/* Data polygon */}
      <polygon
        points={dataPts}
        fill="hsl(var(--primary) / 0.25)"
        stroke="hsl(var(--primary))"
        strokeWidth="1.5"
      />

      {/* Data points */}
      {SCORE_DIMENSIONS.map((dim, i) => {
        const val = scores[dim.key] ?? 0
        const a = startAngle + i * angleStep
        const r = (val / maxValue) * radius
        const [x, y] = point(a, r)
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r="3"
            fill="hsl(var(--primary))"
          />
        )
      })}

      {/* Axis labels */}
      {SCORE_DIMENSIONS.map((dim, i) => {
        const a = startAngle + i * angleStep
        const labelR = radius + 22
        const [lx, ly] = point(a, labelR)
        const val = scores[dim.key] ?? 0
        return (
          <text
            key={i}
            x={lx}
            y={ly}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-foreground"
            fontSize="11"
          >
            {dim.label} {val}
          </text>
        )
      })}
    </svg>
  )
}
