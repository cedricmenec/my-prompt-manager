## Context

The app is a static, local-first React/Vite prompt manager. Structured prompt data is stored in IndexedDB and AI provider/model metadata was recently introduced through the `add-ai-provider-model-settings` change: OpenRouter can be configured with a session-only API key to load a model catalog, and users can enable a subset of models for app use.

The current prompt editor still exposes a prompt-level `model` text field. That field is no longer useful because model selection is becoming an app feature configuration concern rather than prompt metadata. The Settings dialog also uses content-driven height (`max-h` with outer scrolling), so it visually shifts when switching categories or when model catalog data appears.

This change builds the first app-level AI feature on top of the enabled-model foundation: a prompt input assistant that generates title and description values from prompt content. It must preserve the BYOK/local-first contract: no backend, no shared key, no persisted raw API key, and explicit user-owned API usage.

## Goals / Non-Goals

**Goals:**

- Add an `AI Features` settings category with a `Prompt input assistant` section.
- Persist the selected model for the prompt input assistant as non-sensitive local configuration.
- Generate prompt `title` and `description` from prompt `content` using a flexible field-generation service.
- Keep hardcoded generation system prompts isolated so they can later become editable.
- Share session-only provider credentials outside the settings view without persisting them.
- Remove the prompt-level `model` field from domain schema, edit/read UI, serialization, import/export expectations, and legacy data flow.
- Normalize user-facing application interface text to English.
- Stabilize Settings dialog dimensions and keep scrolling inside the content area.

**Non-Goals:**

- Do not add a backend, serverless proxy, shared API key, telemetry, or analytics.
- Do not persist raw API keys until a dedicated encrypted vault exists.
- Do not implement a UI for editing AI system prompts in this change.
- Do not implement AI generation for tags, notes, image fields, or prompt content yet.
- Do not support providers beyond the currently supported OpenRouter runtime path.
- Do not silently overwrite saved prompts; generated field values update the edit form and are persisted only when the user saves.

## Decisions

### AI feature settings are separate from enabled models

Store app-feature configuration separately from the provider model catalog and enabled-model set. Add a small generic record shape such as:

```ts
type AiFeatureId = 'prompt-input-assistant'

type AiFeatureSettings = {
  featureId: AiFeatureId
  providerId: string
  modelId: string
  createdAt: string
  updatedAt: string
}
```

The `Prompt input assistant` view reads enabled models and persists exactly one selected text-capable model for this feature. This avoids overloading `enabledAiModels`: enabled models answer “available in the app”, while feature settings answer “used by this feature”.

Alternative considered: use the first enabled model automatically. That creates surprising behavior when multiple models are enabled and gives users no stable control over cost/quality trade-offs.

### Provider credentials become session-scoped shared state

The existing OpenRouter API key is session-only and currently held inside `ApiModelsSettingsView`. Generation from `PromptView` needs access to the same user-provided key, so introduce a session-only credential holder, likely a React context/provider near app bootstrap or an infrastructure module backed only by memory.

The key must not be written to `localStorage`, IndexedDB, import/export files, Drive snapshots, logs, or test snapshots. A page reload clears it. Missing key produces an actionable error in generation flows.

Alternative considered: persist the key in IndexedDB for convenience. This violates the BYOK guidance until an encrypted vault exists.

### Generation uses an isolated OpenRouter text client

Create a separate client for OpenRouter generation, distinct from the model-list client. The client should accept `{ apiKey, modelId, messages, signal }`, call the OpenRouter chat/completions-compatible endpoint from the browser, normalize the text response, and map missing-key, authorization, quota, rate-limit, network/CORS, cancellation, provider, and invalid-response failures to actionable errors without exposing the API key.

Use `AbortController` so the UI can cancel or at least ignore stale requests when the prompt changes or the component unmounts.

Alternative considered: call `fetch` directly from `PromptView`. That would mix UI state, provider protocol, error mapping, and prompt construction in one large component.

### Field generation is registry-driven

Introduce a registry for generated fields rather than hardcoding two button handlers:

```ts
type PromptGeneratedFieldId = 'title' | 'description'

type PromptGeneratedFieldDefinition = {
  fieldId: PromptGeneratedFieldId
  label: string
  systemPrompt: string
  buildUserPrompt(input: { content: string }): string
  normalize(text: string): string
}
```

`title` and `description` are the first entries. The service receives a field ID and prompt content, builds messages from the registry, calls the configured model, normalizes the result, and returns a string for the edit form. This keeps future generated fields such as tags or notes additive.

Alternative considered: generate title and description in one request. Separate actions match the user’s requested buttons, keep overwrite intent explicit, and simplify retries.

### Hardcoded system prompts are isolated and documented as deferred-editable

Store the first system prompts in a dedicated module, for example `src/domain/promptInputAssistantPrompts.ts` or `src/infrastructure/promptGenerationPrompts.ts`. They should instruct the model to return only the requested field value, avoid Markdown fences, avoid explanations, and derive values solely from provided prompt content.

Add `deferred-features.md` coverage for a future UI that lets users view/edit/version these system prompts.

Alternative considered: place prompt strings inline in `PromptView`. That would make future prompt editing and tests harder.

### Prompt `model` removal is a data-model migration

Remove `model` from the Zod schema and all UI/read/write paths. Legacy imported or persisted records with `model` should continue to load by relying on schema stripping or an explicit migration that drops the field. Markdown serialization should no longer emit `model`; parsing old frontmatter with `model` should ignore it.

The existing `temperature` field remains because the user only requested removing `model`.

Alternative considered: hide `model` in UI but keep it in schema for compatibility. That leaves dead data in exports and continues to imply a per-prompt model behavior the app no longer supports.

### Settings dialog has a fixed responsive frame

Change the modal panel from content-sized outer scrolling to a stable frame, for example `h-[min(42rem,92vh)] w-full max-w-5xl`, with an internal layout like `grid grid-rows-[auto_1fr]`. The sidebar/content region should use `min-h-0`, and only the active content pane should scroll. The overlay remains centered and fixed.

Alternative considered: set only `min-height`. That reduces small jumps but still allows the dialog to grow when large model tables render.

### Interface text is English

All user-facing labels, buttons, status messages, validation errors, empty states, modal text, and toasts should be in English. This includes existing non-English strings encountered while implementing this change, such as prompt image reference labels. Stored user prompt content and user-provided metadata are not translated.

Alternative considered: localize via i18n infrastructure. That is unnecessary until multiple interface languages are supported.

## Risks / Trade-offs

- Missing session key during generation -> Show a clear error directing the user to enter the OpenRouter key for the current session.
- Enabled model is deleted or disabled after feature selection -> Treat the feature as unconfigured and ask the user to select another enabled model.
- Browser CORS or provider compatibility prevents generation -> Surface provider/network errors without losing local form data.
- Generated text overwrites user edits unexpectedly -> Only run on explicit magic-wand click and update the edit form, leaving final persistence to Save.
- Prompt content may include sensitive data -> Make generation explicit and do not auto-send content; BYOK provider calls are user-triggered.
- Legacy `model` data disappears from exports -> This is intentional and breaking; old imports should still parse, but future exports omit the field.
- Global English cleanup could broaden scope -> Keep implementation focused on visible app strings and tests for known non-English labels.

## Migration Plan

1. Add the AI feature settings store or extend the existing AI provider settings repository with generic feature settings records.
2. Bump the IndexedDB version if a new store is added.
3. Add migration logic or schema behavior that drops legacy prompt `model` fields from persisted/imported prompt records.
4. Update import/export and Markdown serialization tests so future exports omit `model` and old frontmatter with `model` remains accepted.
5. Rollback is limited to hiding the new AI feature UI; the removed prompt `model` field would not be restored from migrated records unless a backup/import still contains it.

## Open Questions

- Should generation buttons replace non-empty fields immediately, or should the UI ask for confirmation when the target field already contains text?
- Should the prompt input assistant select the first enabled text model by default when no feature setting exists, or require explicit selection?
