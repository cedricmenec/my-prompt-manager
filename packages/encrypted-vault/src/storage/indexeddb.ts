/**
 * IndexedDB storage plugin for the encrypted vault SDK.
 *
 * Manages its own database connection and object store using the `idb` library,
 * independent of the host application's database schema.
 */

import { openDB } from 'idb'
import type { VaultStorage, EncryptedRecord } from '../core/types'

export interface IndexedDbStorageOptions {
  /** IndexedDB database name. */
  dbName: string
  /** Object store name within the database. */
  storeName: string
  /** Record key within the store (default: `'vault'`). */
  storeKey?: string
}

/**
 * Create an IndexedDB-backed `VaultStorage` implementation.
 *
 * The storage plugin creates its own object store on first access if it does
 * not exist. The store uses `keyPath: 'key'` as its primary key.
 *
 * @example
 * ```ts
 * const storage = createIndexedDbStorage({
 *   dbName: 'my-app',
 *   storeName: 'vaultStore',
 * })
 * ```
 */
export function createIndexedDbStorage(options: IndexedDbStorageOptions): VaultStorage {
  const { dbName, storeName } = options
  const storeKey = options.storeKey ?? 'vault'

  async function getDb() {
    return openDB(dbName, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, { keyPath: 'key' })
        }
      },
    })
  }

  return {
    async load(): Promise<EncryptedRecord | null> {
      const db = await getDb()
      const record = await db.get(storeName, storeKey)
      return record ?? null
    },

    async save(record: EncryptedRecord): Promise<void> {
      const db = await getDb()
      await db.put(storeName, record)
    },

    async remove(): Promise<void> {
      const db = await getDb()
      await db.delete(storeName, storeKey)
    },

    async exists(): Promise<boolean> {
      const db = await getDb()
      const record = await db.get(storeName, storeKey)
      return record !== undefined
    },
  }
}