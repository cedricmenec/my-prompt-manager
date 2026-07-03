# Encrypted Vault

## Purpose

Provides a local encrypted vault for persisting sensitive user data (API keys, future OAuth tokens) in IndexedDB using a user-supplied passphrase. The vault uses Web Crypto API (PBKDF2 + AES-256-GCM) and keeps the derived encryption key in memory only.

*This spec is maintained as an app-level adapter. The core vault logic is now provided by the `local-encrypted-vault` SDK package.*

## MODIFIED Requirements

### Requirement: IndexedDB encrypted vault store
The system SHALL create the `encryptedVault` IndexedDB object store within the `byo-prompt-manager` database. The store is now managed by the `local-encrypted-vault` SDK's IndexedDB storage plugin, not by the app's database upgrade logic.

#### Scenario: Store is created by SDK on first vault access
- **WHEN** the SDK storage plugin is initialized with `dbName: 'byo-prompt-manager'` and `storeName: 'encryptedVault'`
- **THEN** the SDK opens the database and creates the store if missing
- **AND** the app's database upgrade function no longer creates the `encryptedVault` store

#### Scenario: Vault record structure unchanged
- **WHEN** a vault is saved to IndexedDB
- **THEN** the record contains `key`, `version`, `salt`, `iv`, `verifyHash`, `data`, `createdAt`, and `updatedAt` fields (managed by the SDK)

## ADDED Requirements

### Requirement: Vault adapter in app infrastructure
The app SHALL maintain a thin adapter module at `src/infrastructure/vault/index.ts` that creates and exports a preconfigured `Vault` instance from the SDK, along with the app-specific `VaultPayload` type.

#### Scenario: Adapter exports typed vault instance
- **WHEN** the app imports from `@/infrastructure/vault`
- **THEN** it receives a `Vault<VaultPayload>` instance preconfigured with the app's database name and store name
- **AND** the `VaultPayload` type is `{ version: 1, apiKeys: Record<string, string> }`

#### Scenario: Adapter re-exports SDK symbols
- **WHEN** the SDK exports a symbol (e.g., `isWebCryptoAvailable`)
- **THEN** the adapter re-exports it so existing app imports continue to work

## REMOVED Requirements

### Requirement: Vault creation
**Reason**: Core vault creation logic moved to the `local-encrypted-vault` SDK.
**Migration**: Use `vault.create(passphrase)` from the SDK vault instance.

### Requirement: Vault unlock
**Reason**: Core vault unlock logic moved to the `local-encrypted-vault` SDK.
**Migration**: Use `vault.unlock(passphrase)` from the SDK vault instance.

### Requirement: Vault lock on page reload
**Reason**: Core vault lock + auto-unlock logic moved to the SDK.
**Migration**: Use `vault.lock()` and `vault.tryAutoUnlock()` from the SDK.

### Requirement: Session cache storage
**Reason**: Session cache logic moved to the SDK (`session.ts`).
**Migration**: Session cache is managed internally by the SDK vault instance.

### Requirement: Configurable TTL for session cache
**Reason**: TTL configuration logic moved to the SDK.
**Migration**: Use `vault.getSessionTTL()` and `vault.setSessionTTL()` from the SDK.

### Requirement: Cache invalidation on security-sensitive operations
**Reason**: Cache invalidation is built into the SDK's `lock()`, `delete()`, and `import()` methods.
**Migration**: Cache is automatically invalidated by the SDK.

### Requirement: TTL configuration UI in Vault Settings
**Reason**: UI responsibility moved to the SDK's React `VaultSettings` component or the app's adapted version.
**Migration**: Use `VaultSettings` from the SDK React package.

### Requirement: Vault payload schema
**Reason**: Payload schema is now defined by the app (as `VaultPayload`), not by the spec. The SDK accepts any type extending `VaultPayloadBase`.
**Migration**: Define `VaultPayload` locally in the adapter, pass it as the generic parameter to `Vault<VaultPayload>`.

### Requirement: Vault export
**Reason**: Export logic moved to the SDK (`vault.export()`).
**Migration**: Use `vault.export()` from the SDK.

### Requirement: Vault import
**Reason**: Import logic moved to the SDK (`vault.import()`).
**Migration**: Use `vault.import(data, passphrase)` from the SDK.

### Requirement: Change passphrase
**Reason**: Passphrase change logic moved to the SDK (`vault.changePassphrase()`).
**Migration**: Use `vault.changePassphrase(current, newPassphrase)` from the SDK.

### Requirement: Web Crypto API availability check
**Reason**: Availability check moved to the SDK (`isWebCryptoAvailable()`).
**Migration**: Import from the SDK or adapter.