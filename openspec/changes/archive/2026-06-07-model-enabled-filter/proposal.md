## Why

The model catalog from OpenRouter can contain hundreds of models. After selecting a handful of enabled models, it becomes difficult to quickly identify which models are enabled vs disabled when scrolling through the full list. A simple "only enabled" toggle lets the user filter down to just their active models for quick review and management.

## What Changes

- Add a checkbox toggle "Only enabled" next to the model search field in the `API & Models` settings section
- When toggled on, the model table shows only models whose checkbox is checked (enabled)
- The toggle is cumulative with the existing text search filter (both apply simultaneously)
- The toggle is ephemeral — it resets to unchecked when the settings panel is reopened (React state only, no persistence)

## Capabilities

### New Capabilities

<!-- None -->

### Modified Capabilities

- `ai-provider-model-settings`: Add an "enabled-only" display filter to the model selection table. This modifies the model search and selection requirement to include a toggleable filter for showing only enabled models.

## Impact

- `src/features/settings/ApiModelsSettingsView.tsx` — add `onlyEnabled` state and update `filteredModels` memo
- No changes to IndexedDB schema, repository layer, or other components
- No breaking changes
