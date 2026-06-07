# Settings Panel — Delta Spec

## Purpose

Delta spec for the `encrypted-vault` change. Adds a "Vault" category to the Settings panel sidebar with vault management controls.

## ADDED Requirements

### Requirement: Vault settings category
The Settings panel SHALL include a "Vault" category in the settings sidebar. Selecting it SHALL show vault management controls: vault status, export, import, change passphrase, and delete vault.

#### Scenario: Vault category is visible in Settings sidebar
- **WHEN** the user opens the Settings panel
- **THEN** the settings sidebar includes a "Vault" category

#### Scenario: User navigates to Vault settings
- **WHEN** the user selects "Vault" from the settings sidebar
- **THEN** the right content area shows vault status and management controls

---

### Requirement: Vault status display
The Settings panel vault section SHALL display the current vault status: whether a vault exists, when it was created and last updated, and whether it is currently unlocked.

#### Scenario: Vault exists and is unlocked
- **WHEN** the user opens Vault settings and the vault is unlocked
- **THEN** the panel shows "Vault: unlocked", creation date, last update date, and management controls (export, import, change passphrase, delete)

#### Scenario: No vault exists
- **WHEN** the user opens Vault settings and no vault exists
- **THEN** the panel shows "No vault configured" and a "Create vault" button

---

### Requirement: Vault export in Settings
The Settings panel vault section SHALL provide an "Export vault" button that downloads the encrypted vault blob as a JSON file.

#### Scenario: User exports vault from Settings
- **WHEN** the user clicks "Export vault" in the Vault settings section
- **THEN** a JSON file is downloaded containing the encrypted vault record

---

### Requirement: Vault import in Settings
The Settings panel vault section SHALL provide an "Import vault" button that opens a file picker for a JSON file, prompts for the passphrase, and replaces the current vault on success.

#### Scenario: User imports vault from Settings
- **WHEN** the user clicks "Import vault", selects a valid vault JSON file, and provides the correct passphrase
- **THEN** the imported vault replaces the current vault (after confirmation if one exists)
- **AND** the vault is unlocked automatically

---

### Requirement: Vault change passphrase in Settings
The Settings panel vault section SHALL provide a "Change passphrase" action that prompts for the current passphrase and a new passphrase (with confirmation), then re-encrypts the vault.

#### Scenario: User changes passphrase from Settings
- **WHEN** the user provides the correct current passphrase and a matching new passphrase
- **THEN** the vault is re-encrypted with the new passphrase
- **AND** a success message is shown

---

### Requirement: Vault delete in Settings
The Settings panel vault section SHALL provide a "Delete vault" action that removes the encrypted vault from IndexedDB and clears all sensitive data from memory.

#### Scenario: User deletes vault from Settings
- **WHEN** the user confirms vault deletion
- **THEN** the vault is removed from IndexedDB
- **AND** all cached API keys are cleared from memory
- **AND** the app reverts to session-only mode

---

### Requirement: Vault passphrase warning in Settings
The Settings panel vault section SHALL display a warning that lost passphrases cannot be recovered.

#### Scenario: Warning is displayed
- **WHEN** the user opens the Vault settings section
- **THEN** a warning message is shown about passphrase recovery

---

## MODIFIED Requirements

### Requirement: Settings sidebar navigation
The Settings panel SHALL provide a two-column modal layout with a left sidebar for settings categories and a right content area for the active category.

#### Scenario: Settings opens with navigable categories
- **WHEN** the user opens the Settings panel
- **THEN** the panel shows a left sidebar with `Legacy`, `API & Models`, `AI Features`, and `Vault` categories
- **AND** the panel shows the active category content on the right

#### Scenario: User switches categories
- **WHEN** the user selects a settings category from the sidebar
- **THEN** the right content area updates to show that category
