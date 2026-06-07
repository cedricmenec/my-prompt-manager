import { beforeEach, describe, expect, it, vi } from 'vitest'
import { callOpenRouterTextGeneration, normalizeGenerationResponse, OpenRouterGenerationError } from './openRouterGenerationClient'

describe('normalizeGenerationResponse', () => {
  it('normalizes chat completion text output', () => {
    expect(
      normalizeGenerationResponse({
        choices: [{ message: { content: ' Generated title ' } }],
      }),
    ).toBe('Generated title')
  })
})

describe('callOpenRouterTextGeneration', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('posts chat completion requests with bearer authentication', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'Generated title' } }] }),
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await callOpenRouterTextGeneration({
      apiKey: 'sk-or-test',
      modelId: 'openrouter:openai/gpt-test',
      messages: [{ role: 'user', content: 'Prompt content' }],
    })

    expect(result).toBe('Generated title')
    expect(fetchMock).toHaveBeenCalledWith(
      'https://openrouter.ai/api/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer sk-or-test',
          'Content-Type': 'application/json',
        }),
      }),
    )
    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string)
    expect(body.model).toBe('openai/gpt-test')
    expect(body.messages).toEqual([{ role: 'user', content: 'Prompt content' }])
  })

  it('maps missing keys before calling OpenRouter', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      callOpenRouterTextGeneration({ apiKey: ' ', modelId: 'openrouter:test', messages: [] }),
    ).rejects.toMatchObject({ kind: 'missing-key' })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('maps authorization and quota errors without exposing the key', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 401 }))

    await expect(
      callOpenRouterTextGeneration({ apiKey: 'sk-or-secret', modelId: 'openrouter:test', messages: [] }),
    ).rejects.toMatchObject({ kind: 'authorization' })
    await expect(
      callOpenRouterTextGeneration({ apiKey: 'sk-or-secret', modelId: 'openrouter:test', messages: [] }),
    ).rejects.not.toThrow('sk-or-secret')
  })

  it('maps invalid responses', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [] }),
    }))

    await expect(
      callOpenRouterTextGeneration({ apiKey: 'sk-or-test', modelId: 'openrouter:test', messages: [] }),
    ).rejects.toMatchObject({ kind: 'invalid-response' })
  })

  it('maps aborts to cancellation errors', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new DOMException('Aborted', 'AbortError')))

    await expect(
      callOpenRouterTextGeneration({ apiKey: 'sk-or-test', modelId: 'openrouter:test', messages: [] }),
    ).rejects.toBeInstanceOf(OpenRouterGenerationError)
    await expect(
      callOpenRouterTextGeneration({ apiKey: 'sk-or-test', modelId: 'openrouter:test', messages: [] }),
    ).rejects.toMatchObject({ kind: 'cancelled' })
  })
})