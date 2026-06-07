# Encrypted Vault

## Purpose

Provides a local encrypted vault for persisting sensitive user data (API keys, future OAuth tokens) in IndexedDB using a user-supplied passphrase. The vault uses Web Crypto API (PBKDF2 + AES-256-GCM) and keeps the derived encryption key in memory only.

## ADDED Requirements

### Requirement: Vault creation
The system SHALL allow the user to create an encrypted vault by providing a passphrase. The system SHALL derive an AES-256-GCM encryption key from the passphrase using PBKDF2 with SHA-256 and 600,000 iterations, a 16-byte random salt, and store the resulting encrypted blob in IndexedDB.

#### Scenario: User creates a vault with a valid passphrase
- **WHEN** the user provides a passphrase of at least 8 characters and confirms it
- **THEN** the system generates a random 16-byte salt and 12-byte IV
- **AND** derives an AES-256-GCM key from the passphrase using PBKDF2-SHA256 with 600,000 iterations
- **AND** stores the encrypted vault blob in IndexedDB with salt, IV, verify hash, and timestamp
- **AND** keeps the derived key in memory only

#### Scenario: Passphrase too short
- **WHEN** the user provides a passphrase shorter than 8 characters
- **THEN** the system shows a validation error and does not create the vault

#### Scenario: Passphrase confirmation mismatch
- **WHEN** the user enters a confirmation passphrase that does not match the initial passphrase
- **THEN** the system shows an error and does not create the vault

---

### Requirement: Vault unlock
The system SHALL unlock an existing vault by verifying the user's passphrase against a stored lightweight verify hash (PBKDF2 with 1,000 iterations). If verification succeeds, the system SHALL derive the full AES-256-GCM key (600,000 iterations) and decrypt the vault payload.

#### Scenario: Correct passphrase unlocks the vault
- **WHEN** the user enters the correct passphrase for an existing vault
- **THEN** the system verifies the passphrase against the stored verify hash
- **AND** derives the full AES-256-GCM key
- **AND** decrypts the vault payload
- **AND** makes the decrypted data available in memory

#### Scenario: Wrong passphrase shows error
- **WHEN** the user enters an incorrect passphrase
- **THEN** the system shows "Wrong password, try again"
- **AND** does not attempt the expensive full key derivation
- **AND** the vault remains locked

---

### Requirement: Vault lock on page reload
The system SHALL lock the vault (clear the derived key and decrypted data from memory) on every page reload. The vault unlock prompt SHALL be displayed before any component attempts to use API keys.

#### Scenario: Page reload triggers vault lock
- **WHEN** the page is reloaded and an encrypted vault exists in IndexedDB
- **THEN** the derived key is not present in memory
- **AND** the vault unlock modal is displayed

#### Scenario: Vault unlocked state persists during session
- **WHEN** the vault is unlocked and the user navigates within the app without reloading
- **THEN** the derived key remains in memory and API keys remain accessible

---

### Requirement: Vault payload schema
The decrypted vault payload SHALL be a versioned JSON object containing an `apiKeys` map (provider ID to API key string) and a `version` field for future migration support.

#### Scenario: New vault has correct payload structure
- **WHEN** a vault is created
- **THEN** the decrypted payload contains `version: 1` and an empty `apiKeys` object

#### Scenario: API key stored in vault
- **WHEN** the user sets an API key for a provider
- **THEN** the key is stored in the `apiKeys` map under the provider ID
- **AND** the vault is re-encrypted and persisted to IndexedDB

#### Scenario: API key read from vault
- **WHEN** the vault is unlocked and an API key is requested for a provider
- **THEN** the key is returned from the decrypted vault payload

---

### Requirement: IndexedDB encrypted vault store
The system SHALL store the encrypted vault as a single record in a new `encryptedVault` IndexedDB object store within the existing `byo-prompt-manager` database. The database schema version SHALL be bumped from 8 to 9.

#### Scenario: New store is created on upgrade
- **WHEN** the database is upgraded from version 8 to version 9
- **THEN** the `encryptedVault` object store exists with key path `"key"`

#### Scenario: Vault record structure
- **WHEN** a vault is saved to IndexedDB
- **THEN** the record contains `key`, `version`, `salt`, `iv`, `verifyHash`, `data`, `createdAt`, and `updatedAt` fields

---

### Requirement: Web Crypto API availability check
The system SHALL check for Web Crypto API availability at startup. If the API is not available (non-secure context), the system SHALL fall back to session-only mode and inform the user.

#### Scenario: Web Crypto available
- **WHEN** `window.crypto.subtle` is available
- **THEN** the vault functionality is fully available

#### Scenario: Web Crypto unavailable
- **WHEN** `window.crypto.subtle` is not available
- **THEN** the system displays a banner: "Encryption unavailable — keys are session-only"
- **AND** the vault creation and unlock flows are not shown

---

### Requirement: Vault export
The system SHALL allow the user to export the encrypted vault blob as a downloadable JSON file. The exported file SHALL contain the encrypted data and remain protected by the user's passphrase.

#### Scenario: User exports vault
- **WHEN** the user clicks "Export vault" in Settings
- **THEN** a JSON file is downloaded containing the full encrypted vault record (salt, iv, verifyHash, data, timestamps)
- **AND** the file is useless without the passphrase

---

### Requirement: Vault import
The system SHALL allow the user to import an encrypted vault from a JSON file. The system SHALL verify the passphrase against the imported vault's verify hash before accepting it.

#### Scenario: User imports a valid vault
- **WHEN** the user selects a valid vault JSON file and provides the correct passphrase
- **THEN** the system verifies the passphrase against the imported vault's verify hash
- **AND** replaces the current vault (if any) with the imported vault
- **AND** unlocks the imported vault automatically

#### Scenario: Wrong passphrase on import
- **WHEN** the user provides an incorrect passphrase for the imported vault
- **THEN** the system shows "Wrong password, try again"
- **AND** the current vault remains unchanged

#### Scenario: Import over existing vault shows confirmation
- **WHEN** the user imports a vault and a vault already exists in IndexedDB
- **THEN** the system shows a confirmation prompt: "Replace current vault?"
- **AND** the import proceeds only on confirmation

---

### Requirement: Change passphrase
The system SHALL allow the user to change the vault passphrase while the vault is unlocked. The system SHALL re-derive the encryption key with a new salt and re-encrypt the vault payload.

#### Scenario: User changes passphrase successfully
- **WHEN** the user provides the current passphrase and a new passphrase (with confirmation)
- **THEN** the system verifies the current passphrase
- **AND** generates a new random salt
- **AND** re-derives the key with the new passphrase and new salt
- **AND** re-encrypts the vault payload
- **AND** persists the updated vault to IndexedDB

#### Scenario: Wrong current passphrase
- **WHEN** the user provides an incorrect current passphrase during change
- **THEN** the system shows "Wrong password, try again"
- **AND** the vault is not modified

---

### Requirement: Delete vault
The system SHALL allow the user to delete the encrypted vault. Deleting the vault SHALL clear all persisted sensitive data and the derived key from memory.

#### Scenario: User deletes vault
- **WHEN** the user confirms vault deletion
- **THEN** the encrypted vault record is removed from IndexedDB
- **AND** the derived key and all cached API keys are cleared from memory
- **AND** the app reverts to session-only mode

---

### Requirement: Vault passphrase lost
The system SHALL display a warning in the vault settings area that lost passphrases cannot be recovered and recommend keeping a backup.

#### Scenario: Warning is visible in Settings
- **WHEN** the user opens the vault settings section
- **THEN** a warning message is visible: "If you lose your passphrase, your encrypted data cannot be recovered. Consider keeping a backup."
