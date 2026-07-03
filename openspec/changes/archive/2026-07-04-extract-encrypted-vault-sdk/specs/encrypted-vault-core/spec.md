# Encrypted Vault Core

## Purpose

Provides the framework-agnostic core of the local-encrypted-vault SDK: cryptographic primitives (PBKDF2 + AES-256-GCM), session cache with configurable TTL, storage abstraction interface, and vault lifecycle orchestration — all with zero UI framework dependencies.

## ADDED Requirements

### Requirement: Vault class with generic payload type
The SDK SHALL export a `Vault<TPayload>` class parameterized with the payload type. The payload type SHALL extend `VaultPayloadBase` which requires a `version: number` field. The class SHALL encapsulate all vault state (derived `CryptoKey`, decrypted payload) as instance members, not module-level state.

#### Scenario: Creating a vault instance
- **WHEN** a consumer calls `createVault({ storage, initialPayload })` with a `VaultStorage` implementation and an initial payload conforming to `VaultPayloadBase`
- **THEN** the returned `Vault<TPayload>` instance is ready for use with all lifecycle methods

#### Scenario: Multiple vault instances are isolated
- **WHEN** two vault instances are created with different storage backends
- **THEN** they operate independently — locking one does not affect the other

### Requirement: Vault lifecycle — create
The vault SHALL support creating a new encrypted vault with a user-supplied passphrase. The vault SHALL generate a random 16-byte salt and 12-byte IV, derive an AES-256-GCM key using PBKDF2-SHA256 with 600,000 iterations, compute a lightweight verify hash (PBKDF2 with 1,000 iterations), encrypt the initial payload, and persist the record via the storage plugin.

#### Scenario: Create vault with valid passphrase
- **WHEN** `vault.create(passphrase)` is called with a passphrase of at least 8 characters
- **THEN** a random 16-byte salt and 12-byte IV are generated
- **AND** an AES-256-GCM key is derived from the passphrase using PBKDF2-SHA256 with 600,000 iterations
- **AND** a verify hash is derived using PBKDF2 with 1,000 iterations
- **AND** the initial payload is serialized to JSON, encrypted, and persisted via the storage plugin
- **AND** the vault becomes unlocked (derived key + payload held in memory)

#### Scenario: Create vault with short passphrase
- **WHEN** `vault.create(passphrase)` is called with a passphrase shorter than 8 characters
- **THEN** the vault throws a `VaultError` with message "Passphrase must be at least 8 characters"

### Requirement: Vault lifecycle — unlock
The vault SHALL support unlocking an existing vault by first verifying the passphrase against the stored verify hash (fast, 1,000 iterations), then deriving the full AES key (600,000 iterations) and decrypting the payload on success.

#### Scenario: Correct passphrase unlocks
- **WHEN** `vault.unlock(passphrase)` is called with the correct passphrase
- **THEN** the verify hash is checked (fast path)
- **AND** on match, the full AES key is derived
- **AND** the payload is decrypted and held in memory
- **AND** the vault is reported as unlocked

#### Scenario: Wrong passphrase shows typed error
- **WHEN** `vault.unlock(passphrase)` is called with an incorrect passphrase
- **THEN** the method throws `WrongPassphraseError`
- **AND** the vault remains locked
- **AND** the expensive full key derivation is not attempted

#### Scenario: Unlock with no vault throws VaultNotFoundError
- **WHEN** `vault.unlock(passphrase)` is called and no vault exists in storage
- **THEN** the method throws `VaultNotFoundError`

### Requirement: Vault lifecycle — lock
The vault SHALL support locking, which clears the derived key and decrypted payload from memory. The encrypted record in storage remains unchanged.

#### Scenario: Lock clears memory
- **WHEN** `vault.lock()` is called on an unlocked vault
- **THEN** the derived key is set to null in memory
- **AND** `vault.getPayload()` returns null
- **AND** `vault.isUnlocked()` returns false
- **AND** the storage record is not modified

### Requirement: Vault lifecycle — delete
The vault SHALL support deleting the vault entirely, removing the encrypted record from storage and clearing all in-memory state.

#### Scenario: Delete removes vault
- **WHEN** `vault.delete()` is called
- **THEN** the storage record is removed
- **AND** the in-memory key and payload are cleared
- **AND** `vault.isAvailable()` returns false after deletion

### Requirement: Vault availability check
The vault SHALL provide `isAvailable()` returning true when an encrypted record exists in storage, and `isUnlocked()` returning true when the derived key and payload are held in memory.

#### Scenario: Available after creation
- **WHEN** a vault has been created and persisted
- **THEN** `isAvailable()` returns true

#### Scenario: Available after unlock
- **WHEN** a vault exists in storage and has been unlocked
- **THEN** both `isAvailable()` and `isUnlocked()` return true

#### Scenario: Not available when no record
- **WHEN** no vault has ever been created (or has been deleted)
- **THEN** `isAvailable()` returns false

### Requirement: Payload persistence
The vault SHALL support `persistPayload()` which re-encrypts the current in-memory payload with a new random IV and persists it via the storage plugin.

#### Scenario: Persist after payload mutation
- **WHEN** the caller mutates the payload (e.g., `vault.getPayload()!.apiKeys["provider"] = "key"`) and calls `persistPayload()`
- **THEN** a new random IV is generated
- **AND** the payload is re-encrypted and persisted
- **AND** `vault.isUnlocked()` remains true

#### Scenario: Persist on locked vault throws
- **WHEN** `persistPayload()` is called on a locked vault
- **THEN** the method throws `VaultLockedError`

### Requirement: Vault export
The vault SHALL support `export()` which returns a JSON-serialisable representation of the encrypted vault record (with typed arrays converted to plain number arrays).

#### Scenario: Export returns serialisable object
- **WHEN** `vault.export()` is called on an existing vault
- **THEN** the returned object contains `version`, `salt`, `iv`, `verifyHash`, `data`, `createdAt`, `updatedAt` fields
- **AND** binary fields (`salt`, `iv`, `verifyHash`, `data`) are plain `number[]` arrays

#### Scenario: Export with no vault returns null
- **WHEN** `vault.export()` is called and no vault exists
- **THEN** it returns `null`

### Requirement: Vault import
The vault SHALL support `import(jsonData, passphrase)` which verifies the passphrase against the imported record's verify hash, replaces the current storage record, and unlocks the vault on success.

#### Scenario: Import valid vault
- **WHEN** `vault.import(data, passphrase)` is called with valid exported data and correct passphrase
- **THEN** the passphrase is verified against the imported record's verify hash
- **AND** the storage record is replaced with the imported data
- **AND** the vault is unlocked with the imported payload

#### Scenario: Import with wrong passphrase throws
- **WHEN** `vault.import(data, passphrase)` is called with an incorrect passphrase
- **THEN** `WrongPassphraseError` is thrown
- **AND** the current vault record is not modified

### Requirement: Change passphrase
The vault SHALL support `changePassphrase(currentPassphrase, newPassphrase)` which verifies the current passphrase, re-derives the key with a new salt, re-encrypts the payload, and persists.

#### Scenario: Successful passphrase change
- **WHEN** `vault.changePassphrase(current, newPassphrase)` is called with correct current passphrase
- **THEN** the current passphrase is verified against the stored verify hash
- **AND** the current key decrypts the payload
- **AND** a new salt is generated
- **AND** a new key is derived from the new passphrase
- **AND** the payload is re-encrypted and persisted
- **AND** the vault remains unlocked with the new key

#### Scenario: Wrong current passphrase throws
- **WHEN** `vault.changePassphrase(wrong, newPassphrase)` is called
- **THEN** `WrongPassphraseError` is thrown

### Requirement: Auto-unlock from session cache
The vault SHALL support `tryAutoUnlock()` which attempts to retrieve a cached passphrase from the session cache and silently unlock the vault. Returns `true` on success, `false` on failure (clearing stale cache on failure).

#### Scenario: Auto-unlock succeeds with valid cache
- **WHEN** a valid cached passphrase exists (within TTL)
- **THEN** `tryAutoUnlock()` silently derives the key and unlocks the vault
- **AND** returns `true`

#### Scenario: Auto-unlock fails with no cache
- **WHEN** no session cache exists
- **THEN** `tryAutoUnlock()` returns `false`
- **AND** the vault remains locked

#### Scenario: Auto-unlock clears stale cache
- **WHEN** a cached passphrase exists but is expired (beyond TTL) or invalid
- **THEN** `tryAutoUnlock()` returns `false`
- **AND** the session cache is cleared

### Requirement: Session cache with configurable TTL
The SDK SHALL provide session cache utilities: `getTTLConfig()`, `setTTLConfig(ttl)`, `storeSessionPassphrase(passphrase)`, `tryGetSessionPassphrase()`, `clearSessionCache()`. TTL presets SHALL be: Disabled (`0`), 15 min (`15`), 60 min (`60`), 240 min (`240`), Session (`-1`). Default SHALL be 60 minutes. TTL config SHALL be persisted in `localStorage`. Passphrase cache SHALL be in `sessionStorage`.

#### Scenario: Default TTL is 60 minutes
- **WHEN** no TTL configuration exists in localStorage
- **THEN** `getTTLConfig()` returns `60`

#### Scenario: Session mode survives until tab close
- **WHEN** TTL is set to `-1` (Session)
- **THEN** the cache never expires based on time
- **AND** auto-unlock succeeds on any page reload within the same tab

#### Scenario: Disabled TTL clears cache immediately
- **WHEN** TTL is set to `0` (Disabled)
- **THEN** the session cache is cleared immediately
- **AND** auto-unlock always returns false

### Requirement: Storage abstraction interface
The SDK SHALL export a `VaultStorage` interface with methods: `load(): Promise<EncryptedRecord | null>`, `save(record: EncryptedRecord): Promise<void>`, `remove(): Promise<void>`, `exists(): Promise<boolean>`.

#### Scenario: Storage interface is implementable by third parties
- **WHEN** a consumer implements the `VaultStorage` interface
- **THEN** it can be passed to `createVault()` and used as the persistence backend

### Requirement: Typed error classes
The SDK SHALL export typed error classes: `VaultError` (base), `WrongPassphraseError`, `VaultNotFoundError`, `VaultLockedError`, `CryptoUnavailableError`.

#### Scenario: Errors are catchable by type
- **WHEN** a vault operation fails with a wrong passphrase
- **THEN** the thrown error is an instance of `WrongPassphraseError` (which extends `VaultError`)
- **AND** consumers can catch specific error types

### Requirement: Web Crypto availability check
The SDK SHALL export `isWebCryptoAvailable()` returning true when `window.crypto.subtle` is accessible.

#### Scenario: Web Crypto available in secure context
- **WHEN** the page is served over HTTPS or localhost
- **THEN** `isWebCryptoAvailable()` returns `true`

#### Scenario: Web Crypto unavailable in non-secure context
- **WHEN** the page is served over HTTP (non-localhost)
- **THEN** `isWebCryptoAvailable()` returns `false`