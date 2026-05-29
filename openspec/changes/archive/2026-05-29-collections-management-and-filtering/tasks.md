## 1. Domain and Infrastructure Updates

- [x] 1.1 Update `PromptSchema` in `src/domain/promptSchema.ts` to include `isFavorite: z.boolean().optional().default(false)`
- [x] 1.2 Update `db.ts` to add `by-favorite` index and increment `DB_VERSION` to `2`
- [x] 1.3 Verify `promptRepository.update` works with the new field (existing generic update should handle it)

## 2. Extend PromptsContext with Filtering

- [x] 2.1 Define `PromptFilter` type in `PromptsContext.tsx`: `{ type: 'all' | 'favorites' | 'uncollected' | 'tag', value?: string }`
- [x] 2.2 Add `activeFilter` state and `setActiveFilter` to `PromptsContext`
- [x] 2.3 Update `filteredPrompts` memo in `PromptsContext.tsx` to apply `activeFilter` before `searchQuery`
- [x] 2.4 Add `SET_FILTER` action to the reducer if needed, or just use `useState` if it's simpler (current context uses a mix)

## 3. Make SidebarNav Functional

- [x] 3.1 Call `usePrompts()` in `SidebarNav.tsx` to get `activeFilter` and `setActiveFilter` (or dispatch)
- [x] 3.2 Remove local `activeNav` state from `SidebarNav.tsx`
- [x] 3.3 Wire "All Prompts", "Favorites", and "Uncollected" links to update the global filter
- [x] 3.4 Wire individual collection (tag) items to update the filter to `{ type: 'tag', value: tagName }`
- [x] 3.5 Ensure active state styling uses the global `activeFilter`

## 4. UI for Favorites and Tags

- [x] 4.1 Add a favorite toggle (star icon) to `PromptCard.tsx` or `PromptDetailPanel.tsx` (prefer `PromptDetailPanel` for now to avoid cluttering cards, or both)
- [x] 4.2 Update `PromptEditor.tsx` to include an input for tags
- [x] 4.3 Implement tag adding/removing logic in `PromptEditor.tsx`

## 5. Verification

- [x] 5.1 Verify clicking sidebars filters the list correctly
- [x] 5.2 Verify "Uncollected" shows only prompts with no tags
- [x] 5.3 Verify search works within the active filter
- [x] 5.4 Verify favorite status is persisted and correctly filtered
- [x] 5.5 Verify tags can be added/removed in the editor and update the collections list in the sidebar
