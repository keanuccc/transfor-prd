import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { KnowledgeDoc } from '@/types'

interface KnowledgeState {
  docs: KnowledgeDoc[]
  addDoc: (name: string, content: string) => void
  updateDoc: (id: string, name: string, content: string) => void
  deleteDoc: (id: string) => void
}

export const useKnowledgeStore = create<KnowledgeState>()(
  persist(
    (set) => ({
      docs: [],

      addDoc: (name, content) => {
        const doc: KnowledgeDoc = {
          id: crypto.randomUUID(),
          name,
          content,
          createdAt: Date.now(),
        }
        set((s) => ({ docs: [...s.docs, doc] }))
      },

      updateDoc: (id, name, content) =>
        set((s) => ({
          docs: s.docs.map((d) => (d.id === id ? { ...d, name, content } : d)),
        })),

      deleteDoc: (id) =>
        set((s) => ({ docs: s.docs.filter((d) => d.id !== id) })),
    }),
    { name: 'transfor-prd-knowledge' },
  ),
)
