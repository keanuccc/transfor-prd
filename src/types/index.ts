export interface LLMConfig {
  id: string
  baseUrl: string
  modelName: string
  apiKey: string
  displayOrder: number
  isDefault: boolean
  lastPingSuccess?: boolean
}

export interface Conversation {
  id: string
  title: string
  llmConfigId: string
  templateId: string
  createdAt: number
  updatedAt: number
  sourceFileName: string
  sourceFileContent: string
  userDescription: string
  tags: string[]
  starred: boolean
  folderId?: string
}

export interface Folder {
  id: string
  name: string
  createdAt: number
}

export interface KnowledgeDoc {
  id: string
  name: string
  content: string
  createdAt: number
}

export type MessageRole = 'user' | 'assistant' | 'system'
export type MessageStatus = 'streaming' | 'completed' | 'stopped' | 'error'

export interface Message {
  id: string
  conversationId: string
  role: MessageRole
  content: string
  status: MessageStatus
  partIndex: number
  totalParts: number | null
  thinkingContent: string | null
  errorMessage: string | null
  createdAt: number
}

export interface StreamState {
  isStreaming: boolean
  currentPartIndex: number
  totalParts: number | null
  abortController: AbortController | null
}

export interface AppSettings {
  systemPrompt: string
  autoContinue: boolean
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface Snapshot {
  id: string
  conversationId: string
  content: string
  label: string
  createdAt: number
}
