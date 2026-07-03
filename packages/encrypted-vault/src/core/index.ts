/**
 * Encrypted vault core — framework-agnostic entry point.
 *
 * Import from `@byo-prompt/encrypted-vault/core` for pure JS/TS usage
 * without React dependencies.
 */

export { Vault, createVault, getTTLConfig, setTTLConfig } from './vault'
export type { TTLMinutes } from './vault'

export type {
  VaultPayloadBase,
  VaultSDKOptions,
  EncryptedRecord,
  ExportableVault,
  VaultStorage,
} from './types'

export {
  VaultError,
  WrongPassphraseError,
  VaultNotFoundError,
  VaultLockedError,
  CryptoUnavailableError,
} from './errors'

export {
  isWebCryptoAvailable,
  generateSalt,
  generateIv,
  deriveKey,
  deriveVerifyHash,
  encrypt,
  decrypt,
  arraysEqual,
} from './crypto'

export {
  storeSessionPassphrase,
  tryGetSessionPassphrase,
  clearSessionCache,
} from './session'