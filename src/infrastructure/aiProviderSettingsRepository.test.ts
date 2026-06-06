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

  it('does not store API keys in provider settings stores', async () => {
    const secret = 'sk-or-secret-value'
    await aiProviderSettingsRepository.saveConnection('openrouter', { status: 'configured' })
    await aiProviderSettingsRepository.replaceProviderModels('openrouter', models, fetchedAt)
    await aiProviderSettingsRepository.setEnabledModels('openrouter', [models[0].id])

    const db = await initDb()
    const records = [
      await db.get('aiProviderConnections', 'openrouter'),
      ...(await db.getAll('aiProviderModels')),
      ...(await db.getAll('enabledAiModels')),
    ]

    expect(JSON.stringify(records)).not.toContain(secret)
    expect(JSON.stringify(records)).not.toContain('apiKey')
  })
})
