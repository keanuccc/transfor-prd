import { describe, it, expect } from 'vitest'
import { cn } from './utils'

describe('cn', () => {
  it('should merge class names', () => {
    const result = cn('px-4', 'py-2')
    expect(result).toContain('px-4')
    expect(result).toContain('py-2')
  })

  it('should handle conditional classes', () => {
    expect(cn('base', false && 'hidden', 'visible')).toContain('base')
    expect(cn('base', false && 'hidden', 'visible')).toContain('visible')
    expect(cn('base', false && 'hidden', 'visible')).not.toContain('hidden')
  })

  it('should resolve Tailwind conflicts', () => {
    const result = cn('px-2 py-1', 'px-4')
    expect(result).toContain('px-4')
    expect(result).not.toContain('px-2')
  })

  it('should handle empty inputs', () => {
    expect(cn('')).toBe('')
    expect(cn()).toBe('')
  })
})
