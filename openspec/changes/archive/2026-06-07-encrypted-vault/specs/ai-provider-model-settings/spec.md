# AI Provider Model Settings — Delta Spec

## Purpose

Delta spec for the `encrypted-vault` change. Extends API key session credentials to transparently persist into and restore from the encrypted vault.

## MODIFIED Requirements

### Requirement: OpenRouter API key entry
The system SHALL provide an OpenRouter API key input in the `API & Models` settings section. When an encrypted vault is unlocked, the system SHALL persist the entered key into the vault (encrypted at rest) and restore it from the vault on subsequent sessions. The key SHALL remain available in session memory for the duration of the session. When no vault is available, the system SHALL keep the key in session memory only.

#### Scenario: User enters an OpenRouter API key with vault unlocked
- **WHEN** the user enters a key in the OpenRouter API key field and the vault is unlocked
- **THEN** the key is available for the current settings session
- **AND** the key is persisted in the encrypted vault (never in plaintext in IndexedDB, localStorage, or logs)

#### Scenario: User enters an OpenRouter API key without vault
- **WHEN** the user enters a key in the OpenRouter API key field and no vault exists or vault is locked
- **THEN** the key is available for the current session only
- **AND** the key is not written to `localStorage`, IndexedDB, import/export payloads, Drive snapshots, or logs

#### Scenario: API key is restored from vault on session start
- **WHEN** the page loads, an encrypted vault exists, and the user unlocks it with the correct passphrase
- **THEN** previously stored API keys are available in session memory without re-entry

#### Scenario: User needs an OpenRouter key
- **WHEN** the OpenRouter key field is visible
- **THEN** the system shows a link to the OpenRouter page where the user can obtain an API key

#### Scenario: Missing key blocks catalog loading
- **WHEN** the user attempts to load OpenRouter models without entering an API key
- **THEN** the system shows an actionable validation error and does not call OpenRouter

---

### Requirement: Provider and model settings storage
The system SHALL store AI provider connection metadata, cached provider models, and enabled model selections in IndexedDB using structured records.

#### Scenario: Provider connection metadata is saved
- **WHEN** non-sensitive provider metadata changes
- **THEN** the system persists the provider connection record with timestamps

#### Scenario: Model catalog is cached
- **WHEN** OpenRouter models are loaded successfully
- **THEN** the system stores the normalized catalog with a fetch timestamp

#### Scenario: Enabled models survive reload
- **WHEN** the application reloads after the user selected enabled models
- **THEN** the enabled model selections are restored from IndexedDB

#### Scenario: API keys are excluded from structured storage
- **WHEN** provider and model settings are persisted in the `aiProviderConnections`, `aiProviderModels`, and `enabledAiModels` stores
- **THEN** no raw API key is persisted in those records
- **AND** API keys are stored only in the encrypted vault (when available) or session memory
