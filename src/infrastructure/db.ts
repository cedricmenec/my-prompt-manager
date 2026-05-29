import { openDB, type IDBPDatabase } from 'idb'
import type { Prompt } from '@/domain/promptSchema'

interface PromptDB {
  prompts: {
    key: string
    value: Prompt
    indexes: {
      'by-updatedAt': string
      'by-tags': string
      'by-favorite': boolean
    }
  }
}

const DB_NAME = 'byo-prompt-manager'
const DB_VERSION = 2

let dbPromise: Promise<IDBPDatabase<PromptDB>> | null = null

export function getDb(): Promise<IDBPDatabase<PromptDB>> {
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
      },
    })
  }
  return dbPromise
}

/** Reset the singleton (used in tests). */
export function resetDb(): void {
  dbPromise = null
}
