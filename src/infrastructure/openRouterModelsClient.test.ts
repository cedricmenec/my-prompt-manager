import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchOpenRouterModels, normalizeOpenRouterModels, OpenRouterModelsError } from './openRouterModelsClient'

describe('normalizeOpenRouterModels', () => {
  it('normalizes OpenRouter records into app-owned model records', () => {
    const models = normalizeOpenRouterModels(
      {
        data: [
          {
            id: 'openai/gpt-4.1',
            name: 'GPT 4.1',
            architecture: { input_modalities: ['text'], output_modalities: ['text'] },
            pricing: { prompt: '0.000001' },
          },
          {
            id: 'google/gemini-vision',
            architecture: { input_modalities: ['text', 'image'], output_modalities: ['text'] },
          },
        ],
      },
      '2026-06-06T12:00:00.000Z',
    )

    expect(models).toMatchObject([
      {
        id: 'openrouter:google/gemini-vision',
        providerId: 'openrouter',
        name: 'google/gemini-vision',
        originProvider: 'Google',
        modality: 'multimodal',
        tokenCost: null,
      },
      {
        id: 'openrouter:openai/gpt-4.1',
        providerId: 'openrouter',
        name: 'GPT 4.1',
        originProvider: 'Openai',
        modality: 'text',
        tokenCost: null,
      },
    ])
  })

  it('rejects invalid response shapes', () => {
    expect(() => normalizeOpenRouterModels({}, 'now')).toThrow(OpenRouterModelsError)
  })
})

describe('fetchOpenRouterModels', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('sends bearer auth and normalizes successful responses', async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ data: [{ id: 'mistralai/mistral-test', name: 'Mistral Test' }] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const models = await fetchOpenRouterModels('sk-or-test')

    expect(fetchMock).toHaveBeenCalledWith(
      'https://openrouter.ai/api/v1/models',
      expect.objectContaining({
        headers: { Authorization: 'Bearer sk-or-test' },
      }),
    )
    expect(models[0].id).toBe('openrouter:mistralai/mistral-test')
  })

  it('maps auth errors without exposing the API key', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('nope', { status: 401 })))

    await expect(fetchOpenRouterModels('sk-or-secret')).rejects.toMatchObject({
      kind: 'authorization',
    })
    await expect(fetchOpenRouterModels('sk-or-secret')).rejects.not.toThrow('sk-or-secret')
  })

  it('blocks missing keys before calling OpenRouter', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    await expect(fetchOpenRouterModels(' ')).rejects.toMatchObject({ kind: 'missing-key' })
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
