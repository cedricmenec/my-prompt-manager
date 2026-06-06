export type AiProviderDefinition = {
  id: string
  label: string
  kind: 'api' | 'local'
  status: 'supported' | 'planned'
  baseUrl?: string
  modelListUrl?: string
  apiKeyUrl?: string
  supportsTextModels: boolean
  supportsImageModels: boolean
}

export const AI_PROVIDER_DEFINITIONS: AiProviderDefinition[] = [
  {
    id: 'openrouter',
    label: 'OpenRouter',
    kind: 'api',
    status: 'supported',
    baseUrl: 'https://openrouter.ai/api/v1',
    modelListUrl: 'https://openrouter.ai/api/v1/models',
    apiKeyUrl: 'https://openrouter.ai/keys',
    supportsTextModels: true,
    supportsImageModels: true,
  },
  {
    id: 'openai',
    label: 'OpenAI API',
    kind: 'api',
    status: 'planned',
    supportsTextModels: true,
    supportsImageModels: true,
  },
  {
    id: 'local-runtime',
    label: 'Local runtime',
    kind: 'local',
    status: 'planned',
    supportsTextModels: true,
    supportsImageModels: false,
  },
]

export const SUPPORTED_AI_PROVIDER_ID = 'openrouter'

export function getAiProviderDefinition(providerId: string): AiProviderDefinition | undefined {
  return AI_PROVIDER_DEFINITIONS.find((provider) => provider.id === providerId)
}
