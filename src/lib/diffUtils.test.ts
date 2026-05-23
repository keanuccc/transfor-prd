import { describe, it, expect } from 'vitest'
import { computeDiff } from './diffUtils'

describe('computeDiff', () => {
  it('returns all unchanged for identical texts', () => {
    const text = 'line1\nline2\nline3'
    const result = computeDiff(text, text)
    expect(result.left.every((l) => l.type === 'unchanged')).toBe(true)
    expect(result.right.every((l) => l.type === 'unchanged')).toBe(true)
    expect(result.left.length).toBe(3)
  })

  it('detects added lines', () => {
    const result = computeDiff('line1', 'line1\nline2')
    const added = result.right.filter((l) => l.type === 'added')
    expect(added).toHaveLength(1)
    expect(added[0].text).toBe('line2')
  })

  it('detects removed lines', () => {
    const result = computeDiff('line1\nline2', 'line1')
    const removed = result.left.filter((l) => l.type === 'removed')
    expect(removed).toHaveLength(1)
    expect(removed[0].text).toBe('line2')
  })

  it('handles completely different texts', () => {
    const result = computeDiff('old', 'new')
    // 'old' removed, 'new' added — each produces aligned left/right pair
    expect(result.left[0].type).toBe('removed')
    expect(result.left[0].text).toBe('old')
    expect(result.right[1].type).toBe('added')
    expect(result.right[1].text).toBe('new')
  })

  it('handles empty original', () => {
    const result = computeDiff('', 'hello\nworld')
    const added = result.right.filter((l) => l.type === 'added')
    expect(added).toHaveLength(2)
    expect(added[0].text).toBe('hello')
    expect(added[1].text).toBe('world')
  })

  it('handles empty updated', () => {
    const result = computeDiff('hello\nworld', '')
    const removed = result.left.filter((l) => l.type === 'removed')
    expect(removed).toHaveLength(2)
    expect(removed[0].text).toBe('hello')
    expect(removed[1].text).toBe('world')
  })

  it('handles mixed changes', () => {
    const result = computeDiff(
      'header\nold body\nfooter',
      'header\nnew body\nfooter\nappendix',
    )
    expect(result.left.map((l) => l.type)).toEqual([
      'unchanged', 'removed', 'added', 'unchanged', 'added',
    ])
    expect(result.right.map((l) => l.type)).toEqual([
      'unchanged', 'removed', 'added', 'unchanged', 'added',
    ])
    expect(result.right[2].text).toBe('new body')
    expect(result.right[4].text).toBe('appendix')
  })

  it('left and right have same length', () => {
    const result = computeDiff('a\nb\nc', 'a\nx\nc\nd')
    expect(result.left.length).toBe(result.right.length)
  })
})
