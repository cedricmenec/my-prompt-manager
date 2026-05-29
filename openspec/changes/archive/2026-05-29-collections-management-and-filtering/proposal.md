## Why

The sidebar currently displays "All Prompts", "Uncollected", and a list of "Collections" derived from prompt tags, but clicking them has no effect on the displayed prompt list. To make the application functional for users with many prompts, we need to implement operational filtering. Additionally, "managing" collections implies the ability to organize prompts into these categories.

## What Changes

- **Filtering Logic**: Move the `activeFilter` state from `SidebarNav` to `PromptsContext` so it can drive the `filteredPrompts` logic.
- **Combined Filtering**: Update `filteredPrompts` to apply both the active filter (All, Uncollected, or specific Tag) and the search query simultaneously.
- **Sidebar Integration**: Wire the `SidebarNav` buttons to update the `activeFilter` in `PromptsContext`.
- **Collection Management**: 
    - Ensure `PromptEditor` allows adding and removing tags (collections).
    - Add a `isFavorite` field to the `Prompt` schema and repository to support the "Favorites" filter in the sidebar.
    - Implement the "Favorites" toggle on `PromptCard` or `PromptDetailPanel`.
    - (Optional) Implement a simple global tag management (rename/delete tag) if scope allows, but priority is on operational filtering.

## Capabilities

### New Capabilities

- **`prompt-filtering`**: Ability to filter the prompt list by "Uncollected" (no tags), "Favorites", or a specific Tag (Collection).
- **`favorite-management`**: Ability to mark prompts as favorites and filter by them.

### Modified Capabilities

- **`prompts-context`**: Now owns the `activeFilter` state and computes `filteredPrompts` using both search and filter criteria.
- **`sidebar-navigation`**: Now functional; clicking items updates the global state.
- **`prompt-model`**: Added `isFavorite` boolean field.
- **`prompt-repository`**: Added `isFavorite` support in CRUD and indexing.

## Impact

- **`src/features/prompts/PromptsContext.tsx`**: Add `activeFilter` state, `SET_FILTER` action, and update `filteredPrompts` memo.
- **`src/features/layout/SidebarNav.tsx`**: Consume `activeFilter` and `dispatch` from context; remove local state.
- **`src/domain/promptSchema.ts`**: Add `isFavorite: z.boolean().default(false)` to `PromptSchema`.
- **`src/infrastructure/db.ts`**: Add `by-favorite` index to `prompts` store.
- **`src/features/prompts/PromptCard.tsx` / `PromptDetailPanel.tsx`**: Add favorite toggle (star icon).
- **`openspec/specs/prompt-model/spec.md`**: Update requirements to include `isFavorite`.
- **`openspec/specs/prompt-list-view/spec.md`**: Update to reflect that the list is filtered by the active sidebar selection.
