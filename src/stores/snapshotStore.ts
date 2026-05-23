import { create } from 'zustand'
import { db } from '@/db'
import type { Snapshot } from '@/types'

interface SnapshotState {
  snapshots: Snapshot[]
  loadSnapshots: (conversationId: string) => Promise<void>
  createSnapshot: (conversationId: string, content: string, label: string) => Promise<Snapshot>
  deleteSnapshot: (id: string) => Promise<void>
  restoreSnapshot: (id: string) => Promise<Snapshot | undefined>
}

export const useSnapshotStore = create<SnapshotState>((set) => ({
  snapshots: [],

  loadSnapshots: async (conversationId) => {
    const snapshots = await db.snapshots
      .where('conversationId')
      .equals(conversationId)
      .reverse()
      .sortBy('createdAt')
    set({ snapshots })
  },

  createSnapshot: async (conversationId, content, label) => {
    const snapshot: Snapshot = {
      id: crypto.randomUUID(),
      conversationId,
      content,
      label,
      createdAt: Date.now(),
    }
    await db.snapshots.add(snapshot)
    set((s) => ({ snapshots: [snapshot, ...s.snapshots] }))
    return snapshot
  },

  deleteSnapshot: async (id) => {
    await db.snapshots.delete(id)
    set((s) => ({ snapshots: s.snapshots.filter((sn) => sn.id !== id) }))
  },

  restoreSnapshot: async (id) => {
    const snapshot = await db.snapshots.get(id)
    return snapshot
  },
}))
