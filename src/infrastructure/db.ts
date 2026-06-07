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
export const DB_VERSION = 8

let dbPromise: Promise<IDBPDatabase<PromptDB>> | null = null

export function initDb(): Promise<IDBPDatabase<PromptDB>> {
  if (!dbPromise) {
    dbPromise = openDB<PromptDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, newVersion, transaction) {
        console.log(`[DB] Upgrade: v${oldVersion} → v${newVersion}`)

        if (oldVersion < 1) {
          console.log('[DB] v1: Creating "prompts" store')
          const store = db.createObjectStore('prompts', { keyPath: 'id' })
          store.createIndex('by-updatedAt', 'updatedAt')
          store.createIndex('by-tags', 'tags', { multiEntry: true })
          store.createIndex('by-favorite', 'isFavorite')
        } else if (oldVersion === 1) {
          console.log('[DB] v1→v2: Adding "by-favorite" index on prompts')
          const store = transaction.objectStore('prompts')
          store.createIndex('by-favorite', 'isFavorite')
        }
        if (oldVersion < 3) {
          console.log('[DB] v3: Creating "_meta" store')
          db.createObjectStore('_meta', { keyPath: 'key' })
        }
        if (oldVersion < 4) {
          console.log('[DB] v4: Creating "promptImageAssets" store')
          const assetStore = db.createObjectStore('promptImageAssets', { keyPath: 'id' })
          assetStore.createIndex('by-promptId', 'promptId')
        }
        if (oldVersion < 5) {
          console.log('[DB] v5: Creating AI provider & model stores')
          db.createObjectStore('aiProviderConnections', { keyPath: 'providerId' })
          const modelStore = db.createObjectStore('aiProviderModels', { keyPath: 'id' })
          modelStore.createIndex('by-providerId', 'providerId')
          modelStore.createIndex('by-fetchedAt', 'fetchedAt')
          const enabledStore = db.createObjectStore('enabledAiModels', { keyPath: 'id' })
          enabledStore.createIndex('by-providerId', 'providerId')
          enabledStore.createIndex('by-modelId', 'modelId')
        }
        if (oldVersion < 6) {
          console.log('[DB] v6: Creating "aiFeatureSettings" store')
          const featureStore = db.createObjectStore('aiFeatureSettings', { keyPath: 'featureId' })
          featureStore.createIndex('by-providerId', 'providerId')
          featureStore.createIndex('by-modelId', 'modelId')
        }
        // v7→v8: Safety-net — create aiFeatureSettings if missing. This handles
        // databases that reached version 7 without the store being created.
        if (oldVersion >= 6 && !db.objectStoreNames.contains('aiFeatureSettings')) {
          console.log(`[DB] v${oldVersion}→${newVersion}: Creating missing "aiFeatureSettings" store`)
          const featureStore = db.createObjectStore('aiFeatureSettings', { keyPath: 'featureId' })
          featureStore.createIndex('by-providerId', 'providerId')
          featureStore.createIndex('by-modelId', 'modelId')
        } else {
          console.log(`[DB] v${oldVersion}→${newVersion}: "aiFeatureSettings" already present, skipping`)
        }

        console.log('[DB] Stores after upgrade:', [...db.objectStoreNames])
      },
    }).then(async (db) => {
      console.log(`[DB] Opened "${DB_NAME}" at version ${db.version}`)
      console.log('[DB] Stores:', [...db.objectStoreNames])

      try {
        await runDataMigrations(db)
        await db.put('_meta', { key: 'appVersion', value: import.meta.env.VITE_APP_VERSION })
        await db.put('_meta', { key: 'idbVersion', value: db.version })
        console.log(`[DB] _meta updated (appVersion=${import.meta.env.VITE_APP_VERSION}, idbVersion=${db.version})`)
      } catch (err) {
        console.error('[DB] Error during post-open setup:', err)
      }

      return db
    }).catch((err) => {
      console.error(`[DB] Failed to open "${DB_NAME}":`, err)
      dbPromise = null // allow retry on next call
      throw err
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


