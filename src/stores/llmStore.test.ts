import { describe, it, expect, beforeEach } from 'vitest'
import { useLLMStore } from './llmStore'
import type { LLMConfig } from '@/types'

function makeConfig(overrides: Partial<LLMConfig> = {}): LLMConfig {
  return {
    id: crypto.randomUUID(),
    baseUrl: 'https://api.openai.com/v1',
    modelName: 'gpt-4o',
    apiKey: 'sk-test',
    displayOrder: 0,
    isDefault: false,
    ...overrides,
  }
}

describe('llmStore', () => {
  beforeEach(() => {
    useLLMStore.setState({ configs: [] })
  })

  it('should add config', () => {
    const config = makeConfig()
    useLLMStore.getState().addConfig(config)
    expect(useLLMStore.getState().configs).toHaveLength(1)
    expect(useLLMStore.getState().configs[0].id).toBe(config.id)
  })

  it('should update config', () => {
    const config = makeConfig()
    useLLMStore.getState().addConfig(config)
    useLLMStore.getState().updateConfig(config.id, { modelName: 'gpt-4-turbo' })
    expect(useLLMStore.getState().configs[0].modelName).toBe('gpt-4-turbo')
  })

  it('should delete config', () => {
    const config = makeConfig()
    useLLMStore.getState().addConfig(config)
    useLLMStore.getState().deleteConfig(config.id)
    expect(useLLMStore.getState().configs).toHaveLength(0)
  })

  it('should set default and ensure only one default', () => {
    const a = makeConfig({ id: 'a', isDefault: true })
    const b = makeConfig({ id: 'b' })
    useLLMStore.getState().addConfig(a)
    useLLMStore.getState().addConfig(b)
    useLLMStore.getState().setDefault('b')

    const configs = useLLMStore.getState().configs
    expect(configs.find((c) => c.id === 'a')?.isDefault).toBe(false)
    expect(configs.find((c) => c.id === 'b')?.isDefault).toBe(true)
  })

  it('should auto-assign default when deleting the default config', () => {
    const a = makeConfig({ id: 'a', isDefault: true })
    const b = makeConfig({ id: 'b' })
    useLLMStore.getState().addConfig(a)
    useLLMStore.getState().addConfig(b)
    useLLMStore.getState().deleteConfig('a')

    expect(useLLMStore.getState().configs[0].isDefault).toBe(true)
  })

  it('getDefaultConfig returns default or first config', () => {
    const a = makeConfig({ id: 'a', isDefault: true })
    useLLMStore.getState().addConfig(a)
    expect(useLLMStore.getState().getDefaultConfig()?.id).toBe('a')

    useLLMStore.setState({ configs: [] })
    const b = makeConfig({ id: 'b' })
    useLLMStore.getState().addConfig(b)
    expect(useLLMStore.getState().getDefaultConfig()?.id).toBe('b')
  })

  it('getConfigById returns correct config', () => {
    const config = makeConfig({ id: 'test-id' })
    useLLMStore.getState().addConfig(config)
    expect(useLLMStore.getState().getConfigById('test-id')).toBeDefined()
    expect(useLLMStore.getState().getConfigById('non-existent')).toBeUndefined()
  })
})
