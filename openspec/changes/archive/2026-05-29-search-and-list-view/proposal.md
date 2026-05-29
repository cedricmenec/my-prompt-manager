## Why

As the number of saved prompts grows, finding a specific one by scrolling through a grid becomes tedious. Users need a way to quickly filter prompts by keyword with tolerance for typos (fuzzy search), and a compact list layout for power users who prefer dense information display.

## What Changes

- Add a search bar to the prompt list view that filters prompts in real-time using fuzzy matching on `title` and `description`.
- Add a list view layout as an alternative to the existing grid view, showing prompts as rows with more metadata visible.
- Add a view-mode toggle (grid / list) that persists the user's preference across sessions (localStorage).

## Capabilities

### New Capabilities
- `prompt-search`: Real-time fuzzy search bar that filters the displayed prompt list by title and description, with tolerance for approximate matches (e.g., "tempate" matches "template").

### Modified Capabilities
- `prompt-list-view`: Extended to support two display modes (grid and list), a view-mode toggle control, and integration with the search filter so only matching prompts are displayed.

## Impact

- **`src/features/prompts/PromptListView.tsx`**: Add search input, view-mode toggle, and conditional rendering for list vs grid layout.
- **`src/features/prompts/PromptCard.tsx`**: May need a list-row variant for the list view.
- **`src/features/prompts/PromptsContext.tsx`**: Add `searchQuery` state and filtered prompts derived value.
- **New dependency**: A lightweight fuzzy-search library (e.g., `fuse.js`) or a hand-rolled implementation for client-side fuzzy matching.
- **localStorage**: Persist view mode preference (`promptViewMode` key).
- No backend, server, or data model changes required.
