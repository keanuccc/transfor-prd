import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { LLMConfig } from '@/types'
import { createEncryptedStorage } from '@/lib/cryptoStorage'

interface LLMState {
  configs: LLMConfig[]
  addConfig: (config: LLMConfig) => void
  updateConfig: (id: string, updates: Partial<LLMConfig>) => void
  deleteConfig: (id: string) => void
  setDefault: (id: string) => void
  reorderConfigs: (ids: string[]) => void
  getDefaultConfig: () => LLMConfig | undefined
  getConfigById: (id: string) => LLMConfig | undefined
}

export const useLLMStore = create<LLMState>()(
  persist(
    (set, get) => ({
      configs: [],

      addConfig: (config) =>
        set((s) => ({ configs: [...s.configs, config] })),

      updateConfig: (id, updates) =>
        set((s) => ({
          configs: s.configs.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        })),

      deleteConfig: (id) =>
        set((s) => {
          const deleted = s.configs.find((c) => c.id === id)
          const remaining = s.configs.filter((c) => c.id !== id)
          if (deleted?.isDefault && remaining.length > 0) {
            remaining[0] = { ...remaining[0], isDefault: true }
          }
          return { configs: remaining }
        }),

      setDefault: (id) =>
        set((s) => ({
          configs: s.configs.map((c) => ({
            ...c,
            isDefault: c.id === id,
          })),
        })),

      reorderConfigs: (ids) =>
        set((s) => ({
          configs: ids
            .map((id, index) => {
              const config = s.configs.find((c) => c.id === id)
              return config ? { ...config, displayOrder: index } : null
            })
            .filter(Boolean) as LLMConfig[],
        })),

      getDefaultConfig: () => {
        const { configs } = get()
        return configs.find((c) => c.isDefault) || configs[0]
      },

      getConfigById: (id) => {
        const { configs } = get()
        return configs.find((c) => c.id === id)
      },
    }),
    { name: 'llm-store', storage: createEncryptedStorage() },
  ),
)
