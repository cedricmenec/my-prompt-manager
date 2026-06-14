# Encrypted Vault

## Purpose

Provides a local encrypted vault for persisting sensitive user data (API keys, future OAuth tokens) in IndexedDB using a user-supplied passphrase. The vault uses Web Crypto API (PBKDF2 + AES-256-GCM) and keeps the derived encryption key in memory only.

## Requirements

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
The system SHALL lock the vault (clear the derived key and decrypted data from memory) on every page reload. If a valid session cache exists and the configured TTL has not expired, the system SHALL auto-unlock the vault silently without prompting the user. Otherwise, the vault unlock prompt SHALL be displayed before any component attempts to use API keys.

#### Scenario: Page reload triggers vault lock (no cache)
- **WHEN** the page is reloaded, an encrypted vault exists in IndexedDB, and no valid session cache exists
- **THEN** the derived key is not present in memory
- **AND** the vault unlock modal is displayed

#### Scenario: Page reload with valid session cache auto-unlocks
- **WHEN** the page is reloaded, an encrypted vault exists in IndexedDB, and a valid session cache exists with a passphrase whose TTL has not expired
- **THEN** the system silently derives the encryption key from the cached passphrase
- **AND** the vault is unlocked without showing the unlock modal

#### Scenario: Page reload with expired session cache shows prompt
- **WHEN** the page is reloaded and a session cache exists but the TTL has expired
- **THEN** the session cache is cleared
- **AND** the vault unlock modal is displayed

#### Scenario: Vault unlocked state persists during session
- **WHEN** the vault is unlocked and the user navigates within the app without reloading
- **THEN** the derived key remains in memory and API keys remain accessible

---

### Requirement: Session cache storage
The system SHALL store the vault passphrase and an `unlockedAt` timestamp in `sessionStorage` after a successful manual unlock. The cache SHALL be scoped to the current browser tab and SHALL survive page reloads within the same tab.

#### Scenario: Passphrase cached on manual unlock
- **WHEN** the user successfully unlocks the vault via the unlock modal
- **THEN** the passphrase and current timestamp are stored in `sessionStorage`

#### Scenario: Cache cleared on tab close
- **WHEN** the browser tab is closed
- **THEN** the session cache is cleared by the browser
- **AND** reopening the app in a new tab requires manual unlock

#### Scenario: Cache isolated per tab
- **WHEN** the vault is unlocked in Tab A and the user opens Tab B
- **THEN** Tab B does not have access to Tab A's session cache
- **AND** Tab B shows the vault unlock modal

---

### Requirement: Configurable TTL for session cache
The system SHALL allow the user to configure a Time-To-Live (TTL) for the session cache. The TTL configuration SHALL be persisted in `localStorage` under the key `vault-session-ttl`. The available presets SHALL be: Disabled (`0`), 15 minutes (`15`), 60 minutes (`60`, default), 240 minutes (`240`), and Session (`-1`, no time-based expiry).

#### Scenario: Default TTL is 60 minutes
- **WHEN** no TTL configuration exists in `localStorage`
- **THEN** the system uses a TTL of 60 minutes

#### Scenario: User changes TTL to 15 minutes
- **WHEN** the user selects "15 minutes" in vault settings
- **THEN** the TTL configuration is saved to `localStorage` as `15`
- **AND** the new TTL applies to subsequent page reloads

#### Scenario: User disables session cache
- **WHEN** the user selects "Disabled" in vault settings
- **THEN** the TTL configuration is saved to `localStorage` as `0`
- **AND** the session cache is cleared immediately
- **AND** the vault unlock modal is shown on every page reload

#### Scenario: User selects Session (no expiry)
- **WHEN** the user selects "Session" in vault settings
- **THEN** the TTL configuration is saved to `localStorage` as `-1`
- **AND** the cache never expires based on time (only on tab close or manual lock)

#### Scenario: TTL config change does not lock vault mid-session
- **WHEN** the vault is currently unlocked and the user changes the TTL configuration
- **THEN** the vault remains unlocked for the current page session
- **AND** the new TTL takes effect on the next page reload

---

### Requirement: Cache invalidation on security-sensitive operations
The system SHALL clear the session cache when the user manually locks the vault, deletes the vault, or imports a vault.

#### Scenario: Manual lock clears cache
- **WHEN** the user locks the vault (via `lockVault()`)
- **THEN** the session cache in `sessionStorage` is cleared

#### Scenario: Vault deletion clears cache
- **WHEN** the user deletes the vault (via `deleteVault()`)
- **THEN** the session cache in `sessionStorage` is cleared

#### Scenario: Vault import clears cache
- **WHEN** the user imports a vault (via `importVault()`)
- **THEN** the session cache in `sessionStorage` is cleared
- **AND** the imported vault's passphrase is cached after successful import + unlock

#### Scenario: Passphrase change does not clear cache
- **WHEN** the user changes the vault passphrase
- **THEN** the session cache is NOT cleared
- **AND** the next page reload attempts auto-unlock with the old passphrase, which fails
- **AND** the system falls back to showing the vault unlock modal

---

### Requirement: TTL configuration UI in Vault Settings
The system SHALL display a "Session timeout" section in the Vault Settings panel when a vault exists. The section SHALL present TTL presets as radio buttons with descriptive labels indicating the security tradeoff of each option.

#### Scenario: Session timeout section visible when vault exists
- **WHEN** the user opens Settings → Vault and a vault exists
- **THEN** a "Session timeout" section is displayed with radio buttons for TTL presets

#### Scenario: Session timeout section hidden when no vault
- **WHEN** the user opens Settings → Vault and no vault exists
- **THEN** the "Session timeout" section is not displayed

#### Scenario: Current TTL is visually indicated
- **WHEN** the user views the Session timeout section
- **THEN** the currently active TTL preset is visually selected (checked radio button)

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

---

### Requirement: Delete vault
The system SHALL allow the user to delete the vault, removing the encrypted record from IndexedDB and clearing the derived key and decrypted data from memory. After deletion, the app reverts to session-only mode.

#### Scenario: User deletes vault
- **WHEN** the user confirms vault deletion in Settings
- **THEN** the vault record is removed from IndexedDB
- **AND** the derived key and decrypted payload are cleared from memory
- **AND** the app reverts to session-only mode

---

### Requirement: Vault passphrase recovery warning
The system SHALL display a warning message in the vault settings section informing the user that a lost passphrase cannot be recovered.

#### Scenario: Warning is displayed
- **WHEN** the user opens the Vault settings section
- **THEN** a warning message is shown about passphrase recovery

---

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
