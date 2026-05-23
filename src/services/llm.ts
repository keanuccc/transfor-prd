import type { LLMConfig, ChatMessage } from '@/types'

export interface StreamResult {
  content: string
  finishReason: 'stop' | 'length' | 'content_filter' | null
  thinkingContent: string | null
}

export async function* streamChatCompletion(
  config: LLMConfig,
  messages: ChatMessage[],
  abortSignal: AbortSignal,
): AsyncGenerator<string, StreamResult> {
  const url = `${config.baseUrl.replace(/\/+$/, '')}/chat/completions`

  let accumulated = ''
  let finishReason: StreamResult['finishReason'] = null
  let thinkingContent: string | null = null
  let currentThinking = ''
  let isInThinking = false

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.modelName,
      messages,
      stream: true,
    }),
    signal: abortSignal,
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error')
    throw new Error(`API request failed (${response.status}): ${errorText}`)
  }

  const reader = response.body?.getReader()
  if (!reader) throw new Error('No response body')

  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || !trimmed.startsWith('data: ')) continue

      const data = trimmed.slice(6)
      if (data === '[DONE]') {
        return { content: accumulated, finishReason, thinkingContent }
      }

      try {
        const parsed = JSON.parse(data)
        const delta = parsed.choices?.[0]?.delta
        const reason = parsed.choices?.[0]?.finish_reason

        if (reason) {
          finishReason = reason as StreamResult['finishReason']
        }

        if (delta?.reasoning_content) {
          currentThinking += delta.reasoning_content
          thinkingContent = currentThinking
        }

        if (delta?.content) {
          if (isInThinking) {
            isInThinking = false
          }
          accumulated += delta.content
          yield delta.content
        }
      } catch {
        // Skip unparseable lines
      }
    }
  }

  return { content: accumulated, finishReason, thinkingContent }
}
