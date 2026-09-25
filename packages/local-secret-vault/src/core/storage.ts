/**
 * VaultStorage interface — abstract persistence backend for the encrypted vault.
 *
 * Implement this interface to add custom storage backends.
 * Built-in implementations: IndexedDB (storage/indexeddb), In-Memory (storage/memory).
 */

import type { EncryptedRecord } from './types'

export type { EncryptedRecord } from './types'

export interface VaultStorage {
  /** Load the encrypted vault record. Returns `null` when no vault exists. */
  load(): Promise<EncryptedRecord | null>

  /** Persist (or overwrite) the encrypted vault record. */
  save(record: EncryptedRecord): Promise<void>

  /** Remove the encrypted vault record. Safe to call when no record exists. */
  remove(): Promise<void>

  /** Returns `true` when an encrypted vault record exists. */
  exists(): Promise<boolean>
}