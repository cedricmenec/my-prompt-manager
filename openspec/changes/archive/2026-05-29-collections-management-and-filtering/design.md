## Context

The `SidebarNav` component displays a primary navigation section ("All Prompts", "Favorites", "Uncollected") and a "Collections" section derived from prompt tags. Currently, clicking these buttons only updates a local `activeNav` state within `SidebarNav`, and has no effect on the `PromptListView`.

The `PromptsContext` handles searching via `Fuse.js` but does not support category-based filtering. The user wants to be able to filter the prompt list by selecting a collection, viewing all prompts, or viewing uncollected prompts (those without tags).

Additionally, the "Favorites" functionality is placeholder only as the `Prompt` schema lacks a favorite flag.

## Goals / Non-Goals

**Goals:**
- Enable functional filtering in the prompt list based on sidebar selection.
- Implement "Favorites" as a first-class feature (flag on prompt, filterable in sidebar).
- Add support for managing tags (collections) via the `PromptEditor`.
- Ensure search and category filtering work together.

**Non-Goals:**
- Implementing a separate `Collection` entity if tags can serve the purpose (per existing spec).
- Implementing global tag renaming/deletion in this first pass (keep it simple: manage tags on prompts).
- Changing the sidebar layout or visual design.

## Decisions

### D1: `activeFilter` in `PromptsContext`

**Decision**: Add `activeFilter` to `PromptsContext`.
Type: `{ type: 'all' | 'favorites' | 'uncollected' | 'tag', value?: string }`.
Default: `{ type: 'all' }`.

**Rationale**: `PromptListView` and `SidebarNav` need to share this state to keep the UI in sync. `PromptsContext` already handles filtering (search), so it's the logical place for category filtering too.

### D2: Sequential Filtering logic

**Decision**: The `filteredPrompts` memo will first filter by `activeFilter`, then apply the `searchQuery` via `Fuse.js`.

**Rationale**: If a user selects a collection and then searches, they expect to search *within* that collection.

### D3: Update `Prompt` schema and DB to support Favorites

**Decision**: Add `isFavorite: boolean` (optional, default false) to `PromptSchema`. Add an index `by-favorite` in IndexedDB.

**Rationale**: Favorites are a common and expected feature in prompt managers. The sidebar already has a slot for it.

### D4: Manage tags via `PromptEditor`

**Decision**: Update `PromptEditor` to allow adding/removing tags. Tags act as the "Collections".

**Rationale**: This fulfills the "gestion des collections" requirement without adding the complexity of a separate entity management system.

## Risks / Trade-offs

- **Performance of multi-step filtering**: With large prompt sets, two filters might be slow. However, with client-side only data (typically < 1000 prompts), the performance impact is negligible.
- **Tag collisions**: Since collections are just tags, if a user uses "Favorite" as a tag, it might collide with the system "Favorites". *Mitigation*: We treat system filters (Favorites, Uncollected) as distinct from Tag filters.

## Migration Plan

1. Update `src/domain/promptSchema.ts` to include `isFavorite`.
2. Update `src/infrastructure/db.ts` to add the `by-favorite` index (requires DB version bump).
3. Update `src/features/prompts/PromptsContext.tsx`:
    - Add `activeFilter` state and action.
    - Update `filteredPrompts` to filter by `activeFilter` first.
4. Update `src/features/layout/SidebarNav.tsx`:
    - Consume `activeFilter` and `dispatch` from context.
    - Update click handlers.
5. Update `src/features/prompts/PromptEditor.tsx` to handle tags.
6. Add favorite toggle to `PromptCard` or `PromptDetailPanel`.
7. Update specs in `openspec/specs/`.

## Open Questions

- Should "Uncollected" include prompts that have a favorite flag but no tags? *Assumption: Yes, uncollected means no tags.*
