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
