import { create } from 'zustand'
import { db } from '@/db'
import type { Conversation, Message, StreamState } from '@/types'

interface ConversationState {
  conversations: Conversation[]
  activeConversationId: string | null
  messages: Message[]
  streamState: StreamState
  loadConversations: () => Promise<void>
  createConversation: (conv: Conversation) => Promise<void>
  deleteConversation: (id: string) => Promise<void>
  setActiveConversation: (id: string | null) => Promise<void>
  loadMessages: (conversationId: string) => Promise<void>
  addMessage: (message: Message) => Promise<void>
  updateMessage: (id: string, updates: Partial<Message>) => Promise<void>
  setStreamState: (updates: Partial<StreamState>) => void
  stopStreaming: () => void
}

const initialStreamState: StreamState = {
  isStreaming: false,
  currentPartIndex: 0,
  totalParts: null,
  abortController: null,
}

export const useConversationStore = create<ConversationState>((set, get) => ({
  conversations: [],
  activeConversationId: null,
  messages: [],
  streamState: initialStreamState,

  loadConversations: async () => {
    const conversations = await db.conversations.orderBy('updatedAt').reverse().toArray()
    set({ conversations })
  },

  createConversation: async (conv) => {
    await db.conversations.add(conv)
    set((s) => ({ conversations: [conv, ...s.conversations] }))
  },

  deleteConversation: async (id) => {
    await db.transaction('rw', [db.conversations, db.messages], async () => {
      await db.conversations.delete(id)
      await db.messages.where('conversationId').equals(id).delete()
    })
    set((s) => ({
      conversations: s.conversations.filter((c) => c.id !== id),
      activeConversationId: s.activeConversationId === id ? null : s.activeConversationId,
      messages: s.activeConversationId === id ? [] : s.messages,
    }))
  },

  setActiveConversation: async (id) => {
    set({ activeConversationId: id })
    if (id) {
      await get().loadMessages(id)
    } else {
      set({ messages: [] })
    }
  },

  loadMessages: async (conversationId) => {
    const messages = await db.messages
      .where('conversationId')
      .equals(conversationId)
      .sortBy('createdAt')
    set({ messages })
  },

  addMessage: async (message) => {
    await db.messages.add(message)
    set((s) => ({ messages: [...s.messages, message] }))
  },

  updateMessage: async (id, updates) => {
    await db.messages.update(id, updates)
    set((s) => ({
      messages: s.messages.map((m) => (m.id === id ? { ...m, ...updates } : m)),
    }))
  },

  setStreamState: (updates) =>
    set((s) => ({ streamState: { ...s.streamState, ...updates } })),

  stopStreaming: () => {
    const { streamState } = get()
    streamState.abortController?.abort()
    set({ streamState: { ...initialStreamState } })
  },
}))
