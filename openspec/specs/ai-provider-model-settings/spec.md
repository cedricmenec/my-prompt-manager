# AI Provider Model Settings

## Purpose

Provides AI provider configuration, API key management, and model selection capabilities in the Settings panel.

## Requirements

### Requirement: AI provider definitions
The system SHALL define AI provider metadata separately from user settings, with OpenRouter as the only provider enabled for runtime use in this change.

#### Scenario: OpenRouter is available
- **WHEN** the user opens the `API & Models` settings section
- **THEN** OpenRouter is presented as a selectable provider

#### Scenario: Future providers are represented
- **WHEN** provider definitions include API providers or local providers that are not implemented yet
- **THEN** the system represents them as planned or disabled without allowing unsupported runtime configuration

---

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

### Requirement: OpenRouter model catalog loading
The system SHALL load the OpenRouter model catalog from the browser using the user-provided API key and normalize the response before storing model records locally.

#### Scenario: Models load successfully
- **WHEN** the user provides an OpenRouter API key and requests model loading
- **THEN** the system calls the OpenRouter models endpoint with bearer authentication
- **AND** stores normalized model records in IndexedDB

#### Scenario: Provider origin is derived
- **WHEN** the system normalizes OpenRouter models
- **THEN** each model record includes a display name and an origin provider value suitable for the model table

#### Scenario: Model loading fails
- **WHEN** OpenRouter returns an authentication, quota, rate limit, network, or CORS error
- **THEN** the system shows an actionable error without exposing the API key

---

### Requirement: Model search and selection
The system SHALL show a searchable model list for the selected provider and SHALL allow selecting multiple models as enabled models. The system SHALL provide a toggle to filter the displayed list to show only enabled models. The toggle SHALL be cumulative with the text search filter. The toggle SHALL be ephemeral (not persisted across sessions).

#### Scenario: User searches models
- **WHEN** the user types in the model search field
- **THEN** the displayed model list is filtered by model name

#### Scenario: User selects multiple models
- **WHEN** the user selects more than one model from the model list
- **THEN** the system persists each selected model as enabled for use elsewhere in the app

#### Scenario: User deselects a model
- **WHEN** the user deselects an enabled model
- **THEN** the model is no longer included in the enabled model set

#### Scenario: Cost column is reserved
- **WHEN** the model list is displayed
- **THEN** the table includes columns for model name, origin provider, and future token cost information

#### Scenario: User toggles enabled-only filter on
- **WHEN** the user checks the "Only enabled" toggle
- **THEN** the model table displays only models whose checkbox is checked (enabled)

#### Scenario: User toggles enabled-only filter off
- **WHEN** the user unchecks the "Only enabled" toggle
- **THEN** the model table displays all models again (subject to text search if active)

#### Scenario: Enabled-only filter combines with text search
- **WHEN** the "Only enabled" toggle is on AND the user types in the search field
- **THEN** the model table displays only enabled models whose name matches the search query

#### Scenario: Enabled-only toggle is ephemeral
- **WHEN** the settings panel is closed and reopened
- **THEN** the "Only enabled" toggle resets to unchecked (all models shown)

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
- **WHEN** provider and model settings are persisted
- **THEN** no raw API key is persisted in the provider connection, model catalog, or enabled model records
