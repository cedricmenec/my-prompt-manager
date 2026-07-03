/**
 * Vault orchestration class — single entry-point for the vault lifecycle.
 *
 * Architecture:
 *   crypto.ts     → pure crypto primitives (no I/O)
 *   session.ts    → session cache + TTL
 *   storage.ts    → abstract persistence backend
 *   vault (here)  → orchestrates create / unlock / lock / export / import
 *
 * The derived CryptoKey and decrypted payload are held **in memory only**
 * and cleared on `lock()` (which happens implicitly on page reload).
 */

import {
  generateSalt,
  generateIv,
  deriveKey,
  deriveVerifyHash,
  encrypt,
  decrypt,
  arraysEqual,
  isWebCryptoAvailable,
} from './crypto'
import {
  storeSessionPassphrase,
  tryGetSessionPassphrase,
  clearSessionCache,
} from './session'
import type { VaultPayloadBase, VaultStorage, EncryptedRecord, ExportableVault, TTLMinutes } from './types'
import {
  VaultError,
  WrongPassphraseError,
  VaultNotFoundError,
  VaultLockedError,
  CryptoUnavailableError,
} from './errors'
import { getTTLConfig, setTTLConfig } from './session'

// Re-export session TTL helpers so consumers can use them via the vault
export { getTTLConfig, setTTLConfig, type TTLMinutes }

// ---------------------------------------------------------------------------
// Vault class
// ---------------------------------------------------------------------------

export class Vault<TPayload extends VaultPayloadBase> {
  private _cryptoKey: CryptoKey | null = null
  private _payload: TPayload | null = null
  private _vaultExistsInDb = false

  private readonly _storage: VaultStorage
  private readonly _initialPayload: TPayload

  /** Promise-based mutex — serialises async vault operations. */
  private _mutexChain: Promise<unknown> = Promise.resolve()

  constructor(storage: VaultStorage, initialPayload: TPayload) {
    this._storage = storage
    this._initialPayload = initialPayload
  }

  // -------------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------------

  private withMutex<T>(fn: () => Promise<T>): Promise<T> {
    const run = this._mutexChain.then(fn, fn)
    this._mutexChain = run.then(
      () => {},
      () => {},
    )
    return run
  }

  private requireUnlocked(): { key: CryptoKey; payload: TPayload } {
    if (!this._cryptoKey || !this._payload) {
      throw new VaultLockedError()
    }
    return { key: this._cryptoKey, payload: this._payload }
  }

  // -------------------------------------------------------------------------
  // Status checks
  // -------------------------------------------------------------------------

  /**
   * Check whether an encrypted vault record exists in storage.
   * Does NOT check unlock state — call `isUnlocked()` for that.
   */
  async isAvailable(): Promise<boolean> {
    if (!this._vaultExistsInDb) {
      this._vaultExistsInDb = await this._storage.exists()
    }
    return this._vaultExistsInDb
  }

  /** Returns true when the vault is unlocked (key + payload in memory). */
  isUnlocked(): boolean {
    return this._cryptoKey !== null && this._payload !== null
  }

  /** Returns the in-memory decrypted payload (or `null` if locked). */
  getPayload(): TPayload | null {
    return this._payload
  }

  // -------------------------------------------------------------------------
  // Lifecycle: create
  // -------------------------------------------------------------------------

  /**
   * Create a brand-new vault with the given passphrase.
   *
   * Generates salt + IV, derives the AES key and verify hash, encrypts the
   * initial payload, and persists the record to storage.
   *
   * @throws {VaultError} If passphrase is shorter than 8 characters.
   */
  async create(passphrase: string): Promise<void> {
    return this.withMutex(async () => {
      if (passphrase.length < 8) {
        throw new VaultError('Passphrase must be at least 8 characters')
      }

      if (!isWebCryptoAvailable()) {
        throw new CryptoUnavailableError()
      }

      const salt = generateSalt()
      const iv = generateIv()

      const [key, verifyHash] = await Promise.all([
        deriveKey(passphrase, salt),
        deriveVerifyHash(passphrase, salt),
      ])

      const plaintext = JSON.stringify(this._initialPayload)
      const encryptedData = await encrypt(key, iv, plaintext)

      const now = new Date().toISOString()
      const record: EncryptedRecord = {
        key: 'vault',
        version: 1,
        salt,
        iv,
        verifyHash,
        data: encryptedData,
        createdAt: now,
        updatedAt: now,
      }

      await this._storage.save(record)

      this._cryptoKey = key
      this._payload = { ...this._initialPayload }
      this._vaultExistsInDb = true

      storeSessionPassphrase(passphrase)
    })
  }

  // -------------------------------------------------------------------------
  // Lifecycle: unlock
  // -------------------------------------------------------------------------

  /**
   * Unlock an existing vault by verifying the passphrase.
   *
   * Uses the lightweight verify hash (1 000 iterations) for fast feedback,
   * then derives the full AES key (600k iterations) on success.
   *
   * @throws {WrongPassphraseError} When the passphrase is incorrect.
   * @throws {VaultNotFoundError} When no vault exists in storage.
   */
  async unlock(passphrase: string): Promise<void> {
    return this.withMutex(async () => {
      const record = await this._storage.load()
      if (!record) {
        throw new VaultNotFoundError()
      }

      // Fast verify
      const verifyHash = await deriveVerifyHash(passphrase, record.salt)
      const matches = arraysEqual(verifyHash, record.verifyHash)
      if (!matches) {
        throw new WrongPassphraseError()
      }

      // Full key derivation
      const key = await deriveKey(passphrase, record.salt)

      // Decrypt
      const plaintext = await decrypt(key, record.iv, record.data)
      const decryptedPayload: TPayload = JSON.parse(plaintext)

      this._cryptoKey = key
      this._payload = decryptedPayload
      this._vaultExistsInDb = true

      storeSessionPassphrase(passphrase)
    })
  }

  // -------------------------------------------------------------------------
  // Lifecycle: lock
  // -------------------------------------------------------------------------

  /**
   * Lock the vault — clears the derived key and decrypted payload from memory.
   * The encrypted record remains in storage unchanged.
   */
  lock(): void {
    clearSessionCache()
    this._cryptoKey = null
    this._payload = null
  }

  // -------------------------------------------------------------------------
  // Lifecycle: delete
  // -------------------------------------------------------------------------

  /**
   * Delete the vault entirely — removes the storage record and clears memory.
   * After this call the vault must be re-created to be used again.
   */
  async delete(): Promise<void> {
    return this.withMutex(async () => {
      await this._storage.remove()
      this._cryptoKey = null
      this._payload = null
      this._vaultExistsInDb = false
      clearSessionCache()
    })
  }

  // -------------------------------------------------------------------------
  // Payload persistence
  // -------------------------------------------------------------------------

  /**
   * Re-encrypt the current in-memory payload and persist to storage.
   * Must be called after mutating `getPayload()` to persist changes.
   *
   * @throws {VaultLockedError} When the vault is not unlocked.
   */
  async persistPayload(): Promise<void> {
    return this.withMutex(async () => {
      const { key, payload } = this.requireUnlocked()

      const record = await this._storage.load()
      if (!record) {
        throw new VaultNotFoundError()
      }

      const plaintext = JSON.stringify(payload)
      const newIv = generateIv()
      const encryptedData = await encrypt(key, newIv, plaintext)

      const updatedRecord: EncryptedRecord = {
        ...record,
        iv: newIv,
        data: encryptedData,
        updatedAt: new Date().toISOString(),
      }
      await this._storage.save(updatedRecord)
    })
  }

  // -------------------------------------------------------------------------
  // Export / Import
  // -------------------------------------------------------------------------

  /**
   * Export the encrypted vault record as a plain JSON-serialisable object.
   * The caller is responsible for triggering a file download.
   *
   * Returns `null` when no vault exists in storage.
   */
  async export(): Promise<ExportableVault | null> {
    const record = await this._storage.load()
    if (!record) return null

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
   * @throws {WrongPassphraseError} When passphrase verification fails.
   */
  async import(jsonData: ExportableVault, passphrase: string): Promise<void> {
    return this.withMutex(async () => {
      // Reconstruct the record from plain arrays
      const record: EncryptedRecord = {
        key: jsonData.key ?? 'vault',
        version: jsonData.version,
        salt: new Uint8Array(jsonData.salt),
        iv: new Uint8Array(jsonData.iv),
        verifyHash: new Uint8Array(jsonData.verifyHash),
        data: new Uint8Array(jsonData.data),
        createdAt: jsonData.createdAt,
        updatedAt: jsonData.updatedAt,
      }

      // Verify passphrase
      const verifyHash = await deriveVerifyHash(passphrase, record.salt)
      if (!arraysEqual(verifyHash, record.verifyHash)) {
        throw new WrongPassphraseError()
      }

      // Derive key & decrypt
      const key = await deriveKey(passphrase, record.salt)
      const plaintext = await decrypt(key, record.iv, record.data)
      const decryptedPayload: TPayload = JSON.parse(plaintext)

      // Persist and unlock
      await this._storage.save(record)
      this._cryptoKey = key
      this._payload = decryptedPayload
      this._vaultExistsInDb = true

      storeSessionPassphrase(passphrase)
    })
  }

  // -------------------------------------------------------------------------
  // Change passphrase
  // -------------------------------------------------------------------------

  /**
   * Change the vault passphrase. Verifies the current passphrase, re-derives
   * the key with a new salt, re-encrypts, and persists.
   *
   * @throws {WrongPassphraseError} When current passphrase is incorrect.
   * @throws {VaultNotFoundError} When no vault exists.
   */
  async changePassphrase(
    currentPassphrase: string,
    newPassphrase: string,
  ): Promise<void> {
    return this.withMutex(async () => {
      const record = await this._storage.load()
      if (!record) {
        throw new VaultNotFoundError()
      }

      // Verify current passphrase
      const currentVerifyHash = await deriveVerifyHash(currentPassphrase, record.salt)
      if (!arraysEqual(currentVerifyHash, record.verifyHash)) {
        throw new WrongPassphraseError()
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
      const updatedRecord: EncryptedRecord = {
        ...record,
        salt: newSalt,
        iv: newIv,
        verifyHash: newVerifyHash,
        data: encryptedData,
        updatedAt: new Date().toISOString(),
      }
      await this._storage.save(updatedRecord)

      // Update in-memory state
      this._cryptoKey = newKey
      this._payload = JSON.parse(plaintext) as TPayload
    })
  }

  // -------------------------------------------------------------------------
  // Auto-unlock
  // -------------------------------------------------------------------------

  /**
   * Attempt to auto-unlock using a cached passphrase from the session cache.
   * Returns `true` on success, `false` on failure (clears stale cache on failure).
   */
  async tryAutoUnlock(): Promise<boolean> {
    const cachedPassphrase = tryGetSessionPassphrase()
    if (!cachedPassphrase) return false

    try {
      await this.unlock(cachedPassphrase)
      return true
    } catch {
      clearSessionCache()
      return false
    }
  }

  // -------------------------------------------------------------------------
  // Session TTL convenience
  // -------------------------------------------------------------------------

  /** Get the current session TTL configuration. */
  getSessionTTL(): TTLMinutes {
    return getTTLConfig()
  }

  /** Set the session TTL configuration. */
  setSessionTTL(ttl: TTLMinutes): void {
    setTTLConfig(ttl)
  }
}

// ---------------------------------------------------------------------------
// Factory function
// ---------------------------------------------------------------------------

/**
 * Create a new `Vault<TPayload>` instance.
 *
 * @example
 * ```ts
 * const vault = createVault({
 *   storage: createIndexedDbStorage({ dbName: 'my-app', storeName: 'vault' }),
 *   initialPayload: { version: 1, apiKeys: {} },
 * })
 * ```
 */
export function createVault<TPayload extends VaultPayloadBase>(
  options: { storage: VaultStorage; initialPayload: TPayload },
): Vault<TPayload> {
  return new Vault(options.storage, options.initialPayload)
}