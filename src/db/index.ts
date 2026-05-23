import Dexie, { type Table } from 'dexie'
import type { Conversation, Message } from '@/types'

class AppDatabase extends Dexie {
  conversations!: Table<Conversation, string>
  messages!: Table<Message, string>

  constructor() {
    super('transfor-prd')
    this.version(1).stores({
      conversations: 'id, createdAt, updatedAt',
      messages: 'id, conversationId, createdAt',
    })
  }
}

export const db = new AppDatabase()
