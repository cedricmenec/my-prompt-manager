import { openDB, type IDBPDatabase } from 'idb'
import type { Prompt, PromptImageAsset } from '@/domain/promptSchema'
import { runDataMigrations } from './dataMigrations'

export interface AiProviderConnection {
  providerId: string
  status: 'configured' | 'not-configured'
  lastCatalogFetchedAt?: string
  createdAt: string
  updatedAt: string
}

export interface AiProviderModel {
  id: string
  providerId: string
  name: string
  originProvider: string
  modality: 'text' | 'image' | 'multimodal' | 'unknown'
  tokenCost: null
  fetchedAt: string
  raw?: unknown
}

export interface EnabledAiModel {
  id: string
  providerId: string
  modelId: string
  enabledAt: string
}

export type AiFeatureId = 'prompt-input-assistant'

export interface AiFeatureSettings {
  featureId: AiFeatureId
  providerId: string
  modelId: string
  createdAt: string
  updatedAt: string
}

export interface PromptDB {
  prompts: {
    key: string
    value: Prompt
    indexes: {
      'by-updatedAt': string
      'by-tags': string
      'by-favorite': boolean
    }
  }
  _meta: {
    key: string
    value: { key: string; value: string | number }
  }
  promptImageAssets: {
    key: string
    value: PromptImageAsset
    indexes: {
      'by-promptId': string
    }
  }
  aiProviderConnections: {
    key: string
    value: AiProviderConnection
  }
  aiProviderModels: {
    key: string
    value: AiProviderModel
    indexes: {
      'by-providerId': string
      'by-fetchedAt': string
    }
  }
  enabledAiModels: {
    key: string
    value: EnabledAiModel
    indexes: {
      'by-providerId': string
      'by-modelId': string
    }
  }
  aiFeatureSettings: {
    key: AiFeatureId
    value: AiFeatureSettings
    indexes: {
      'by-providerId': string
      'by-modelId': string
    }
  }
}

const DB_NAME = 'byo-prompt-manager'
export const DB_VERSION = 6

let dbPromise: Promise<IDBPDatabase<PromptDB>> | null = null

export function initDb(): Promise<IDBPDatabase<PromptDB>> {
  if (!dbPromise) {
    dbPromise = openDB<PromptDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, _newVersion, transaction) {
        if (oldVersion < 1) {
          const store = db.createObjectStore('prompts', { keyPath: 'id' })
          store.createIndex('by-updatedAt', 'updatedAt')
          store.createIndex('by-tags', 'tags', { multiEntry: true })
          store.createIndex('by-favorite', 'isFavorite')
        } else if (oldVersion === 1) {
          const store = transaction.objectStore('prompts')
          store.createIndex('by-favorite', 'isFavorite')
        }
        if (oldVersion < 3) {
          db.createObjectStore('_meta', { keyPath: 'key' })
        }
        if (oldVersion < 4) {
          const assetStore = db.createObjectStore('promptImageAssets', { keyPath: 'id' })
          assetStore.createIndex('by-promptId', 'promptId')
        }
        if (oldVersion < 5) {
          db.createObjectStore('aiProviderConnections', { keyPath: 'providerId' })
          const modelStore = db.createObjectStore('aiProviderModels', { keyPath: 'id' })
          modelStore.createIndex('by-providerId', 'providerId')
          modelStore.createIndex('by-fetchedAt', 'fetchedAt')
          const enabledStore = db.createObjectStore('enabledAiModels', { keyPath: 'id' })
          enabledStore.createIndex('by-providerId', 'providerId')
          enabledStore.createIndex('by-modelId', 'modelId')
        }
        if (oldVersion < 6) {
          const featureStore = db.createObjectStore('aiFeatureSettings', { keyPath: 'featureId' })
          featureStore.createIndex('by-providerId', 'providerId')
          featureStore.createIndex('by-modelId', 'modelId')
        }
      },
    }).then(async (db) => {
      await runDataMigrations(db)
      await db.put('_meta', { key: 'appVersion', value: import.meta.env.VITE_APP_VERSION })
      return db
    })
  }
  return dbPromise
}

export function getDb(): Promise<IDBPDatabase<PromptDB>> {
  return initDb()
}

/** Reset the singleton (used in tests). */
export function resetDb(): void {
  dbPromise = null
}


