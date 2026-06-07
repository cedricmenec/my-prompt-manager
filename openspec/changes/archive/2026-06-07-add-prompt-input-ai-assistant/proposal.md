## Why

Prompt editing currently requires users to manually derive a title and description from prompt content, even after AI provider and enabled-model settings have been introduced. The Settings dialog also changes height as categories and model lists render, and the prompt-level `model` field is no longer useful for the app's prompt data model.

## What Changes

- Add an AI Features settings category for configuring app-level AI-assisted workflows.
- Add the first AI feature, `Prompt input assistant`, which can generate a prompt title or description from prompt content.
- Add an `AI Assistant` model selector that uses one of the enabled text-capable models from the existing provider/model foundation.
- Add small magic-wand action buttons next to the prompt edit `Title` and `Description` fields to generate those field values from the current prompt content.
- Introduce hardcoded system prompts for title and description generation behind a flexible field-generation service.
- Ensure the application interface is in English.
- Make the Settings dialog height and position stable, with scrolling constrained to the settings content area.
- **BREAKING** Remove the prompt-level `model` field from the prompt schema, editor, repository payloads, Markdown serialization, import/export expectations, and prompt display surfaces.
- Add a deferred feature note for future editing of AI system prompts.

## Capabilities

### New Capabilities
- `interface-language`: Covers the requirement that user-facing application interface text is English.
- `prompt-input-ai-assistant`: Covers app-level AI feature configuration and generating prompt title/description values from prompt content.

### Modified Capabilities
- `settings-panel`: Adds the AI Features settings category and stable dialog sizing behavior.
- `prompt-view`: Adds AI generation controls to edit mode and removes the prompt `model` field from edit/read surfaces.
- `prompt-model`: Removes the prompt-level `model` field from the canonical prompt data shape and Markdown/frontmatter contract.

## Impact

- Affected UI: all user-facing application views for English text normalization; `SettingsPanel`, settings subviews, `PromptView`, and prompt read/edit field rendering for functional changes.
- Affected storage: IndexedDB schema and repository support for per-feature AI model selection; prompt records no longer include `model`.
- Affected integrations: OpenRouter generation calls from the browser using the user's session-only BYOK credential.
- Affected domain logic: `PromptSchema`, Markdown parse/serialize, import/export validation, and migration handling for legacy `model` values.
- Affected tests: settings navigation/layout, AI feature configuration persistence, generation client/service behavior, prompt editor buttons, prompt schema, import/export, repository behavior, and UI text checks for known non-English labels.
- No backend, shared platform secret, analytics, or server-side credential storage is introduced.
