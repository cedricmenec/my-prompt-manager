/**
 * App adapter for the encrypted vault SDK.
 *
 * Creates a preconfigured `Vault<VaultPayload>` instance for the prompt manager
 * app and re-exports SDK symbols with backward-compatible names.
 *
 * The vault uses an IndexedDB storage plugin with database `byo-prompt-manager`
 * and store `encryptedVault` (separate from the app's main database).
 */

import { createVault as createSdkVault } from '@byo-prompt/encrypted-vault/core'
import { createIndexedDbStorage } from '@byo-prompt/encrypted-vault/storage/indexeddb'
import type { VaultPayload } from './payload'

export type { VaultPayload } from './payload'

// ---------------------------------------------------------------------------
// Singleton vault instance
// ---------------------------------------------------------------------------

const storage = createIndexedDbStorage({
  dbName: 'byo-prompt-manager-vault',
  storeName: 'encryptedVault',
})

const initialPayload: VaultPayload = { version: 1, apiKeys: {} }

export const vault = createSdkVault({ storage, initialPayload })

// ---------------------------------------------------------------------------
// Backward-compatible function exports
//
// These wrap the vault instance methods so existing code that imports bare
// functions continues to work without changes.
// ---------------------------------------------------------------------------

export function isVaultAvailable(): Promise<boolean> {
  return vault.isAvailable()
}

export function isUnlocked(): boolean {
  return vault.isUnlocked()
}

export function getDecryptedPayload(): VaultPayload | null {
  return vault.getPayload()
}

export function createVault(passphrase: string): Promise<void> {
  return vault.create(passphrase)
}

export function unlockVault(passphrase: string): Promise<void> {
  return vault.unlock(passphrase)
}

export function lockVault(): void {
  vault.lock()
}

export function persistPayload(): Promise<void> {
  return vault.persistPayload()
}

export function exportVault(): Promise<Record<string, unknown> | null> {
  return vault.export()
}

export function importVault(
  jsonData: Record<string, unknown>,
  passphrase: string,
): Promise<void> {
  return vault.import(jsonData as any, passphrase)
}

export function changePassphrase(
  currentPassphrase: string,
  newPassphrase: string,
): Promise<void> {
  return vault.changePassphrase(currentPassphrase, newPassphrase)
}

export function deleteVault(): Promise<void> {
  return vault.delete()
}

export function tryAutoUnlock(): Promise<boolean> {
  return vault.tryAutoUnlock()
}

// ---------------------------------------------------------------------------
// SDK re-exports for consumers that use SDK modules directly
// ---------------------------------------------------------------------------

export { isWebCryptoAvailable } from '@byo-prompt/encrypted-vault/core'
export { getTTLConfig, setTTLConfig } from '@byo-prompt/encrypted-vault/core'
export type { TTLMinutes } from '@byo-prompt/encrypted-vault/core'
