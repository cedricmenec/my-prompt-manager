/**
 * Persistence layer for the encrypted vault blob in IndexedDB.
 *
 * Stores a single `EncryptedVaultRecord` under the fixed key `"vault"`
 * in the `encryptedVault` object store of the `byo-prompt-manager` database.
 */

import { getDb, type EncryptedVaultRecord } from '../db'

const VAULT_KEY = 'vault' as const

/**
 * Load the encrypted vault record from IndexedDB.
 * Returns `null` when no vault has been created yet.
 */
export async function load(): Promise<EncryptedVaultRecord | null> {
  const db = await getDb()
  const record = await db.get('encryptedVault', VAULT_KEY)
  return record ?? null
}

/**
 * Persist (or overwrite) the encrypted vault record.
 */
export async function save(record: EncryptedVaultRecord): Promise<void> {
  const db = await getDb()
  await db.put('encryptedVault', record)
}

/**
 * Remove the encrypted vault record from IndexedDB.
 * Safe to call even when no vault exists.
 */
export async function remove(): Promise<void> {
  const db = await getDb()
  await db.delete('encryptedVault', VAULT_KEY)
}

/**
 * Returns `true` when an encrypted vault record exists in IndexedDB.
 */
export async function exists(): Promise<boolean> {
  const db = await getDb()
  const record = await db.get('encryptedVault', VAULT_KEY)
  return record !== undefined
}
