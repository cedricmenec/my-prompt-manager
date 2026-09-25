/**
 * Core type definitions for the encrypted vault SDK.
 */

// ---------------------------------------------------------------------------
// Vault payload
// ---------------------------------------------------------------------------

/** Base interface all vault payloads must extend. Requires a `version` field. */
export interface VaultPayloadBase {
  version: number
}

// ---------------------------------------------------------------------------
// SDK configuration
// ---------------------------------------------------------------------------

export interface VaultSDKOptions<TPayload extends VaultPayloadBase> {
  /** Storage backend (IndexedDB, memory, or custom). */
  storage: VaultStorage
  /** Initial payload used when creating a new vault. */
  initialPayload: TPayload
}

// ---------------------------------------------------------------------------
// Encrypted record persisted by storage backends
// ---------------------------------------------------------------------------

export interface EncryptedRecord {
  key: string
  version: number
  salt: Uint8Array
  iv: Uint8Array
  verifyHash: Uint8Array
  data: Uint8Array
  createdAt: string
  updatedAt: string
}

// ---------------------------------------------------------------------------
// Session TTL
// ---------------------------------------------------------------------------

/** TTL preset values in minutes. `0` = Disabled, `-1` = Session (no expiry). */
export type TTLMinutes = 0 | 15 | 60 | 240 | -1

// ---------------------------------------------------------------------------
// Exportable vault (JSON-serialisable)
// ---------------------------------------------------------------------------

export interface ExportableVault {
  key: string
  version: number
  salt: number[]
  iv: number[]
  verifyHash: number[]
  data: number[]
  createdAt: string
  updatedAt: string
}

// ---------------------------------------------------------------------------
// Storage interface
// ---------------------------------------------------------------------------

export interface VaultStorage {
  load(): Promise<EncryptedRecord | null>
  save(record: EncryptedRecord): Promise<void>
  remove(): Promise<void>
  exists(): Promise<boolean>
}