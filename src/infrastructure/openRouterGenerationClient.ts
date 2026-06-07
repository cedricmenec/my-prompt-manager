import { getAiProviderDefinition, SUPPORTED_AI_PROVIDER_ID } from './aiProviders'

export type OpenRouterGenerationErrorKind =
  | 'missing-key'
  | 'authorization'
  | 'rate-limit'
  | 'quota'
  | 'network'
  | 'provider'
  | 'invalid-response'
  | 'cancelled'

export class OpenRouterGenerationError extends Error {
  readonly kind: OpenRouterGenerationErrorKind

  constructor(message: string, kind: OpenRouterGenerationErrorKind) {
    super(message)
    this.name = 'OpenRouterGenerationError'
    this.kind = kind
  }
}

export interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface OpenRouterGenerationRequest {
  apiKey: string
  modelId: string
  messages: OpenRouterMessage[]
  signal?: AbortSignal
}

interface OpenRouterGenerationResponse {
  choices?: Array<{
    message?: {
      content?: unknown
    }
    text?: unknown
  }>
}

export async function callOpenRouterTextGeneration({
  apiKey,
  modelId,
  messages,
  signal,
}: OpenRouterGenerationRequest): Promise<string> {
  const trimmedKey = apiKey.trim()
  if (!trimmedKey) {
    throw new OpenRouterGenerationError('Enter an OpenRouter API key in Settings before generating text.', 'missing-key')
  }
  if (!modelId.trim()) {
    throw new OpenRouterGenerationError('Select an AI Assistant model before generating text.', 'provider')
  }

  const provider = getAiProviderDefinition(SUPPORTED_AI_PROVIDER_ID)
  if (!provider?.baseUrl) {
    throw new OpenRouterGenerationError('OpenRouter generation endpoint is not configured.', 'provider')
  }

  let response: Response
  try {
    response = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${trimmedKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: toOpenRouterModelId(modelId),
        messages,
      }),
      ...(signal ? { signal } : {}),
    })
  } catch (error) {
    if (isAbortError(error)) {
      throw new OpenRouterGenerationError('Generation was cancelled.', 'cancelled')
    }
    throw new OpenRouterGenerationError('OpenRouter could not be reached. Check your network or browser CORS policy.', 'network')
  }

  if (!response.ok) {
    throw mapOpenRouterGenerationHttpError(response.status)
  }

  let payload: OpenRouterGenerationResponse
  try {
    payload = (await response.json()) as OpenRouterGenerationResponse
  } catch {
    throw new OpenRouterGenerationError('OpenRouter returned invalid JSON.', 'invalid-response')
  }

  const output = normalizeGenerationResponse(payload)
  if (!output) {
    throw new OpenRouterGenerationError('OpenRouter did not return generated text.', 'invalid-response')
  }
  return output
}

export function normalizeGenerationResponse(payload: OpenRouterGenerationResponse): string {
  const firstChoice = Array.isArray(payload.choices) ? payload.choices[0] : undefined
  const content = firstChoice?.message?.content ?? firstChoice?.text
  return typeof content === 'string' ? content.trim() : ''
}

function toOpenRouterModelId(modelId: string): string {
  return modelId.startsWith('openrouter:') ? modelId.slice('openrouter:'.length) : modelId
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}

function mapOpenRouterGenerationHttpError(status: number): OpenRouterGenerationError {
  if (status === 401 || status === 403) {
    return new OpenRouterGenerationError('OpenRouter rejected the API key. Check the key and try again.', 'authorization')
  }
  if (status === 402) {
    return new OpenRouterGenerationError('OpenRouter reported a billing or quota issue for this key.', 'quota')
  }
  if (status === 429) {
    return new OpenRouterGenerationError('OpenRouter rate limit reached. Wait and try again.', 'rate-limit')
  }
  return new OpenRouterGenerationError('OpenRouter generation failed. Try again later.', 'provider')
}