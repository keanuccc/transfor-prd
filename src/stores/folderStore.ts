import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Folder } from '@/types'

interface FolderState {
  folders: Folder[]
  addFolder: (name: string) => Folder
  renameFolder: (id: string, name: string) => void
  deleteFolder: (id: string) => void
}

export const useFolderStore = create<FolderState>()(
  persist(
    (set) => ({
      folders: [],

      addFolder: (name) => {
        const folder: Folder = {
          id: crypto.randomUUID(),
          name,
          createdAt: Date.now(),
        }
        set((s) => ({ folders: [...s.folders, folder] }))
        return folder
      },

      renameFolder: (id, name) =>
        set((s) => ({
          folders: s.folders.map((f) => (f.id === id ? { ...f, name } : f)),
        })),

      deleteFolder: (id) =>
        set((s) => ({
          folders: s.folders.filter((f) => f.id !== id),
        })),
    }),
    { name: 'transfor-prd-folders' },
  ),
)
