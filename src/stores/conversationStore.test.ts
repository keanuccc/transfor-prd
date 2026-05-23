import { describe, it, expect, beforeEach } from 'vitest'
import { useConversationStore } from './conversationStore'
import type { Message } from '@/types'

function makeMsg(overrides: Partial<Message> = {}): Message {
  return {
    id: crypto.randomUUID(),
    conversationId: 'conv-1',
    role: 'user',
    content: 'test',
    status: 'completed',
    partIndex: 0,
    totalParts: null,
    thinkingContent: null,
    errorMessage: null,
    createdAt: Date.now(),
    ...overrides,
  }
}

describe('conversationStore', () => {
  beforeEach(() => {
    useConversationStore.setState({
      conversations: [],
      activeConversationId: null,
      messages: [],
      streamState: {
        isStreaming: false,
        currentPartIndex: 0,
        totalParts: null,
        abortController: null,
      },
    })
  })

  it('should set active conversation', () => {
    useConversationStore.getState().setActiveConversation('test-id')
    expect(useConversationStore.getState().activeConversationId).toBe('test-id')
  })

  it('should clear messages when setting null active conversation', () => {
    useConversationStore.setState({ messages: [makeMsg()] })
    useConversationStore.getState().setActiveConversation(null)
    expect(useConversationStore.getState().messages).toHaveLength(0)
  })

  it('should add message', async () => {
    const msg = makeMsg()
    await useConversationStore.getState().addMessage(msg)
    expect(useConversationStore.getState().messages).toHaveLength(1)
    expect(useConversationStore.getState().messages[0].id).toBe(msg.id)
  })

  it('should update message', async () => {
    const msg = makeMsg({ content: 'original' })
    await useConversationStore.getState().addMessage(msg)
    await useConversationStore.getState().updateMessage(msg.id, { content: 'updated' })
    expect(useConversationStore.getState().messages[0].content).toBe('updated')
  })

  it('should set stream state', () => {
    useConversationStore.getState().setStreamState({ isStreaming: true })
    expect(useConversationStore.getState().streamState.isStreaming).toBe(true)
  })

  it('should stop streaming and abort', () => {
    const abortController = new AbortController()
    const abortSpy = vi.spyOn(abortController, 'abort')

    useConversationStore.getState().setStreamState({
      isStreaming: true,
      abortController,
    })
    useConversationStore.getState().stopStreaming()

    expect(abortSpy).toHaveBeenCalled()
    expect(useConversationStore.getState().streamState.isStreaming).toBe(false)
    expect(useConversationStore.getState().streamState.abortController).toBeNull()
  })
})
