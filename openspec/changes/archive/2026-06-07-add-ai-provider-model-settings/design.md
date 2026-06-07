## Context

The app is a static, local-first React/Vite application with IndexedDB as the source of truth for structured data. The current `SettingsPanel` is a single React component that contains import/export, Google Drive configuration, Drive import/export, snapshots, and a placeholder API Keys section.

The project context already identifies BYOK AI features as a goal, with session-only API keys by default and encrypted persistence as a later option. This change establishes the UI and data foundation for AI provider/model configuration, with OpenRouter as the first supported provider.

## Goals / Non-Goals

**Goals:**

- Introduce a reusable Settings layout with sidebar navigation and content views.
- Preserve all existing settings behavior under a `Legacy` view.
- Add an `API & Models` view for provider selection, API key entry, OpenRouter model loading, search, and model enablement.
- Define provider/model storage in IndexedDB so future API providers and local providers can be added without reworking the schema.
- Keep API keys session-only for this change and avoid clear-text persistence.

**Non-Goals:**

- Do not implement AI generation actions in prompt views.
- Do not persist API keys across reloads.
- Do not implement the Encrypted Vault in this change.
- Do not support providers other than OpenRouter at runtime yet.
- Do not implement token cost formatting beyond reserving a column/field for future pricing information.

## Decisions

### Settings UI uses a shell plus view components

Create a `SettingsPanel` shell with a left navigation rail and a right content area. Move the current settings content into a `LegacySettingsView` component, keeping existing handlers and behavior intact. Add `ApiModelsSettingsView` for provider/model configuration.

Alternatives considered:
- Keep adding sections to the current single view. This would make settings harder to scan and would not create the category structure requested.
- Create a separate modal for API providers. This would avoid touching the current panel but would fragment app-level settings.

### Provider definitions are declarative and separate from user data

Define static provider metadata in code, starting with OpenRouter:

```ts
type AiProviderDefinition = {
  id: string
  label: string
  kind: 'api' | 'local'
  status: 'supported' | 'planned'
  baseUrl?: string
  modelListUrl?: string
  apiKeyUrl?: string
  supportsTextModels: boolean
  supportsImageModels: boolean
}
```

The UI can render planned providers as disabled options while only OpenRouter is enabled.

Alternatives considered:
- Store all providers as user-editable rows immediately. That is more flexible but adds validation and endpoint-shape complexity before a second provider exists.

### IndexedDB stores provider metadata and selected models

Bump the IndexedDB version and add stores for provider connections, cached models, and enabled models:

```ts
aiProviderConnections
aiProviderModels
enabledAiModels
```

The connection store holds non-sensitive provider configuration and sync metadata. The model store caches normalized model catalog entries. The enabled-model store records the user-selected subset available elsewhere in the app.

Alternatives considered:
- Use `localStorage`, as Google Drive config currently does. This is not appropriate for structured model catalogs and increases the risk of accidentally persisting sensitive material.
- Store only enabled model IDs without a catalog cache. This would force repeated network calls and make the model picker unavailable offline after a previous sync.

### API key handling is session-only in this change

The OpenRouter key is kept in React state for the current settings session and used only to fetch the model catalog. It is not written to `localStorage`, IndexedDB, logs, import/export payloads, or Drive snapshots.

Encrypted persistence is intentionally deferred until a dedicated vault exists.

Alternatives considered:
- Persist the key in plain IndexedDB for convenience. This violates BYOK security guidance.
- Block provider work until the vault exists. That would delay useful provider/model selection foundations that do not require persistent secrets.

### OpenRouter integration is isolated

Create an OpenRouter infrastructure client that fetches `GET https://openrouter.ai/api/v1/models` with `Authorization: Bearer <key>` and normalizes model data for the app. The UI consumes normalized records rather than OpenRouter raw payloads.

Alternatives considered:
- Fetch directly in the React component. This would mix network, error mapping, and rendering logic.

## Risks / Trade-offs

- API key is lost after reload -> make the session-only behavior visible near the key field and document the future vault work.
- OpenRouter model list can be large -> keep search client-side over normalized records and avoid rendering unnecessary decorative UI.
- OpenRouter response shape may evolve -> keep the raw payload optional on cached model records and normalize through one adapter.
- Browser CORS or network errors may prevent catalog loading -> surface actionable errors and keep any existing cached model list visible when available.
- Future local providers have different discovery mechanisms -> provider definitions include `kind`, `baseUrl`, and status fields, while runtime support remains OpenRouter-only for this change.

## Migration Plan

1. Bump `DB_VERSION` and create the new object stores when upgrading from the current schema.
2. Keep existing prompt, metadata, and image asset stores unchanged.
3. No data backfill is required because provider/model settings are new.
4. Rollback is limited to hiding the new UI; existing prompt and Drive data are unaffected.

## Open Questions

- Should planned providers be visible but disabled in the first UI, or should only OpenRouter be shown until additional providers are implemented?
- Should the OpenRouter model catalog be loaded only on an explicit refresh button, or automatically after a non-empty key is entered?
- Which cost fields should be normalized once token pricing is implemented?
