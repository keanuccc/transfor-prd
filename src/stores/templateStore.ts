import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CustomTemplate {
  id: string
  name: string
  description: string
  icon: string
  systemPrompt: string
  createdAt: number
  updatedAt: number
}

interface TemplateState {
  customTemplates: CustomTemplate[]
  addTemplate: (t: CustomTemplate) => void
  updateTemplate: (id: string, updates: Partial<CustomTemplate>) => void
  deleteTemplate: (id: string) => void
}

export const useTemplateStore = create<TemplateState>()(
  persist(
    (set) => ({
      customTemplates: [],

      addTemplate: (t) =>
        set((s) => ({ customTemplates: [...s.customTemplates, t] })),

      updateTemplate: (id, updates) =>
        set((s) => ({
          customTemplates: s.customTemplates.map((t) =>
            t.id === id ? { ...t, ...updates, updatedAt: Date.now() } : t,
          ),
        })),

      deleteTemplate: (id) =>
        set((s) => ({
          customTemplates: s.customTemplates.filter((t) => t.id !== id),
        })),
    }),
    {
      name: 'transfor-prd-templates',
      partialize: (state) => ({ customTemplates: state.customTemplates }),
    },
  ),
)
