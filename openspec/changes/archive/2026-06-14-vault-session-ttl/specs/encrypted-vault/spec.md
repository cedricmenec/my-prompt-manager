# Encrypted Vault — Delta Spec: Session Cache

## Modified Requirements

### Requirement: Vault lock on page reload
~~The system SHALL lock the vault (clear the derived key and decrypted data from memory) on every page reload. The vault unlock prompt SHALL be displayed before any component attempts to use API keys.~~

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

## New Requirements

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
