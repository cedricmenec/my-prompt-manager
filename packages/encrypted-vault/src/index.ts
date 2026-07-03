/**
 * @byo-prompt/encrypted-vault — core entry point.
 *
 * Re-exports all core functionality: types, errors, crypto, session,
 * storage interface, and the Vault class + factory.
 */

export { Vault, createVault, getTTLConfig, setTTLConfig } from './core/vault'
export type { TTLMinutes } from './core/vault'

export type {
  VaultPayloadBase,
  VaultSDKOptions,
  EncryptedRecord,
  ExportableVault,
  VaultStorage,
} from './core/types'

export {
  VaultError,
  WrongPassphraseError,
  VaultNotFoundError,
  VaultLockedError,
  CryptoUnavailableError,
} from './core/errors'

export {
  isWebCryptoAvailable,
  generateSalt,
  generateIv,
  deriveKey,
  deriveVerifyHash,
  encrypt,
  decrypt,
  arraysEqual,
} from './core/crypto'

export {
  getTTLConfig as getTTLConfigRaw,
  setTTLConfig as setTTLConfigRaw,
  storeSessionPassphrase,
  tryGetSessionPassphrase,
  clearSessionCache,
} from './core/session'

// Storage implementations
export { createIndexedDbStorage } from './storage/indexeddb'
export type { IndexedDbStorageOptions } from './storage/indexeddb'

export { createMemoryStorage } from './storage/memory'