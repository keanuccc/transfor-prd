import type { LLMConfig } from '@/types'

export interface PingResult {
  success: boolean
  latencyMs: number
  error?: string
}

export async function pingLLM(config: LLMConfig): Promise<PingResult> {
  const url = `${config.baseUrl.replace(/\/+$/, '')}/chat/completions`
  const start = Date.now()

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.modelName,
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 5,
        stream: false,
      }),
      signal: AbortSignal.timeout(10000),
    })

    const latencyMs = Date.now() - start

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error')
      return { success: false, latencyMs, error: `HTTP ${response.status}: ${errorText}` }
    }

    const data = await response.json()
    if (data.choices && data.choices.length > 0) {
      return { success: true, latencyMs }
    }

    return { success: false, latencyMs, error: 'Unexpected response format' }
  } catch (err) {
    return {
      success: false,
      latencyMs: Date.now() - start,
      error: err instanceof Error ? err.message : 'Connection failed',
    }
  }
}
