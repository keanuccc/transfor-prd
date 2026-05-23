export interface ReviewScores {
  completeness: number
  executability: number
  clarity: number
  technicalFeasibility: number
  summary: string
}

export const SCORE_DIMENSIONS = [
  { key: 'completeness' as const, label: '完整性' },
  { key: 'executability' as const, label: '可执行性' },
  { key: 'clarity' as const, label: '清晰度' },
  { key: 'technicalFeasibility' as const, label: '技术可行性' },
]

export function parseScores(content: string): ReviewScores | null {
  // Try to extract JSON from a ```json code block
  const jsonBlock = content.match(/```json\s*([\s\S]*?)```/)
  const jsonStr = jsonBlock ? jsonBlock[1].trim() : null

  // Fallback: find any {...} block
  const candidates = jsonStr ? [jsonStr] : []
  if (!jsonStr) {
    const braceMatch = content.match(/\{[\s\S]*"completeness"[\s\S]*\}/)
    if (braceMatch) candidates.push(braceMatch[0])
  }

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate)
      if (
        typeof parsed.completeness === 'number' &&
        typeof parsed.executability === 'number' &&
        typeof parsed.clarity === 'number' &&
        typeof parsed.technicalFeasibility === 'number'
      ) {
        return {
          completeness: clampScore(parsed.completeness),
          executability: clampScore(parsed.executability),
          clarity: clampScore(parsed.clarity),
          technicalFeasibility: clampScore(parsed.technicalFeasibility),
          summary: typeof parsed.summary === 'string' ? parsed.summary : '',
        }
      }
    } catch {
      // Continue to next candidate
    }
  }

  return null
}

function clampScore(n: number): number {
  return Math.max(1, Math.min(10, Math.round(n)))
}
