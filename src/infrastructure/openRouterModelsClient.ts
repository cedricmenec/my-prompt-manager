import type { AiProviderModel } from './db'
import { getAiProviderDefinition, SUPPORTED_AI_PROVIDER_ID } from './aiProviders'

export class OpenRouterModelsError extends Error {
  readonly kind: 'missing-key' | 'authorization' | 'rate-limit' | 'quota' | 'network' | 'provider' | 'invalid-response'

  constructor(
    message: string,
    kind: 'missing-key' | 'authorization' | 'rate-limit' | 'quota' | 'network' | 'provider' | 'invalid-response',
  ) {
    super(message)
    this.name = 'OpenRouterModelsError'
    this.kind = kind
  }
}

type OpenRouterModel = {
  id?: unknown
  name?: unknown
  canonical_slug?: unknown
  architecture?: {
    modality?: unknown
    input_modalities?: unknown
    output_modalities?: unknown
  }
  pricing?: unknown
  [key: string]: unknown
}

type OpenRouterModelsResponse = {
  data?: unknown
}

export async function fetchOpenRouterModels(apiKey: string, signal?: AbortSignal): Promise<AiProviderModel[]> {
  const trimmedKey = apiKey.trim()
  if (!trimmedKey) {
    throw new OpenRouterModelsError('Enter an OpenRouter API key before loading models.', 'missing-key')
  }

  const provider = getAiProviderDefinition(SUPPORTED_AI_PROVIDER_ID)
  if (!provider?.modelListUrl) {
    throw new OpenRouterModelsError('OpenRouter model endpoint is not configured.', 'provider')
  }

  let response: Response
  try {
    const requestInit: RequestInit = {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${trimmedKey}`,
      },
      ...(signal ? { signal } : {}),
    }
    response = await fetch(provider.modelListUrl, requestInit)
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new OpenRouterModelsError('OpenRouter could not be reached. Check your network or browser CORS policy.', 'network')
  }

  if (!response.ok) {
    throw mapOpenRouterHttpError(response.status)
  }

  let payload: OpenRouterModelsResponse
  try {
    payload = (await response.json()) as OpenRouterModelsResponse
  } catch {
    throw new OpenRouterModelsError('OpenRouter returned invalid JSON.', 'invalid-response')
  }

  return normalizeOpenRouterModels(payload, new Date().toISOString())
}

export function normalizeOpenRouterModels(payload: OpenRouterModelsResponse, fetchedAt: string): AiProviderModel[] {
  if (!Array.isArray(payload.data)) {
    throw new OpenRouterModelsError('OpenRouter model response did not include a model list.', 'invalid-response')
  }

  return payload.data
    .map((entry) => normalizeOpenRouterModel(entry as OpenRouterModel, fetchedAt))
    .filter((model): model is AiProviderModel => model !== null)
    .sort((a, b) => a.name.localeCompare(b.name))
}

function normalizeOpenRouterModel(entry: OpenRouterModel, fetchedAt: string): AiProviderModel | null {
  const id = typeof entry.id === 'string' ? entry.id : undefined
  if (!id) return null

  const explicitName = typeof entry.name === 'string' ? entry.name : undefined
  const canonicalSlug = typeof entry.canonical_slug === 'string' ? entry.canonical_slug : undefined
  const displayName = explicitName || canonicalSlug || id

  return {
    id: `openrouter:${id}`,
    providerId: SUPPORTED_AI_PROVIDER_ID,
    name: displayName,
    originProvider: deriveOriginProvider(id),
    modality: deriveModality(entry),
    tokenCost: null,
    fetchedAt,
    raw: entry,
  }
}

function deriveOriginProvider(modelId: string): string {
  const [provider] = modelId.split('/')
  return provider ? titleCase(provider.replace(/[-_]/g, ' ')) : 'OpenRouter'
}

function deriveModality(entry: OpenRouterModel): AiProviderModel['modality'] {
  const modalities = [
    ...toStringArray(entry.architecture?.input_modalities),
    ...toStringArray(entry.architecture?.output_modalities),
  ]
  const modality = typeof entry.architecture?.modality === 'string' ? entry.architecture.modality : ''
  const haystack = [...modalities, modality].join(' ').toLowerCase()

  const supportsText = haystack.includes('text') || haystack.length === 0
  const supportsImage = haystack.includes('image') || haystack.includes('vision')

  if (supportsText && supportsImage) return 'multimodal'
  if (supportsImage) return 'image'
  if (supportsText) return 'text'
  return 'unknown'
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : []
}

function titleCase(value: string): string {
  return value.replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function mapOpenRouterHttpError(status: number): OpenRouterModelsError {
  if (status === 401 || status === 403) {
    return new OpenRouterModelsError('OpenRouter rejected the API key. Check the key and try again.', 'authorization')
  }
  if (status === 402) {
    return new OpenRouterModelsError('OpenRouter reported a billing or quota issue for this key.', 'quota')
  }
  if (status === 429) {
    return new OpenRouterModelsError('OpenRouter rate limit reached. Wait and try again.', 'rate-limit')
  }
  return new OpenRouterModelsError('OpenRouter model loading failed. Try again later.', 'provider')
}


