## 1. Data Model and Storage

- [x] 1.1 Add typed AI provider connection, provider model, and enabled model records.
- [x] 1.2 Bump IndexedDB version and create `aiProviderConnections`, `aiProviderModels`, and `enabledAiModels` stores.
- [x] 1.3 Implement an AI provider settings repository for saving non-sensitive provider metadata, cached models, and enabled model selections.
- [x] 1.4 Add repository tests covering catalog caching, enabled model persistence, reload restoration, and API key exclusion from storage.

## 2. OpenRouter Integration

- [x] 2.1 Add static AI provider definitions with OpenRouter enabled and future API/local providers represented as planned.
- [x] 2.2 Implement an OpenRouter models client that calls the models endpoint with bearer authentication.
- [x] 2.3 Normalize OpenRouter model records into app-owned model records with name, origin provider, modality, pricing placeholder, and fetch timestamp.
- [x] 2.4 Add tests for OpenRouter response normalization and error handling without exposing API keys.

## 3. Settings Panel Restructure

- [x] 3.1 Split the Settings panel into a shell with sidebar navigation and active content rendering.
- [x] 3.2 Move the existing Settings content into a `Legacy` view without changing existing import/export or Google Drive behavior.
- [x] 3.3 Add an `API & Models` view entry to the Settings sidebar.
- [x] 3.4 Update Settings panel tests to cover category navigation and existing close behavior.

## 4. API and Models View

- [x] 4.1 Build the provider selector with OpenRouter selectable and planned providers disabled or otherwise non-configurable.
- [x] 4.2 Add the OpenRouter API key field, session-only key handling, and the OpenRouter key acquisition link.
- [x] 4.3 Add model loading UI states for idle, loading, success, validation error, and provider/network error.
- [x] 4.4 Render the searchable model table with model name, origin provider, and reserved token cost column.
- [x] 4.5 Implement multi-model selection and persist enabled model changes to IndexedDB.
- [x] 4.6 Add UI tests for missing-key validation, model search, multi-selection, and persistence reload.

## 5. Documentation and Verification

- [x] 5.1 Update project documentation or `deferred-features.md` with the new API provider/model settings behavior.
- [x] 5.2 Add a Deferred note: Encrypted Vault persistence for API keys is intentionally deferred and must be implemented before offering persistent BYOK secrets.
- [x] 5.3 Run unit tests for settings, storage, and OpenRouter integration.
- [x] 5.4 Run the production build to verify the static app still builds.

