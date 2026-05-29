## Why

The `TopAppBar` already renders a search field and view-toggle buttons, but they are disabled (readOnly / non-functional). A duplicate, fully functional toolbar was added inside `PromptListView` during the search & list-view implementation session, creating two competing sets of controls. This is confusing for the user and splits logic that should live in one place.

## What Changes

- Activate the search input in `TopAppBar` (remove `readOnly`, wire it to `PromptsContext`)
- Activate the view-toggle buttons in `TopAppBar` (wire them to real state, persist to `localStorage`)
- Remove the duplicate inline toolbar (search input + view-mode toggle) from `PromptListView`
- Remove the filter buttons ("Tags", "Language", "Favorites") from `TopAppBar` — they have never been functional and add visual noise; they can be reintroduced when filtering is implemented
- `PromptListView` becomes a pure display component: it receives `viewMode` (grid/list) and the already-filtered prompt list from context and renders accordingly
- No new dependencies; no breaking API changes

## Capabilities

### New Capabilities

*(none — this change only modifies existing capabilities)*

### Modified Capabilities

- `top-app-bar`: Search input and view-toggle buttons become fully functional (not deferred); filter buttons are removed until filtering is implemented
- `prompt-list-view`: Internal toolbar (duplicate search + view-mode toggle) is removed; component consumes `viewMode` and filtered prompts from context instead of owning that state
- `prompt-search`: Search bar location moves from inside `PromptListView` to `TopAppBar`; functional requirements remain the same

## Impact

- **`src/features/layout/TopAppBar.tsx`**: Remove `readOnly`, add `onChange` → dispatch search query; wire view-toggle `onClick` handlers; remove filter buttons
- **`src/features/prompts/PromptListView.tsx`**: Remove inline toolbar (`<div className="mb-4 …">`), `inputValue` / `debouncedQuery` state, `viewMode` state, and related `useEffect`s; consume `viewMode` from context or props
- **`src/features/prompts/PromptsContext.tsx`**: Expose `viewMode` / `setViewMode` alongside existing `searchQuery` / `setSearchQuery`
- **`openspec/specs/top-app-bar/spec.md`**: Update requirements to reflect functional search and view-toggle, removal of filter buttons
- **`openspec/specs/prompt-list-view/spec.md`**: Update requirements to remove the "view-mode toggle in list view toolbar" requirement
- **`openspec/specs/prompt-search/spec.md`**: Update to reflect search bar location in `TopAppBar`
