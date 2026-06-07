import { getPromptGeneratedFieldDefinition, type PromptGeneratedFieldId } from '@/domain/promptGeneratedFields'
import { aiProviderSettingsRepository } from '@/infrastructure/aiProviderSettingsRepository'
import { callOpenRouterTextGeneration } from '@/infrastructure/openRouterGenerationClient'
import { sessionCredentials } from '@/infrastructure/sessionCredentials'
import { redactApiSecrets } from '@/infrastructure/secretRedaction'

export type PromptFieldGenerationErrorKind =
  | 'empty-content'
  | 'unsupported-field'
  | 'missing-model-selection'
  | 'missing-session-key'
  | 'provider-error'

export class PromptFieldGenerationError extends Error {
  readonly kind: PromptFieldGenerationErrorKind

  constructor(message: string, kind: PromptFieldGenerationErrorKind) {
    super(message)
    this.name = 'PromptFieldGenerationError'
    this.kind = kind
  }
}

export interface GeneratePromptFieldInput {
  fieldId: PromptGeneratedFieldId | string
  content: string
  signal?: AbortSignal
  generateText?: typeof callOpenRouterTextGeneration
}

export async function generatePromptField({
  fieldId,
  content,
  signal,
  generateText = callOpenRouterTextGeneration,
}: GeneratePromptFieldInput): Promise<string> {
  const definition = getPromptGeneratedFieldDefinition(fieldId)
  if (!definition) {
    throw new PromptFieldGenerationError('This prompt field cannot be generated yet.', 'unsupported-field')
  }

  const trimmedContent = content.trim()
  if (!trimmedContent) {
    throw new PromptFieldGenerationError('Enter prompt content before generating this field.', 'empty-content')
  }

  const settings = await aiProviderSettingsRepository.getFeatureSettings('prompt-input-assistant')
  if (!settings) {
    throw new PromptFieldGenerationError('Select an AI Assistant model in Settings before generating prompt fields.', 'missing-model-selection')
  }

  const enabledModels = await aiProviderSettingsRepository.listEnabledProviderModels(settings.providerId)
  const selectedModel = enabledModels.find(
    (model) => model.id === settings.modelId && (model.modality === 'text' || model.modality === 'multimodal'),
  )
  if (!selectedModel) {
    throw new PromptFieldGenerationError('The selected AI Assistant model is no longer enabled. Choose another model in Settings.', 'missing-model-selection')
  }

  const apiKey = sessionCredentials.getApiKey('openrouter')
  if (!apiKey) {
    throw new PromptFieldGenerationError('Enter your OpenRouter API key in Settings for this browser session before generating prompt fields.', 'missing-session-key')
  }

  try {
    const request = {
      apiKey,
      modelId: selectedModel.id,
      messages: [
        { role: 'system' as const, content: definition.systemPrompt },
        { role: 'user' as const, content: definition.buildUserPrompt({ content: trimmedContent }) },
      ],
      ...(signal ? { signal } : {}),
    }
    const output = await generateText(request)
    return definition.normalize(output)
  } catch (error) {
    if (error instanceof PromptFieldGenerationError) throw error
    throw new PromptFieldGenerationError(
      error instanceof Error ? redactApiSecrets(error.message) : 'Prompt field generation failed.',
      'provider-error',
    )
  }
}