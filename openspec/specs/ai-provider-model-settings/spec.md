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
The system SHALL provide an OpenRouter API key input in the `API & Models` settings section and SHALL keep the entered key in session memory only for this change.

#### Scenario: User enters an OpenRouter API key
- **WHEN** the user enters a key in the OpenRouter API key field
- **THEN** the key is available for the current settings session
- **AND** the key is not written to `localStorage`, IndexedDB, import/export payloads, Drive snapshots, or logs

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
The system SHALL show a searchable model list for the selected provider and SHALL allow selecting multiple models as enabled models.

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
