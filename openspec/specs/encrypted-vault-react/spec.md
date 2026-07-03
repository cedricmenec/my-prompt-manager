# Encrypted Vault React Bindings

## Purpose

Provides optional React hooks and generic UI components for the `@byo-prompt/encrypted-vault` SDK. Includes `useVault()` hook for state management, `VaultGate` for guarding application rendering, and modal components for vault creation, unlock, and settings.

## Requirements

### Requirement: useVault hook
The React bindings SHALL export a `useVault<TPayload>(vault: Vault<TPayload>)` hook that tracks vault state (`loading | no-vault | locked | unlocked | unavailable`) and exposes convenience methods (`create`, `unlock`, `lock`, `skip`).

#### Scenario: Hook initializes vault state on mount
- **WHEN** the `useVault(vault)` hook is mounted
- **THEN** it checks Web Crypto availability
- **AND** calls `vault.isAvailable()` and `vault.tryAutoUnlock()` as needed
- **AND** exposes the resolved `state`

#### Scenario: Hook exposes create, unlock, lock, skip
- **WHEN** the vault is in `no-vault` state
- **THEN** the hook exposes `create(passphrase)` which calls `vault.create()` and updates state on success
- **WHEN** the vault is in `locked` state
- **THEN** the hook exposes `unlock(passphrase)` which calls `vault.unlock()` and updates state on success
- **AND** the hook exposes `lock()` which calls `vault.lock()`
- **AND** the hook exposes `skip()` which transitions to `unlocked` without a vault (session-only mode)

#### Scenario: Hook exposes error state
- **WHEN** `create()` or `unlock()` throws
- **THEN** the hook captures the error message in `error` state
- **AND** re-renders the component with the error

### Requirement: VaultGate component
The React bindings SHALL export a `VaultGate` component that conditionally renders children based on vault state. It SHALL show a loading indicator during initialization, a `VaultCreateModal` when no vault exists, a `VaultUnlockModal` when the vault is locked, a warning banner when crypto is unavailable, and children when the vault is unlocked or skipped.

#### Scenario: VaultGate renders children when unlocked
- **WHEN** the vault is unlocked or the user has skipped vault creation
- **THEN** `VaultGate` renders `children`

#### Scenario: VaultGate shows unlock modal when locked
- **WHEN** a vault exists but is locked and auto-unlock fails
- **THEN** `VaultGate` renders `VaultUnlockModal`

#### Scenario: VaultGate shows create modal when no vault
- **WHEN** no vault exists
- **THEN** `VaultGate` renders `VaultCreateModal` with a "Skip" option

#### Scenario: VaultGate shows crypto-unavailable banner
- **WHEN** Web Crypto API is unavailable
- **THEN** `VaultGate` renders a banner "Encryption unavailable — keys are session-only"
- **AND** renders children (session-only mode)

### Requirement: VaultCreateModal component
The `VaultCreateModal` SHALL render a form with passphrase and confirmation fields, a "Create Vault" button, a "Skip" link, and an error display area. It SHALL accept `className` props for customization of its internal elements.

#### Scenario: Create modal validates passphrase length
- **WHEN** the user submits a passphrase shorter than 8 characters
- **THEN** the modal shows a validation error
- **AND** does not call `onCreate`

#### Scenario: Create modal validates confirmation match
- **WHEN** the confirmation passphrase does not match
- **THEN** the modal shows a validation error
- **AND** does not call `onCreate`

#### Scenario: Create modal onSuccess unlocks and closes
- **WHEN** the user submits valid matching passphrases and `onCreate` succeeds
- **THEN** the modal closes
- **AND** the vault becomes unlocked

### Requirement: VaultUnlockModal component
The `VaultUnlockModal` SHALL render a passphrase input field, an "Unlock" button, and an error display area. It SHALL accept `className` props for customization.

#### Scenario: Unlock modal shows error on wrong passphrase
- **WHEN** the user submits an incorrect passphrase
- **THEN** the modal shows "Wrong password, try again"
- **AND** the passphrase input is cleared for retry

#### Scenario: Unlock modal onSuccess closes
- **WHEN** the user submits the correct passphrase
- **THEN** the modal closes
- **AND** the vault becomes unlocked

### Requirement: VaultSettings component
The `VaultSettings` SHALL render a comprehensive vault management panel including: vault status display, export/import buttons (with file input), change passphrase form, delete vault with confirmation, and session TTL configuration. It SHALL accept `className` props for customization.

#### Scenario: Settings shows vault status
- **WHEN** the vault is available and unlocked
- **THEN** the panel shows "Unlocked ✓"
- **WHEN** the vault is available and locked
- **THEN** the panel shows "Locked"

#### Scenario: Settings shows export/import for existing vault
- **WHEN** a vault exists
- **THEN** the panel shows "Export vault" and "Import vault" buttons

#### Scenario: Settings shows create button when no vault
- **WHEN** no vault exists
- **THEN** the panel shows a "Create vault" button instead of export/import

#### Scenario: Settings has session TTL configuration
- **WHEN** a vault exists
- **THEN** the panel shows a "Session timeout" section with radio buttons for TTL presets

#### Scenario: Delete vault shows confirmation
- **WHEN** the user clicks "Delete vault"
- **THEN** a confirmation step is shown requiring the passphrase
- **AND** the vault is only deleted upon confirmed submission

### Requirement: VaultCreateModal and VaultUnlockModal accept className props for element customization
The modal components SHALL accept an optional `classNames` prop object allowing consumers to override Tailwind classes on each internal element: `wrapper`, `overlay`, `modal`, `title`, `description`, `input`, `button`, `error`, `skipLink`.

#### Scenario: Consumer customizes modal styling
- **WHEN** a consumer passes `classNames={{ modal: 'bg-custom-100', button: 'bg-blue-500' }}` to `VaultUnlockModal`
- **THEN** those class names are applied to the respective elements
- **AND** default Tailwind classes are merged or overridden as designed

### Requirement: VaultSettings accepts className props for element customization
The VaultSettings component SHALL accept an optional `classNames` prop object for element customization: `section`, `title`, `status`, `button`, `dangerButton`, `ttlGroup`, `ttlOption`, and `passphraseForm`.

#### Scenario: Consumer customizes settings panel styling
- **WHEN** a consumer passes `classNames={{ section: 'p-4 rounded-lg', button: 'px-4 py-2' }}` to `VaultSettings`
- **THEN** those class names are applied to the respective elements