/**
 * Encrypted vault façade — single entry-point for the vault lifecycle.
 *
 * Architecture:
 *   vaultCrypto     → pure crypto primitives (no IDB)
 *   vaultRepository → IDB persistence layer
 *   vault (here)    → orchestrates create / unlock / lock / export / import
 *
 * The derived CryptoKey and decrypted VaultPayload are held **in memory only**
 * and cleared on `lockVault()` (which happens implicitly on page reload).
 */

import {
  generateSalt,
  generateIv,
  deriveKey,
  deriveVerifyHash,
  encrypt,
  decrypt,
} from './vaultCrypto'
import * as repo from './vaultRepository'
import {
  storeSessionPassphrase,
  tryGetSessionPassphrase,
  clearSessionCache,
} from './vaultSession'
import type { EncryptedVaultRecord } from '../db'

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface VaultPayload {
  version: 1
  apiKeys: Record<string, string>
}

// ---------------------------------------------------------------------------
// Internal state (module-level singleton)
// ---------------------------------------------------------------------------

let cryptoKey: CryptoKey | null = null
let payload: VaultPayload | null = null
let vaultExistsInDb = false

// ---------------------------------------------------------------------------
// Promise-based mutex — serialises async vault operations
// ---------------------------------------------------------------------------

let mutexChain: Promise<unknown> = Promise.resolve()

function withMutex<T>(fn: () => Promise<T>): Promise<T> {
  const run = mutexChain.then(fn, fn) // run even if previous rejected
  mutexChain = run.then(
    () => {},
    () => {},
  )
  return run
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Check whether an encrypted vault record exists in IndexedDB.
 * Does NOT check unlock state — call `isUnlocked()` for that.
 */
export async function isVaultAvailable(): Promise<boolean> {
  if (!vaultExistsInDb) {
    vaultExistsInDb = await repo.exists()
  }
  return vaultExistsInDb
}

export function isUnlocked(): boolean {
  return cryptoKey !== null && payload !== null
}

/** Returns the in-memory decrypted payload (or `null` if locked). */
export function getDecryptedPayload(): VaultPayload | null {
  return payload
}

// ---------------------------------------------------------------------------

/**
 * Create a brand-new vault with the given passphrase.
 *
 * Generates salt + IV, derives the AES key and verify hash, encrypts an empty
 * payload `{ version: 1, apiKeys: {} }`, and persists the record to IDB.
 */
export async function createVault(passphrase: string): Promise<void> {
  return withMutex(async () => {
    const salt = generateSalt()
    const iv = generateIv()

    const [key, verifyHash] = await Promise.all([
      deriveKey(passphrase, salt),
      deriveVerifyHash(passphrase, salt),
    ])

    const emptyPayload: VaultPayload = { version: 1, apiKeys: {} }
    const plaintext = JSON.stringify(emptyPayload)
    const encryptedData = await encrypt(key, iv, plaintext)

    const now = new Date().toISOString()
    const record: EncryptedVaultRecord = {
      key: 'vault',
      version: 1,
      salt,
      iv,
      verifyHash,
      data: encryptedData,
      createdAt: now,
      updatedAt: now,
    }

    await repo.save(record)

    cryptoKey = key
    payload = emptyPayload
    vaultExistsInDb = true

    storeSessionPassphrase(passphrase)
  })
}

/**
 * Unlock an existing vault by verifying the passphrase.
 *
 * Uses the lightweight verify hash (1 000 iterations) for fast feedback,
 * then derives the full AES key (600k iterations) on success.
 *
 * @throws {Error} "Wrong password" when verification fails.
 */
export async function unlockVault(passphrase: string): Promise<void> {
  return withMutex(async () => {
    const record = await repo.load()
    if (!record) {
      throw new Error('No vault found')
    }

    // Fast verify
    const verifyHash = await deriveVerifyHash(passphrase, record.salt)
    const matches = arraysEqual(verifyHash, record.verifyHash)
    if (!matches) {
      throw new Error('Wrong password')
    }

    // Full key derivation
    const key = await deriveKey(passphrase, record.salt)

    // Decrypt
    const plaintext = await decrypt(key, record.iv, record.data)
    const decryptedPayload: VaultPayload = JSON.parse(plaintext)

    cryptoKey = key
    payload = decryptedPayload
    vaultExistsInDb = true

    storeSessionPassphrase(passphrase)
  })
}

/**
 * Lock the vault — clears the derived key and decrypted payload from memory.
 * The encrypted record remains in IndexedDB.
 */
export function lockVault(): void {
  clearSessionCache()
  cryptoKey = null
  payload = null
}

// ---------------------------------------------------------------------------
// Persist current payload (used by sessionCredentials integration)
// ---------------------------------------------------------------------------

/**
 * Re-encrypt the current in-memory payload and persist to IDB.
 * Must be called after mutating `getDecryptedPayload()` to persist changes.
 * Only works when the vault is unlocked.
 */
export async function persistPayload(): Promise<void> {
  return withMutex(async () => {
    if (!cryptoKey || !payload) {
      throw new Error('Vault is not unlocked')
    }

    const record = await repo.load()
    if (!record) {
      throw new Error('No vault found')
    }

    const plaintext = JSON.stringify(payload)
    const newIv = generateIv()
    const encryptedData = await encrypt(cryptoKey, newIv, plaintext)

    const updatedRecord: EncryptedVaultRecord = {
      ...record,
      iv: newIv,
      data: encryptedData,
      updatedAt: new Date().toISOString(),
    }
    await repo.save(updatedRecord)

    // Update IV in local state
    record.iv = newIv
    record.data = encryptedData
  })
}

// ---------------------------------------------------------------------------
// Export / Import
// ---------------------------------------------------------------------------

/**
 * Export the raw `EncryptedVaultRecord` as a plain JSON-serialisable object.
 * The caller is responsible for triggering a file download.
 */
export async function exportVault(): Promise<Record<string, unknown> | null> {
  const record = await repo.load()
  if (!record) return null

  // Convert typed arrays to plain arrays for JSON serialisation
  return {
    key: record.key,
    version: record.version,
    salt: Array.from(record.salt),
    iv: Array.from(record.iv),
    verifyHash: Array.from(record.verifyHash),
    data: Array.from(record.data),
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  }
}

/**
 * Import a vault from a JSON-serialisable object (e.g. parsed file).
 * Verifies the passphrase against the imported record, replaces any existing
 * vault, and auto-unlocks on success.
 *
 * @throws {Error} "Wrong password" when passphrase verification fails.
 */
export async function importVault(
  jsonData: Record<string, unknown>,
  passphrase: string,
): Promise<void> {
  return withMutex(async () => {
    // Validate and reconstruct the record
    const record: EncryptedVaultRecord = {
      key: 'vault',
      version: jsonData.version as 1,
      salt: new Uint8Array(jsonData.salt as number[]),
      iv: new Uint8Array(jsonData.iv as number[]),
      verifyHash: new Uint8Array(jsonData.verifyHash as number[]),
      data: new Uint8Array(jsonData.data as number[]),
      createdAt: jsonData.createdAt as string,
      updatedAt: jsonData.updatedAt as string,
    }

    // Verify passphrase
    const verifyHash = await deriveVerifyHash(passphrase, record.salt)
    if (!arraysEqual(verifyHash, record.verifyHash)) {
      throw new Error('Wrong password')
    }

    // Derive key & decrypt
    const key = await deriveKey(passphrase, record.salt)
    const plaintext = await decrypt(key, record.iv, record.data)
    const decryptedPayload: VaultPayload = JSON.parse(plaintext)

    // Persist and unlock
    await repo.save(record)
    cryptoKey = key
    payload = decryptedPayload
    vaultExistsInDb = true

    storeSessionPassphrase(passphrase)
  })
}

// ---------------------------------------------------------------------------
// Change passphrase
// ---------------------------------------------------------------------------

/**
 * Change the vault passphrase. Verifies the current passphrase, re-derives
 * the key with a new salt, re-encrypts, and persists.
 *
 * @throws {Error} "Wrong password" when current passphrase is incorrect.
 */
export async function changePassphrase(
  currentPassphrase: string,
  newPassphrase: string,
): Promise<void> {
  return withMutex(async () => {
    const record = await repo.load()
    if (!record) {
      throw new Error('No vault found')
    }

    // Verify current passphrase
    const currentVerifyHash = await deriveVerifyHash(currentPassphrase, record.salt)
    if (!arraysEqual(currentVerifyHash, record.verifyHash)) {
      throw new Error('Wrong password')
    }

    // Derive current key and decrypt
    const currentKey = await deriveKey(currentPassphrase, record.salt)
    const plaintext = await decrypt(currentKey, record.iv, record.data)

    // Re-derive with new passphrase + new salt
    const newSalt = generateSalt()
    const newIv = generateIv()
    const [newKey, newVerifyHash] = await Promise.all([
      deriveKey(newPassphrase, newSalt),
      deriveVerifyHash(newPassphrase, newSalt),
    ])

    // Re-encrypt
    const encryptedData = await encrypt(newKey, newIv, plaintext)

    // Persist
    const updatedRecord: EncryptedVaultRecord = {
      ...record,
      salt: newSalt,
      iv: newIv,
      verifyHash: newVerifyHash,
      data: encryptedData,
      updatedAt: new Date().toISOString(),
    }
    await repo.save(updatedRecord)

    // Update in-memory state
    cryptoKey = newKey
    payload = JSON.parse(plaintext)
  })
}

// ---------------------------------------------------------------------------
// Delete
// ---------------------------------------------------------------------------

/**
 * Delete the vault entirely — removes the IDB record and clears memory.
 * The app reverts to session-only mode after this call.
 */
export async function deleteVault(): Promise<void> {
  return withMutex(async () => {
    await repo.remove()
    cryptoKey = null
    payload = null
    vaultExistsInDb = false
    clearSessionCache()
  })
}

// ---------------------------------------------------------------------------
// Auto-unlock (session cache)
// ---------------------------------------------------------------------------

/**
 * Attempt to auto-unlock the vault using the cached passphrase in
 * `sessionStorage`. Returns `true` on success, `false` on failure.
 * On failure, clears the cache silently — the caller should show the
 * unlock modal as a fallback.
 *
 * This is used by `VaultGate` at page load to avoid showing the unlock
 * prompt when the vault can be unlocked silently.
 */
export async function tryAutoUnlock(): Promise<boolean> {
  const cachedPassphrase = tryGetSessionPassphrase()
  if (!cachedPassphrase) return false

  try {
    await unlockVault(cachedPassphrase)
    return true
  } catch {
    clearSessionCache()
    return false
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Constant-time-ish comparison of two Uint8Arrays. */
function arraysEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) {
    diff |= a[i]! ^ b[i]!
  }
  return diff === 0
}
