## Context

The app has a `TopAppBar` component that already renders a search field and view-toggle buttons, but both are disabled (search is `readOnly`, view-toggle has no `onClick`). During the search & list-view implementation, a fully functional duplicate toolbar was added inside `PromptListView`, which owns `viewMode` state (persisted to `localStorage`) and `inputValue` / debounced query state. This creates two toolbar UIs and splits state that should be shared.

`PromptsContext` already exposes `searchQuery` / `setSearchQuery` and `filteredPrompts`. `viewMode` is currently owned locally by `PromptListView`.

## Goals / Non-Goals

**Goals:**
- Activate `TopAppBar` as the single search + view-toggle control surface
- Move `viewMode` state out of `PromptListView` and into `PromptsContext`
- Remove the duplicate toolbar inside `PromptListView`
- Remove the non-functional filter buttons from `TopAppBar`
- Zero new dependencies

**Non-Goals:**
- Implementing tag / language / favorites filtering (deferred)
- Changing the fuzzy-search algorithm or threshold
- Changing the layout of `MainLayoutShell` or `SidebarNav`

## Decisions

### D1: `viewMode` lives in `PromptsContext`

**Decision**: Add `viewMode: 'grid' | 'list'` and `setViewMode` to `PromptsContext`, initialised from `localStorage` (`promptViewMode`) with `'grid'` as default. A `useEffect` in the provider persists changes back to `localStorage`.

**Alternatives considered**:
- Keep `viewMode` in `TopAppBar` and pass it down as a prop — rejected because `PromptListView` would require prop-drilling through `MainLayoutShell`, coupling layout and feature layers.
- Lift to a separate `ViewModeContext` — over-engineering for a single boolean-like value; `PromptsContext` is the natural shared home.

### D2: Debouncing stays in `TopAppBar`, not in `PromptsContext`

**Decision**: `TopAppBar` owns local `inputValue` state and uses `useDebounce` to call `setSearchQuery` on the debounced value. `PromptsContext` stores only the final debounced query.

**Alternatives considered**:
- Debounce inside the provider — the provider would need to hold both raw and debounced values, adding complexity.
- No debounce at `TopAppBar` level — would cause excessive re-renders for every keystroke before Fuse processes results.

### D3: Remove filter buttons entirely (not hide)

**Decision**: Delete the filter button markup from `TopAppBar`. They were never wired and add visual noise.

**Rationale**: Hiding with `display: none` would leave dead code. A future filtering feature will introduce its own design; keeping placeholder buttons would make the design misleading.

### D4: `PromptListView` becomes a pure display component

**Decision**: `PromptListView` reads `viewMode` and `filteredPrompts` from `usePrompts()` and renders the grid or list. It drops all owned state (`inputValue`, `debouncedQuery`, `viewMode`) and all `useEffect`s related to them.

**Rationale**: Removes the duplication and makes the component easier to test (it has no search or persistence side-effects).

## Risks / Trade-offs

- **Debounce in TopAppBar loses input on remount** → Acceptable: `TopAppBar` is mounted for the lifetime of the app shell; it will never unmount during normal navigation.
- **PromptsContext grows slightly** → Low risk; adding two fields (`viewMode`, `setViewMode`) to an already-established context is non-breaking and backwards-compatible.
- **localStorage key `promptViewMode` is now written by PromptsContext instead of PromptListView** → No migration needed; same key, same values, same default.

## Migration Plan

1. Add `viewMode` + `setViewMode` to `PromptsContext` (with `localStorage` init + persist effect)
2. Update `TopAppBar`: remove `readOnly`, add local `inputValue` + `useDebounce` → `setSearchQuery`; wire view-toggle to `viewMode` / `setViewMode` from context; remove filter buttons
3. Update `PromptListView`: remove toolbar div, remove owned state and effects; consume `viewMode` from `usePrompts()`
4. Verify no TypeScript errors; confirm the app renders correctly end-to-end

No rollback complexity — all changes are isolated to three files.

## Open Questions

*(none)*
