## Why

The Settings dialog is currently a single monolithic view, which makes it difficult to add BYOK AI provider configuration without further crowding import/export and Google Drive controls.
The app needs a foundation for configuring AI providers and selecting usable models while preserving the local-first, static-only, BYOK architecture.

## What Changes

- Restructure the Settings dialog into a two-column layout with a left sidebar and a main content area.
- Move the current Settings content unchanged into a `Legacy` settings section for later cleanup.
- Add an `API & Models` settings section focused on AI provider configuration and model selection.
- Introduce a provider registry structure that initially enables OpenRouter and leaves room for future API providers and local providers.
- Allow users to enter an OpenRouter API key for the current browser session and use it to load the provider model catalog.
- Show an OpenRouter key acquisition link near the API key input.
- Store provider connection metadata, fetched model catalog entries, and user-enabled models in IndexedDB.
- Let users search OpenRouter models and select one or more models to make available elsewhere in the app.
- Defer encrypted API key persistence to a future Encrypted Vault change; the first version must not store API keys in clear text.

## Capabilities

### New Capabilities

- `ai-provider-model-settings`: Covers BYOK AI provider configuration, OpenRouter model catalog loading, model search, and enabled model persistence.

### Modified Capabilities

- `settings-panel`: Adds settings section navigation, preserves the existing settings content under `Legacy`, and exposes the new `API & Models` section.

## Impact

- Affected UI: `src/features/settings/SettingsPanel.tsx` and likely new settings subcomponents.
- Affected storage: `src/infrastructure/db.ts`, data migration/versioning, and a new repository for provider/model settings.
- Affected integrations: a new OpenRouter client module for listing models from the browser.
- Affected tests: settings panel navigation, provider/model repository behavior, OpenRouter response normalization, and model selection UI.
- No backend, server secret, or shared platform credential is introduced.
