/**
 * In-memory storage plugin for the encrypted vault SDK.
 *
 * Useful for testing and for consumers who want to provide
 * a custom storage backend. Backed by a simple `Map`.
 */

import type { VaultStorage, EncryptedRecord } from '../core/types'

/**
 * Create an in-memory `VaultStorage` implementation.
 *
 * This is primarily useful for testing — it stores records in a `Map`
 * and does not persist across page reloads.
 *
 * @example
 * ```ts
 * const storage = createMemoryStorage()
 * const vault = createVault({ storage, initialPayload: { version: 1 } })
 * ```
 */
export function createMemoryStorage(): VaultStorage {
  const store = new Map<string, EncryptedRecord>()

  return {
    async load(): Promise<EncryptedRecord | null> {
      return store.get('vault') ?? null
    },

    async save(record: EncryptedRecord): Promise<void> {
      store.set('vault', record)
    },

    async remove(): Promise<void> {
      store.delete('vault')
    },

    async exists(): Promise<boolean> {
      return store.has('vault')
    },
  }
}