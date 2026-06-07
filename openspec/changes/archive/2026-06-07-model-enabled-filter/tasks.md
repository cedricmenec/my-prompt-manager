## 1. UI state and filtering logic

- [x] 1.1 Add `onlyEnabled` boolean state to `ApiModelsSettingsView`
- [x] 1.2 Update `filteredModels` memo to compose enabled-only filter with text search

## 2. UI toggle control

- [x] 2.1 Add "Only enabled" checkbox next to the search input in the Models section
- [x] 2.2 Position and style the toggle to align with existing layout

## 3. Tests

- [x] 3.1 Add test: toggle filters to show only enabled models
- [x] 3.2 Add test: toggle is cumulative with text search
- [x] 3.3 Add test: toggle resets when component re-mounts (ephemeral)
