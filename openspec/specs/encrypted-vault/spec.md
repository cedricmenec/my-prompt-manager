# Encrypted Vault

## Purpose

Provides a local encrypted vault for persisting sensitive user data (API keys, future OAuth tokens) in IndexedDB using a user-supplied passphrase. The vault uses Web Crypto API (PBKDF2 + AES-256-GCM) and keeps the derived encryption key in memory only.

*This spec is maintained as an app-level adapter. The core vault logic is now provided by the `@byo-prompt/encrypted-vault` SDK package.*

## Requirements

### Requirement: IndexedDB encrypted vault store
The system SHALL create the `encryptedVault` IndexedDB object store within the `byo-prompt-manager` database. The store is now managed by the `@byo-prompt/encrypted-vault` SDK's IndexedDB storage plugin, not by the app's database upgrade logic.

#### Scenario: Store is created by SDK on first vault access
- **WHEN** the SDK storage plugin is initialized with `dbName: 'byo-prompt-manager'` and `storeName: 'encryptedVault'`
- **THEN** the SDK opens the database and creates the store if missing
- **AND** the app's database upgrade function no longer creates the `encryptedVault` store

#### Scenario: Vault record structure unchanged
- **WHEN** a vault is saved to IndexedDB
- **THEN** the record contains `key`, `version`, `salt`, `iv`, `verifyHash`, `data`, `createdAt`, and `updatedAt` fields (managed by the SDK)

### Requirement: Vault adapter in app infrastructure
The app SHALL maintain a thin adapter module at `src/infrastructure/vault/index.ts` that creates and exports a preconfigured `Vault` instance from the SDK, along with the app-specific `VaultPayload` type.

#### Scenario: Adapter exports typed vault instance
- **WHEN** the app imports from `@/infrastructure/vault`
- **THEN** it receives a `Vault<VaultPayload>` instance preconfigured with the app's database name and store name
- **AND** the `VaultPayload` type is `{ version: 1, apiKeys: Record<string, string> }`

#### Scenario: Adapter re-exports SDK symbols
- **WHEN** the SDK exports a symbol (e.g., `isWebCryptoAvailable`)
- **THEN** the adapter re-exports it so existing app imports continue to work

### Requirement: Session credentials vault integration
The system SHALL transparently persist API keys into the encrypted vault (when unlocked) and restore them from the vault on subsequent sessions. The `sessionCredentials` API remains unchanged for all consumers.

#### Scenario: API key persisted to vault on set
- **WHEN** the vault is unlocked and `setApiKey` is called
- **THEN** the key is written to both the in-memory cache and the vault payload
- **AND** the vault is re-encrypted and persisted to IndexedDB

#### Scenario: API key restored from vault on get
- **WHEN** the vault is unlocked and `getApiKey` is called for a key not in the in-memory cache
- **THEN** the key is read from the decrypted vault payload, cached in memory, and returned

#### Scenario: clearAll clears cache but not vault
- **WHEN** `clearAll` is called
- **THEN** the in-memory credential cache is cleared
- **AND** the vault payload remains intact (the vault is not deleted)

### Requirement: Vault passphrase recovery warning
The system SHALL display a warning message in the vault settings section informing the user that a lost passphrase cannot be recovered.

#### Scenario: Warning is displayed
- **WHEN** the user opens the Vault settings section
- **THEN** a warning message is shown about passphrase recovery
