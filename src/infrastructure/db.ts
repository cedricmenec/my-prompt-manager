import { openDB, type IDBPDatabase } from 'idb'
import type { Prompt, PromptImageAsset } from '@/domain/promptSchema'
import { runDataMigrations } from './dataMigrations'

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
}

const DB_NAME = 'byo-prompt-manager'
export const DB_VERSION = 4

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

