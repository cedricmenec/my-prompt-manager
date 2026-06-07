## 1. Core Crypto Layer

- [x] 1.1 Create `src/infrastructure/vault/vaultCrypto.ts` with `generateSalt()`, `generateIv()`, `deriveKey(passphrase, salt)`, `deriveVerifyHash(passphrase, salt)`, `encrypt(key, iv, plaintext)`, and `decrypt(key, iv, ciphertext)` functions using Web Crypto API (PBKDF2-SHA256 600k iterations, AES-256-GCM)
- [x] 1.2 Add `isWebCryptoAvailable()` utility that checks `window.crypto?.subtle` availability
- [x] 1.3 Create unit tests for `vaultCrypto.ts` covering: key derivation, encrypt/decrypt round-trip, verify hash match/mismatch, and Web Crypto availability check

## 2. Vault Repository

- [x] 2.1 Add `encryptedVault` store to the `PromptDB` interface and bump `DB_VERSION` from 8 to 9 in `src/infrastructure/db.ts`, with migration logic to create the store on upgrade
- [x] 2.2 Create `src/infrastructure/vault/vaultRepository.ts` with `load()`, `save(record)`, `remove()`, and `exists()` functions operating on the `encryptedVault` IDB store
- [x] 2.3 Create unit tests for `vaultRepository.ts` covering: save/load round-trip, remove, exists, and handling of missing store

## 3. Vault Façade

- [x] 3.1 Create `src/infrastructure/vault/vault.ts` façade with `createVault(passphrase)`, `unlockVault(passphrase)`, `lockVault()`, `isUnlocked()`, `isVaultAvailable()`, `getDecryptedPayload()`, and a promise-based mutex for serialized access
- [x] 3.2 Implement vault lifecycle in façade: create generates salt/IV, derives key + verify hash, encrypts empty payload `{ version: 1, apiKeys: {} }`, persists via repository; unlock verifies passphrase, derives full key, decrypts payload; lock clears key and payload from memory
- [x] 3.3 Implement `exportVault()` returning the raw `EncryptedVaultRecord` as a JSON-serializable object, and `importVault(jsonData, passphrase)` that verifies passphrase, replaces current vault, and auto-unlocks
- [x] 3.4 Implement `changePassphrase(currentPassphrase, newPassphrase)` that verifies current, re-derives with new salt, re-encrypts, and persists
- [x] 3.5 Implement `deleteVault()` that removes the IDB record and clears memory
- [x] 3.6 Export `vault` singleton from `src/infrastructure/vault/index.ts`
- [x] 3.7 Create unit tests for `vault.ts` covering: create, unlock, lock, wrong passphrase, export/import round-trip, change passphrase, delete vault, and mutex serialization

## 4. Session Credentials Integration

- [x] 4.1 Modify `src/infrastructure/sessionCredentials.ts` to import `vault` façade and update `setApiKey()` to persist into the vault (re-encrypt + save) when vault is unlocked, in addition to updating the in-memory Map
- [x] 4.2 Update `getApiKey()` in `sessionCredentials.ts` to fall back to reading from the decrypted vault payload (and caching in Map) when the Map doesn't have the key but the vault is unlocked
- [x] 4.3 Update `clearAll()` in `sessionCredentials.ts` to also clear the vault payload cache without deleting the vault itself
- [x] 4.4 Update existing `sessionCredentials.test.ts` to cover vault integration: set persists to vault, get restores from vault, clear clears cache but not vault

## 5. Vault UI — Gate Component

- [x] 5.1 Create `src/features/vault/VaultGate.tsx` component that checks vault state on mount: no vault → show create modal, vault exists but locked → show unlock modal, vault unlocked → render children, Web Crypto unavailable → render session-only banner + children
- [x] 5.2 Create `src/features/vault/VaultCreateModal.tsx` with passphrase input, confirmation input, "Create vault" button, validation (min 8 chars, match), and "Skip — session only" option
- [x] 5.3 Create `src/features/vault/VaultUnlockModal.tsx` with passphrase input, "Unlock" button, "Wrong password, try again" error message display
- [x] 5.4 Create unit tests for VaultGate, VaultCreateModal, and VaultUnlockModal covering: creation flow, skip flow, unlock success, wrong passphrase error, and Web Crypto unavailable state

## 6. Settings Panel — Vault Section

- [x] 6.1 Create `src/features/settings/VaultSettingsSection.tsx` with vault status display (exists/locked/unlocked, created/updated timestamps), export button, import button, change passphrase button, and delete vault button
- [x] 6.2 Add "Vault" category to the Settings panel sidebar navigation alongside Legacy, API & Models, and AI Features
- [x] 6.3 Implement vault export: "Export vault" button triggers download of encrypted vault JSON as `byo-vault-YYYY-MM-DD.json`
- [x] 6.4 Implement vault import: "Import vault" button opens file picker, prompts for passphrase, shows confirmation if vault exists, replaces and auto-unlocks on success
- [x] 6.5 Implement change passphrase flow: prompts for current passphrase + new passphrase with confirmation, re-encrypts on success
- [x] 6.6 Implement delete vault flow: confirmation prompt, removes from IDB, clears memory, reverts to session-only
- [x] 6.7 Add passphrase recovery warning message in vault settings section
- [x] 6.8 Update existing Settings panel tests to cover vault category visibility and navigation

## 7. App Initialization

- [x] 7.1 Wrap the app root in `VaultGate` in `src/app/App.tsx` so that vault resolution (unlock/create/skip) happens before any component renders that may use API keys
- [x] 7.2 Update `deferred-features.md` to remove the "Encrypted Vault persistence" deferred follow-up from the AI provider/model settings section

## 8. Final Validation

- [x] 8.1 Run full test suite (`rtk vitest run`) and verify all new and existing tests pass
- [ ] 8.2 Manual smoke test: create vault → enter API key → reload page → unlock → verify API key is restored → change passphrase → export vault → import vault on fresh browser → delete vault → verify session-only fallback
