import { describe, it, expect } from 'vitest'
import { BUILTIN_TEMPLATES, getTemplateById, defaultTemplate } from './templates'

describe('templates', () => {
  it('should have at least 3 templates', () => {
    expect(BUILTIN_TEMPLATES.length).toBeGreaterThanOrEqual(3)
  })

  it('should have valid template IDs', () => {
    const ids = BUILTIN_TEMPLATES.map((t) => t.id)
    expect(ids).toContain('prd')
    expect(ids).toContain('user-story-map')
    expect(ids).toContain('tech-spec')
  })

  it('should have non-empty system prompts for all templates', () => {
    for (const t of BUILTIN_TEMPLATES) {
      expect(t.systemPrompt.length).toBeGreaterThan(100)
    }
  })

  it('getTemplateById returns correct template', () => {
    expect(getTemplateById('prd')).toBeDefined()
    expect(getTemplateById('prd')?.name).toContain('PRD')
    expect(getTemplateById('non-existent')).toBeUndefined()
  })

  it('default template should be PRD', () => {
    expect(defaultTemplate.id).toBe('prd')
  })
})
