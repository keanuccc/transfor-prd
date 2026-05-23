import Dexie, { type Table } from 'dexie'
import type { Conversation, Message, Snapshot } from '@/types'

class AppDatabase extends Dexie {
  conversations!: Table<Conversation, string>
  messages!: Table<Message, string>
  snapshots!: Table<Snapshot, string>

  constructor() {
    super('transfor-prd')
    this.version(1).stores({
      conversations: 'id, createdAt, updatedAt',
      messages: 'id, conversationId, createdAt',
    })
    this.version(2).upgrade(async (tx) => {
      await tx.table('conversations').toCollection().modify((conv) => {
        if (conv.tags === undefined) conv.tags = []
        if (conv.starred === undefined) conv.starred = false
      })
    })
    this.version(3).stores({
      conversations: 'id, createdAt, updatedAt',
      messages: 'id, conversationId, createdAt',
      snapshots: 'id, conversationId, createdAt',
    })
  }
}

export const db = new AppDatabase()
