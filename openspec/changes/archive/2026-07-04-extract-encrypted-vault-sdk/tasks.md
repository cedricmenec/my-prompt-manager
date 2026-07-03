## 1. Project Scaffolding

- [x] 1.1 Create `packages/encrypted-vault/` directory with `package.json`, `tsconfig.json`, and `vite.config.ts` (library mode)
- [x] 1.2 Add `packages/encrypted-vault` to root `pnpm-workspace.yaml`
- [x] 1.3 Add root workspace script `"build:vault": "pnpm --filter @byo-prompt/encrypted-vault build"`
- [x] 1.4 Install `idb` dependency in the vault package
- [x] 1.5 Create test setup file with `fake-indexeddb` global configuration in the vault package
- [x] 1.6 Verify `pnpm install` resolves workspace dependency correctly

## 2. Core: Types and Errors

- [x] 2.1 Create `packages/encrypted-vault/src/core/types.ts` — `VaultPayloadBase`, `VaultSDKOptions<TPayload>`, `EncryptedRecord`, `TTLMinutes`, `ExportableVault`
- [x] 2.2 Create `packages/encrypted-vault/src/core/errors.ts` — `VaultError`, `WrongPassphraseError`, `VaultNotFoundError`, `VaultLockedError`, `CryptoUnavailableError`

## 3. Core: Crypto primitives

- [x] 3.1 Create `packages/encrypted-vault/src/core/crypto.ts` — `isWebCryptoAvailable()`, `generateSalt()`, `generateIv()`, `deriveKey()`, `deriveVerifyHash()`, `encrypt()`, `decrypt()` (ported from current `vaultCrypto.ts`)
- [x] 3.2 Write tests for `crypto.ts` — key derivation, encrypt/decrypt roundtrip, verify hash match/mismatch, Web Crypto availability

## 4. Core: Session cache

- [x] 4.1 Create `packages/encrypted-vault/src/core/session.ts` — `getTTLConfig()`, `setTTLConfig()`, `storeSessionPassphrase()`, `tryGetSessionPassphrase()`, `clearSessionCache()` (ported from current `vaultSession.ts`)
- [x] 4.2 Write tests for `session.ts` — TTL defaults, expiry, session mode, disabled mode, cache clear

## 5. Core: Storage interface

- [x] 5.1 Create `packages/encrypted-vault/src/core/storage.ts` — `VaultStorage` interface with `load()`, `save()`, `remove()`, `exists()`

## 6. Core: Vault orchestrator class

- [x] 6.1 Create `packages/encrypted-vault/src/core/vault.ts` — `Vault<TPayload>` class implementing all lifecycle methods: `create()`, `unlock()`, `lock()`, `delete()`, `isAvailable()`, `isUnlocked()`, `getPayload()`, `persistPayload()`, `export()`, `import()`, `changePassphrase()`, `tryAutoUnlock()`, `getSessionTTL()`, `setSessionTTL()`
- [x] 6.2 Implement with-mutex serialization for async operations (ported from current `vault.ts`)
- [x] 6.3 Implement `createVault<TPayload>(options)` factory function
- [x] 6.4 Write comprehensive tests for `vault.ts` — full lifecycle, error paths, export/import roundtrip, passphrase change, auto-unlock

## 7. Storage: IndexedDB plugin

- [x] 7.1 Create `packages/encrypted-vault/src/storage/indexeddb.ts` — `createIndexedDbStorage(options)` factory returning `VaultStorage` using `idb`
- [x] 7.2 Implement auto-creation of object store on first access
- [x] 7.3 Write tests for `indexeddb-storage` — CRUD operations, binary data preservation, store isolation

## 8. Storage: Memory plugin (for testing)

- [x] 8.1 Create `packages/encrypted-vault/src/storage/memory.ts` — `createMemoryStorage()` returning `VaultStorage` backed by `Map<string, EncryptedRecord>` (for consumers to use in tests)
- [x] 8.2 Write tests for `memory-storage`

## 9. Package entry points

- [x] 9.1 Create `packages/encrypted-vault/src/index.ts` — re-exports core + storage
- [x] 9.2 Configure Vite build for three entry points: `core`, `storage/indexeddb`, `storage/memory`
- [x] 9.3 Verify TypeScript compilation and bundle output

## 10. React bindings

- [x] 10.1 Create `packages/encrypted-vault/src/react/useVault.ts` — `useVault<TPayload>(vault)` hook with state management and convenience methods
- [x] 10.2 Create `packages/encrypted-vault/src/react/VaultGate.tsx` — guard component with loading/create/unlock/unavailable states
- [x] 10.3 Create `packages/encrypted-vault/src/react/VaultCreateModal.tsx` — create vault form with passphrase validation
- [x] 10.4 Create `packages/encrypted-vault/src/react/VaultUnlockModal.tsx` — unlock vault form with error handling
- [x] 10.5 Create `packages/encrypted-vault/src/react/VaultSettings.tsx` — comprehensive vault management panel (status, export/import, change passphrase, delete, TTL config)
- [x] 10.6 Add `className` props to all React components for Tailwind customization
- [x] 10.7 Add `react` and `react-dom` as peer dependencies in the vault package
- [x] 10.8 Configure Vite build for `react` entry point (separate chunk)
- [x] 10.9 Write tests for `useVault`, `VaultGate`, `VaultCreateModal`, `VaultUnlockModal`

## 11. App adapter layer

- [x] 11.1 Rewrite `src/infrastructure/vault/index.ts` — create SDK vault instance with app-specific config, re-export symbols
- [x] 11.2 Create `src/infrastructure/vault/payload.ts` — app-specific `VaultPayload` type `{ version: 1, apiKeys: Record<string, string> }`
- [x] 11.3 Remove `EncryptedVaultRecord` type and `encryptedVault` store from `src/infrastructure/db.ts` and its upgrade logic
- [x] 11.4 Update `src/infrastructure/sessionCredentials.ts` to use `vault.getPayload()` and `vault.persistPayload()` from the new adapter
- [x] 11.5 Update `src/features/vault/VaultGate.tsx` to use the adapter (or SDK's `VaultGate`)
- [x] 11.6 Update `src/features/settings/VaultSettingsSection.tsx` to use the adapter (or SDK's `VaultSettings`)
- [x] 11.7 Remove `src/features/vault/VaultCreateModal.tsx` and `VaultUnlockModal.tsx` if replaced by SDK components
- [x] 11.8 Run full test suite to verify no regressions

## 12. Documentation and cleanup

- [x] 12.1 Write `packages/encrypted-vault/README.md` with usage examples for core, storage, and React
- [x] 12.2 Add `LICENSE` (MIT) to the vault package
- [x] 12.3 Document migration path for existing consumers in the change summary
- [x] 12.4 Add open points section to README: `idb` dependency optionality, Tailwind-free React components, future OPFS storage