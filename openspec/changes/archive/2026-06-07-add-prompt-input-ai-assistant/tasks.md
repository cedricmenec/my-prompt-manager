## 1. Prompt Data Model Cleanup

- [x] 1.1 Remove `model` from `PromptSchema`, `Prompt` typing expectations, and prompt creation/update payloads.
- [x] 1.2 Update Markdown parsing and serialization so legacy `model` frontmatter is accepted but future serialization omits `model`.
- [x] 1.3 Update import/export validation and fixtures so imported legacy `model` values are stripped and exported prompts do not contain `model`.
- [x] 1.4 Add or update data migration behavior to remove `model` from existing persisted prompt records without affecting other fields.
- [x] 1.5 Update prompt model, markdown parser, repository, import/export, and migration tests for the removed field.

## 2. AI Feature Settings Storage

- [x] 2.1 Add a typed AI feature settings record for `prompt-input-assistant` with provider ID, model ID, and timestamps.
- [x] 2.2 Bump IndexedDB schema version and create any new store/indexes required for AI feature settings.
- [x] 2.3 Extend the AI provider settings repository or add a focused repository for saving and loading per-feature model selections.
- [x] 2.4 Add repository tests covering save, reload, disabled/deleted model handling, and API key exclusion from storage.

## 3. Session BYOK Credential Sharing

- [x] 3.1 Introduce a session-only credential holder for provider API keys that is available to both Settings and prompt generation code.
- [x] 3.2 Update the OpenRouter key settings flow to write the key to session memory only, without persisting it.
- [x] 3.3 Add tests proving raw API keys are not written to IndexedDB, localStorage, import/export payloads, Drive snapshots, logs, or rendered messages.

## 4. OpenRouter Generation Infrastructure

- [x] 4.1 Add an isolated OpenRouter text generation client separate from the model catalog client.
- [x] 4.2 Normalize successful generation responses into plain text output.
- [x] 4.3 Map missing-key, authorization, quota, rate-limit, network/CORS, cancellation, provider, and invalid-response failures to actionable errors without exposing API keys.
- [x] 4.4 Add unit tests for request shape, bearer authentication, response normalization, abort behavior, and error mapping.

## 5. Prompt Input Assistant Service

- [x] 5.1 Add hardcoded title and description system prompts in an isolated module.
- [x] 5.2 Add a registry for supported generated prompt fields starting with `title` and `description`.
- [x] 5.3 Implement a prompt field generation service that validates content, resolves configured model settings, uses session credentials, calls OpenRouter, and normalizes field output.
- [x] 5.4 Add tests for title generation, description generation, empty content validation, unsupported field rejection, missing model selection, and missing session key.

## 6. AI Features Settings UI

- [x] 6.1 Add `AI Features` to the Settings sidebar and render the `Prompt input assistant` settings section.
- [x] 6.2 Render an `AI Assistant` select populated only with enabled text-capable or multimodal models.
- [x] 6.3 Persist selected assistant model settings and restore them after reload.
- [x] 6.4 Show an actionable empty state when no eligible enabled model is available.
- [x] 6.5 Add UI tests for navigation, model filtering, selection persistence, and empty-state behavior.

## 7. Stable Settings Dialog Layout

- [x] 7.1 Replace content-sized Settings dialog behavior with a fixed responsive frame and internal scrolling.
- [x] 7.2 Ensure category switches and model list loading do not change the outer dialog height or position.
- [x] 7.3 Add or update tests for Settings category switching and content overflow behavior.

## 8. PromptView AI Generation UI

- [x] 8.1 Remove the prompt-level `model` input from PromptView edit mode and remove `model` display from read/detail surfaces.
- [x] 8.2 Add small icon-style magic-wand controls next to the `Title` and `Description` labels in edit mode.
- [x] 8.3 Wire each generation control to the prompt field generation service and update only the target edit form field.
- [x] 8.4 Add loading, duplicate-click prevention, success, and actionable error states without auto-saving the prompt.
- [x] 8.5 Add PromptView tests for generated title, generated description, missing content, missing configuration, provider error, and no auto-save behavior.

## 9. English Interface Text

- [x] 9.1 Audit user-facing labels, buttons, validation errors, toast messages, modal text, empty states, and tooltips for non-English text.
- [x] 9.2 Replace non-English built-in interface text with English text while leaving user-authored prompt data unchanged.
- [x] 9.3 Add focused regression tests or assertions for known non-English labels removed by this change.

## 10. Documentation and Deferred Features

- [x] 10.1 Update `deferred-features.md` with the future UI for viewing/editing/versioning AI assistant system prompts.
- [x] 10.2 Update project documentation if needed to explain session-only BYOK generation behavior and prompt `model` removal.

## 11. Verification

- [X] 11.1 Run the relevant unit and UI test suites.
- [X] 11.2 Run the production build.
- [X] 11.3 Manually verify Settings fixed height, AI Features configuration, title generation, description generation, prompt save behavior, and legacy prompt import without `model` persistence.
