## ADDED Requirements

### Requirement: Prompt input assistant feature settings
The system SHALL provide an `AI Features` settings category containing a `Prompt input assistant` section. The section SHALL expose an `AI Assistant` model selector populated from enabled text-capable or multimodal AI models.

#### Scenario: User opens AI Features settings
- **WHEN** the user opens Settings and selects `AI Features`
- **THEN** the main settings content shows the `Prompt input assistant` section
- **AND** the section includes an `AI Assistant` model selector

#### Scenario: Enabled text-capable models are selectable
- **WHEN** enabled AI models include text or multimodal models
- **THEN** the `AI Assistant` selector lists those models as options
- **AND** image-only or unknown-modality models are not offered for this text generation feature

#### Scenario: No enabled model is available
- **WHEN** no enabled text-capable model exists
- **THEN** the `AI Assistant` selector is disabled or empty
- **AND** the settings view shows an actionable message directing the user to enable a model first

#### Scenario: Selected assistant model persists
- **WHEN** the user selects an enabled model for `AI Assistant`
- **THEN** the selected provider and model are persisted as non-sensitive local feature settings
- **AND** the selection is restored after application reload

---

### Requirement: Prompt field generation service
The system SHALL provide a flexible prompt field generation service that can generate supported prompt edit fields from prompt content. The first supported fields SHALL be `title` and `description`.

#### Scenario: Title field generation is requested
- **WHEN** the user requests generation for the `title` field with non-empty prompt content
- **THEN** the system sends the prompt content to the configured assistant model using the title-generation system prompt
- **AND** returns a concise title string for the edit form

#### Scenario: Description field generation is requested
- **WHEN** the user requests generation for the `description` field with non-empty prompt content
- **THEN** the system sends the prompt content to the configured assistant model using the description-generation system prompt
- **AND** returns a short description string for the edit form

#### Scenario: Unsupported generated field is rejected
- **WHEN** code requests generation for a field that is not registered as supported
- **THEN** the system rejects the request with an actionable error and does not call the AI provider

#### Scenario: Empty prompt content blocks generation
- **WHEN** the user requests field generation while prompt content is empty or whitespace-only
- **THEN** the system shows an actionable validation error and does not call the AI provider

---

### Requirement: Hardcoded assistant prompts
The system SHALL define hardcoded system prompts for prompt title and prompt description generation in an isolated module, separate from React components and provider clients.

#### Scenario: Title prompt returns only a title
- **WHEN** the title-generation prompt is used
- **THEN** it instructs the model to return only the generated title with no explanation, Markdown fence, or extra metadata

#### Scenario: Description prompt returns only a description
- **WHEN** the description-generation prompt is used
- **THEN** it instructs the model to return only the generated description with no explanation, Markdown fence, or extra metadata

#### Scenario: Prompts are isolated for future editing
- **WHEN** future work adds user-editable assistant prompts
- **THEN** the hardcoded prompt definitions can be replaced or wrapped without changing prompt editor UI code

---

### Requirement: BYOK generation call behavior
The system SHALL perform prompt input assistant generation from the browser using the user's session-only provider API key and SHALL NOT persist raw API keys.

#### Scenario: Generation uses session-only credential
- **WHEN** the prompt input assistant calls OpenRouter
- **THEN** it uses the API key supplied by the user for the current browser session
- **AND** the key is not written to `localStorage`, IndexedDB, import/export payloads, Drive snapshots, logs, or test snapshots

#### Scenario: Missing session key blocks generation
- **WHEN** the user requests generation without a current session API key for the selected provider
- **THEN** the system shows an actionable error and does not call the provider

#### Scenario: Provider error is actionable
- **WHEN** OpenRouter returns an authentication, quota, rate-limit, network, CORS, provider, cancellation, or invalid-response error
- **THEN** the system shows an actionable error without exposing the API key

#### Scenario: Generation is explicit
- **WHEN** a user edits prompt content
- **THEN** the system does not send prompt content to an AI provider unless the user explicitly clicks a generation control
