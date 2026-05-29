## 1. Dependencies

- [x] 1.1 Install `fuse.js` runtime dependency (`pnpm add fuse.js`)
- [x] 1.2 Verify `fuse.js` types are available (included with the package)

## 2. Shared Utilities

- [x] 2.1 Create `src/shared/hooks/useDebounce.ts` — generic debounce hook with configurable delay

## 3. Search State in PromptsContext

- [x] 3.1 Add `searchQuery: string` state and `setSearchQuery` setter to `PromptsContext`
- [x] 3.2 Create a memoized `Fuse` instance in `PromptsContext`, keyed on `prompts` array changes, with config: keys `[{ name: 'title', weight: 2 }, { name: 'description', weight: 1 }]`, `threshold: 0.4`, `ignoreLocation: true`
- [x] 3.3 Derive `filteredPrompts` in `PromptsContext`: return all prompts when `searchQuery` is empty or ≤ 2 chars (substring fallback), otherwise return Fuse search results
- [x] 3.4 Expose `filteredPrompts`, `searchQuery`, and `setSearchQuery` on the context value type and object

## 4. PromptRow Component

- [x] 4.1 Create `src/features/prompts/PromptRow.tsx` — horizontal row layout showing `title` (bold), `description` (single line, truncated with ellipsis), and `tags` as `Badge` chips
- [x] 4.2 Wire click handler to select the prompt (same as `PromptCard`), including visual selection indicator for the active row
- [x] 4.3 Ensure `PromptRow` is responsive and spans full width

## 5. PromptListView Updates

- [x] 5.1 Add `viewMode` local state (`'grid' | 'list'`) initialized from `localStorage.getItem('promptViewMode') ?? 'grid'`
- [x] 5.2 Persist `viewMode` to `localStorage` on change (`useEffect` watching `viewMode`)
- [x] 5.3 Add a search bar input above the prompt list, wired to `setSearchQuery` via the `useDebounce` hook (150 ms delay)
- [x] 5.4 Add a view-mode toggle (grid/list icon buttons) in the toolbar, updating `viewMode` on click
- [x] 5.5 Update the rendering loop to use `filteredPrompts` from context instead of raw `prompts`
- [x] 5.6 Render `PromptCard` components when `viewMode === 'grid'`; render `PromptRow` components when `viewMode === 'list'`
- [x] 5.7 Add a "no search results" empty state distinct from the "no prompts yet" empty state (shown when `filteredPrompts` is empty but `prompts` is not)

## 6. Verification

- [x] 6.1 Verify fuzzy search surfaces results with 1–2 character typos in titles
- [x] 6.2 Verify fuzzy search matches on description text
- [x] 6.3 Verify search is case-insensitive
- [x] 6.4 Verify clearing the search input restores the full prompt list
- [x] 6.5 Verify switching to list view renders rows instead of cards
- [x] 6.6 Verify clicking a row opens the detail panel
- [x] 6.7 Verify view mode persists after page reload
- [x] 6.8 Run existing tests and confirm no regressions (`pnpm test`)
