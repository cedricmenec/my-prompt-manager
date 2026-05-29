## 1. Extend PromptsContext with viewMode

- [x] 1.1 Add `viewMode: 'grid' | 'list'` and `setViewMode: (mode: 'grid' | 'list') => void` to the `PromptsContextValue` interface in `PromptsContext.tsx`
- [x] 1.2 Initialise `viewMode` state in `PromptsProvider` from `localStorage.getItem('promptViewMode')`, defaulting to `'grid'`
- [x] 1.3 Add a `useEffect` in `PromptsProvider` that persists `viewMode` to `localStorage` whenever it changes
- [x] 1.4 Add `viewMode` and `setViewMode` to the `PromptsContext.Provider` value object

## 2. Activate TopAppBar search input

- [x] 2.1 Remove the `readOnly` attribute from the search `<input>` in `TopAppBar.tsx`
- [x] 2.2 Add local `inputValue` state (`useState('')`) in `TopAppBar`
- [x] 2.3 Import and apply `useDebounce` (from `@/shared/hooks/useDebounce`) to produce a debounced query
- [x] 2.4 Add a `useEffect` in `TopAppBar` that calls `setSearchQuery(debouncedQuery)` whenever the debounced value changes
- [x] 2.5 Bind `value={inputValue}` and `onChange={(e) => setInputValue(e.target.value)}` on the search input
- [x] 2.6 Call `usePrompts()` in `TopAppBar` to get `setSearchQuery`

## 3. Activate TopAppBar view-toggle and remove filter buttons

- [x] 3.1 Call `usePrompts()` in `TopAppBar` to get `viewMode` and `setViewMode`
- [x] 3.2 Replace the local `activeView` state in `TopAppBar` with the context `viewMode`
- [x] 3.3 Wire the grid toggle `onClick` to `setViewMode('grid')` and the list toggle `onClick` to `setViewMode('list')`
- [x] 3.4 Remove the `filterButtons` array and the filter button `<button>` elements from `TopAppBar.tsx`
- [x] 3.5 Remove the local `useState` for `activeView` now that it's sourced from context

## 4. Simplify PromptListView

- [x] 4.1 Remove the toolbar `<div>` (search input + view-toggle buttons) from `PromptListView.tsx`
- [x] 4.2 Remove `inputValue` state, `debouncedQuery`, and the `useDebounce` import from `PromptListView.tsx`
- [x] 4.3 Remove the `useEffect` that called `setSearchQuery` from `PromptListView.tsx`
- [x] 4.4 Remove `viewMode` state, the `useEffect` that wrote it to `localStorage`, and the `GridIcon` / `ListIcon` components that are no longer used in the toolbar
- [x] 4.5 Read `viewMode` from `usePrompts()` instead of local state in `PromptListView.tsx`
- [x] 4.6 Remove unused imports (`useState`, `useEffect` if no longer needed, `useDebounce`, `setSearchQuery`) from `PromptListView.tsx`

## 5. Verify and clean up

- [x] 5.1 Run `tsc --noEmit` to confirm no TypeScript errors
- [x] 5.2 Start the dev server and verify: search input in TopAppBar filters the prompt list in real-time
- [x] 5.3 Verify: grid/list toggle in TopAppBar switches the view in PromptListView
- [x] 5.4 Verify: selected view mode persists after page reload
- [x] 5.5 Verify: no search input or view-toggle buttons appear inside PromptListView
- [x] 5.6 Verify: filter buttons ("Tags", "Language", "Favorites") are gone from the top bar
