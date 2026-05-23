export type DiffLine = {
  type: 'added' | 'removed' | 'unchanged'
  text: string
  lineNum: number
}

/**
 * LCS-based line diff. Returns aligned lines from the original and new text,
 * marking each as added, removed, or unchanged.
 */
export function computeDiff(original: string, updated: string): {
  left: DiffLine[]
  right: DiffLine[]
} {
  const origLines = original === '' ? [] : original.split('\n')
  const updLines = updated === '' ? [] : updated.split('\n')

  const { matches } = buildLcs(origLines, updLines)

  const left: DiffLine[] = []
  const right: DiffLine[] = []
  let oi = 0
  let ui = 0

  for (const match of matches) {
    // Lines in original before the match → removed
    while (oi < match.oi) {
      left.push({ type: 'removed', text: origLines[oi], lineNum: oi + 1 })
      right.push({ type: 'removed', text: '', lineNum: 0 })
      oi++
    }
    // Lines in updated before the match → added
    while (ui < match.ui) {
      left.push({ type: 'added', text: '', lineNum: 0 })
      right.push({ type: 'added', text: updLines[ui], lineNum: ui + 1 })
      ui++
    }
    // The matching line
    left.push({ type: 'unchanged', text: origLines[oi], lineNum: oi + 1 })
    right.push({ type: 'unchanged', text: updLines[ui], lineNum: ui + 1 })
    oi++
    ui++
  }

  // Remaining original lines → removed
  while (oi < origLines.length) {
    left.push({ type: 'removed', text: origLines[oi], lineNum: oi + 1 })
    right.push({ type: 'removed', text: '', lineNum: 0 })
    oi++
  }
  // Remaining updated lines → added
  while (ui < updLines.length) {
    left.push({ type: 'added', text: '', lineNum: 0 })
    right.push({ type: 'added', text: updLines[ui], lineNum: ui + 1 })
    ui++
  }

  return { left, right }
}

interface Match {
  oi: number
  ui: number
}

function buildLcs(a: string[], b: string[]): { lcs: number; matches: Match[] } {
  const m = a.length
  const n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0))

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1])
      }
    }
  }

  // Backtrack to find matches
  const matches: Match[] = []
  let i = m
  let j = n
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      matches.unshift({ oi: i - 1, ui: j - 1 })
      i--
      j--
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      i--
    } else {
      j--
    }
  }

  return { lcs: dp[m][n], matches }
}
