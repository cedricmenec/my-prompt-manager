import { beforeEach, describe, expect, it } from 'vitest'
import 'fake-indexeddb/auto'
import { IDBFactory } from 'fake-indexeddb'
import { aiProviderSettingsRepository } from './aiProviderSettingsRepository'
import { initDb, resetDb, type AiProviderModel } from './db'

const fetchedAt = '2026-06-06T12:00:00.000Z'

const models: AiProviderModel[] = [
  {
    id: 'openrouter:openai/gpt-test',
    providerId: 'openrouter',
    name: 'GPT Test',
    originProvider: 'Openai',
    modality: 'text',
    tokenCost: null,
    fetchedAt,
  },
  {
    id: 'openrouter:anthropic/claude-test',
    providerId: 'openrouter',
    name: 'Claude Test',
    originProvider: 'Anthropic',
    modality: 'text',
    tokenCost: null,
    fetchedAt,
  },
  {
    id: 'openrouter:stability/image-test',
    providerId: 'openrouter',
    name: 'Image Test',
    originProvider: 'Stability',
    modality: 'image',
    tokenCost: null,
    fetchedAt,
  },
]

beforeEach(() => {
  globalThis.structuredClone = <T>(value: T) => value
  globalThis.indexedDB = new IDBFactory()
  resetDb()
})

describe('aiProviderSettingsRepository', () => {
  it('caches provider model catalogs and provider metadata', async () => {
    await aiProviderSettingsRepository.replaceProviderModels('openrouter', models, fetchedAt)

    const cached = await aiProviderSettingsRepository.listProviderModels('openrouter')
    const connection = await aiProviderSettingsRepository.getConnection('openrouter')

    expect(cached.map((model) => model.id)).toEqual([
      'openrouter:anthropic/claude-test',
      'openrouter:openai/gpt-test',
      'openrouter:stability/image-test',
    ])
    expect(connection?.lastCatalogFetchedAt).toBe(fetchedAt)
    expect(connection).not.toHaveProperty('apiKey')
  })

  it('persists enabled model selections across repository reloads', async () => {
    await aiProviderSettingsRepository.replaceProviderModels('openrouter', models, fetchedAt)
    await aiProviderSettingsRepository.setEnabledModels('openrouter', [models[0].id, models[1].id])
    resetDb()

    const enabled = await aiProviderSettingsRepository.getEnabledModelIds('openrouter')

    expect(enabled.has(models[0].id)).toBe(true)
    expect(enabled.has(models[1].id)).toBe(true)
  })

  it('saves and reloads prompt input assistant feature settings', async () => {
    await aiProviderSettingsRepository.replaceProviderModels('openrouter', models, fetchedAt)
    await aiProviderSettingsRepository.setEnabledModels('openrouter', [models[0].id])
    await aiProviderSettingsRepository.saveFeatureSettings('prompt-input-assistant', { providerId: 'openrouter', modelId: models[0].id })

    const saved = await aiProviderSettingsRepository.saveFeatureSettings('prompt-input-assistant', {
      providerId: 'openrouter',
      modelId: models[0].id,
    })
    resetDb()

    const reloaded = await aiProviderSettingsRepository.getFeatureSettings('prompt-input-assistant')
    expect(reloaded).toEqual(saved)
    expect(reloaded?.providerId).toBe('openrouter')
    expect(reloaded?.modelId).toBe(models[0].id)
  })

  it('lists only enabled provider models for feature selectors', async () => {
    await aiProviderSettingsRepository.replaceProviderModels('openrouter', models, fetchedAt)
    await aiProviderSettingsRepository.setEnabledModels('openrouter', [models[0].id, models[2].id])

    const enabled = await aiProviderSettingsRepository.listEnabledProviderModels('openrouter')

    expect(enabled.map((model) => model.id)).toEqual([models[0].id, models[2].id])
  })

  it('does not store API keys in provider settings stores', async () => {
    const secret = 'sk-or-secret-value'
    await aiProviderSettingsRepository.saveConnection('openrouter', { status: 'configured' })
    await aiProviderSettingsRepository.replaceProviderModels('openrouter', models, fetchedAt)
    await aiProviderSettingsRepository.setEnabledModels('openrouter', [models[0].id])
    await aiProviderSettingsRepository.saveFeatureSettings('prompt-input-assistant', { providerId: 'openrouter', modelId: models[0].id })

    const db = await initDb()
    const records = [
      await db.get('aiProviderConnections', 'openrouter'),
      ...(await db.getAll('aiProviderModels')),
      ...(await db.getAll('enabledAiModels')),
      ...(await db.getAll('aiFeatureSettings')),
    ]

    expect(JSON.stringify(records)).not.toContain(secret)
    expect(JSON.stringify(records)).not.toContain('apiKey')
  })
})
