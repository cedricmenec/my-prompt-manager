import { beforeEach, describe, expect, it, vi } from 'vitest'
import 'fake-indexeddb/auto'
import { IDBFactory } from 'fake-indexeddb'
import { generatePromptField } from './promptFieldGenerationService'
import { aiProviderSettingsRepository } from '@/infrastructure/aiProviderSettingsRepository'
import { resetDb, type AiProviderModel } from '@/infrastructure/db'
import { sessionCredentials } from '@/infrastructure/sessionCredentials'

const fetchedAt = '2026-06-06T12:00:00.000Z'
const textModel: AiProviderModel = {
  id: 'openrouter:openai/gpt-test',
  providerId: 'openrouter',
  name: 'GPT Test',
  originProvider: 'Openai',
  modality: 'text',
  tokenCost: null,
  fetchedAt,
}
const imageModel: AiProviderModel = {
  id: 'openrouter:stability/image-test',
  providerId: 'openrouter',
  name: 'Image Test',
  originProvider: 'Stability',
  modality: 'image',
  tokenCost: null,
  fetchedAt,
}

beforeEach(async () => {
  vi.restoreAllMocks()
  globalThis.structuredClone = <T>(value: T) => value
  globalThis.indexedDB = new IDBFactory()
  resetDb()
  sessionCredentials.clearAll()
})

async function configureAssistant(model: AiProviderModel = textModel) {
  await aiProviderSettingsRepository.replaceProviderModels('openrouter', [textModel, imageModel], fetchedAt)
  await aiProviderSettingsRepository.setEnabledModels('openrouter', [model.id])
  await aiProviderSettingsRepository.saveFeatureSettings('prompt-input-assistant', {
    providerId: 'openrouter',
    modelId: model.id,
  })
  sessionCredentials.setApiKey('openrouter', 'sk-or-session')
}

describe('generatePromptField', () => {
  it('generates and normalizes a title', async () => {
    await configureAssistant()
    const generateText = vi.fn().mockResolvedValue('  ```\nA Useful Prompt Title\n```  ')

    const result = await generatePromptField({
      fieldId: 'title',
      content: 'Write release notes from this changelog.',
      generateText,
    })

    expect(result).toBe('A Useful Prompt Title')
    expect(generateText).toHaveBeenCalledWith(expect.objectContaining({
      apiKey: 'sk-or-session',
      modelId: textModel.id,
    }))
  })

  it('generates a description', async () => {
    await configureAssistant()
    const generateText = vi.fn().mockResolvedValue('Summarizes changelog entries into release notes.')

    const result = await generatePromptField({
      fieldId: 'description',
      content: 'Write release notes from this changelog.',
      generateText,
    })

    expect(result).toBe('Summarizes changelog entries into release notes.')
  })

  it('rejects empty prompt content before calling a provider', async () => {
    const generateText = vi.fn()

    await expect(generatePromptField({ fieldId: 'title', content: ' ', generateText })).rejects.toMatchObject({
      kind: 'empty-content',
    })
    expect(generateText).not.toHaveBeenCalled()
  })

  it('rejects unsupported fields before calling a provider', async () => {
    const generateText = vi.fn()

    await expect(generatePromptField({ fieldId: 'tags', content: 'Prompt content', generateText })).rejects.toMatchObject({
      kind: 'unsupported-field',
    })
    expect(generateText).not.toHaveBeenCalled()
  })

  it('requires a selected assistant model', async () => {
    sessionCredentials.setApiKey('openrouter', 'sk-or-session')

    await expect(generatePromptField({ fieldId: 'title', content: 'Prompt content' })).rejects.toMatchObject({
      kind: 'missing-model-selection',
    })
  })

  it('requires a session key', async () => {
    await configureAssistant()
    sessionCredentials.clearAll()

    await expect(generatePromptField({ fieldId: 'title', content: 'Prompt content' })).rejects.toMatchObject({
      kind: 'missing-session-key',
    })
  })

  it('redacts API keys from provider errors', async () => {
    await configureAssistant()
    const generateText = vi.fn().mockRejectedValue(new Error('Provider failed with sk-or-secret-value'))

    await expect(generatePromptField({ fieldId: 'title', content: 'Prompt content', generateText })).rejects.toMatchObject({
      message: 'Provider failed with [redacted-api-key]',
    })
  })

  it('rejects selected models that are no longer enabled for text generation', async () => {
    await configureAssistant(imageModel)

    await expect(generatePromptField({ fieldId: 'title', content: 'Prompt content' })).rejects.toMatchObject({
      kind: 'missing-model-selection',
    })
  })
})