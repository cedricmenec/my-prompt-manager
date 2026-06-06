import { getDb, type AiProviderConnection, type AiProviderModel, type EnabledAiModel } from './db'

export type { AiProviderConnection, AiProviderModel, EnabledAiModel } from './db'

function enabledModelKey(providerId: string, modelId: string): string {
  return `${providerId}:${modelId}`
}

export const aiProviderSettingsRepository = {
  async saveConnection(providerId: string, data: Partial<Pick<AiProviderConnection, 'status' | 'lastCatalogFetchedAt'>> = {}): Promise<AiProviderConnection> {
    const db = await getDb()
    const existing = await db.get('aiProviderConnections', providerId)
    const now = new Date().toISOString()
    const connection: AiProviderConnection = {
      providerId,
      status: data.status ?? existing?.status ?? 'configured',
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      ...(data.lastCatalogFetchedAt ?? existing?.lastCatalogFetchedAt
        ? { lastCatalogFetchedAt: data.lastCatalogFetchedAt ?? existing?.lastCatalogFetchedAt }
        : {}),
    }
    await db.put('aiProviderConnections', connection)
    return connection
  },

  async getConnection(providerId: string): Promise<AiProviderConnection | undefined> {
    const db = await getDb()
    return db.get('aiProviderConnections', providerId)
  },

  async replaceProviderModels(providerId: string, models: AiProviderModel[], fetchedAt: string): Promise<void> {
    const db = await getDb()
    const tx = db.transaction(['aiProviderConnections', 'aiProviderModels'], 'readwrite')
    const modelStore = tx.objectStore('aiProviderModels')
    const existingKeys = await modelStore.index('by-providerId').getAllKeys(providerId)
    await Promise.all(existingKeys.map((key) => modelStore.delete(key)))
    await Promise.all(models.map((model) => modelStore.put(model)))

    const existing = await tx.objectStore('aiProviderConnections').get(providerId)
    const now = new Date().toISOString()
    await tx.objectStore('aiProviderConnections').put({
      providerId,
      status: 'configured',
      lastCatalogFetchedAt: fetchedAt,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    })
    await tx.done
  },

  async listProviderModels(providerId: string): Promise<AiProviderModel[]> {
    const db = await getDb()
    const models = await db.getAllFromIndex('aiProviderModels', 'by-providerId', providerId)
    return models.sort((a, b) => a.name.localeCompare(b.name))
  },

  async listEnabledModels(providerId: string): Promise<EnabledAiModel[]> {
    const db = await getDb()
    return db.getAllFromIndex('enabledAiModels', 'by-providerId', providerId)
  },

  async getEnabledModelIds(providerId: string): Promise<Set<string>> {
    const enabled = await this.listEnabledModels(providerId)
    return new Set(enabled.map((model) => model.modelId))
  },

  async setEnabledModels(providerId: string, modelIds: string[]): Promise<void> {
    const db = await getDb()
    const uniqueModelIds = [...new Set(modelIds)]
    const enabledAt = new Date().toISOString()
    const tx = db.transaction('enabledAiModels', 'readwrite')
    const store = tx.objectStore('enabledAiModels')
    const existingKeys = await store.index('by-providerId').getAllKeys(providerId)
    await Promise.all(existingKeys.map((key) => store.delete(key)))
    await Promise.all(
      uniqueModelIds.map((modelId) =>
        store.put({
          id: enabledModelKey(providerId, modelId),
          providerId,
          modelId,
          enabledAt,
        }),
      ),
    )
    await tx.done
  },
}
