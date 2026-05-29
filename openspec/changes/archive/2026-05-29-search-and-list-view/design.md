## Context

The app currently displays a grid of prompt cards backed by `PromptsContext` and `PromptListView`. There is no way to filter prompts or change layout. As prompt libraries grow, users need fast discovery (fuzzy search) and a denser display option (list view). This is a purely client-side, local-first change — no backend, no API, no data model modifications.

## Goals / Non-Goals

**Goals:**
- Add a fuzzy search bar that filters the prompt list in real-time on `title` and `description`.
- Add a list layout as an alternative to the existing grid, toggled by a UI control.
- Persist the chosen view mode in `localStorage`.
- Keep the search state in `PromptsContext` so any future consumer can read the filtered list.

**Non-Goals:**
- Server-side or indexed search.
- Searching on `tags` (tag filtering is a separate concern).
- Sorting or grouping prompts by search relevance score.
- Highlighting matched characters in search results.

## Decisions

### Decision 1: Use Fuse.js for fuzzy matching

**Chosen**: Add `fuse.js` as a runtime dependency.

**Rationale**: Fuse.js is a well-maintained, zero-dependency fuzzy-search library with 18k+ stars. It handles character transpositions, missing characters, and case-insensitivity out of the box. The bundle cost is ~6 KB gzipped — acceptable for a static app. It supports per-field weighting (`title` can be weighted higher than `description`).

**Alternatives considered**:
- *Hand-rolled Levenshtein distance*: More control but non-trivial to implement correctly with good UX thresholds; not worth reinventing for this use case.
- *`minisearch`*: Excellent for larger corpora, but heavier than needed for a personal prompt library (typically < 500 items).

**Fuse.js config**:
- `keys`: `[{ name: 'title', weight: 2 }, { name: 'description', weight: 1 }]`
- `threshold: 0.4` (0 = exact, 1 = match anything; 0.4 gives good tolerance for typos)
- `ignoreLocation: true` (match anywhere in the string, not just at the start)

---

### Decision 2: Hold search state in PromptsContext

**Chosen**: Add `searchQuery` (string) and `filteredPrompts` (derived) to `PromptsContext`.

**Rationale**: Centralising the search state in context means the filtered list is available anywhere that already consumes `PromptsContext` (e.g., a future count badge). `PromptListView` renders from `filteredPrompts` instead of the raw `prompts` array. `setSearchQuery` is exposed for the search input component.

**Alternatives considered**:
- *Local state in `PromptListView`*: Simpler initially, but couples filtering logic to a single component and makes it harder to reuse.

---

### Decision 3: Hold view-mode state in PromptListView with localStorage persistence

**Chosen**: `viewMode` (`'grid' | 'list'`) lives as local state in `PromptListView`, initialised from `localStorage.getItem('promptViewMode')` and synced back on change.

**Rationale**: View-mode is UI preference, not domain data. It doesn't need to be in context — nothing outside `PromptListView` cares about the current layout. `localStorage` provides cross-session persistence without infrastructure.

**Alternatives considered**:
- *PromptsContext*: Unnecessary coupling of layout preference into domain context.

---

### Decision 4: Separate PromptRow component for list layout

**Chosen**: Create `PromptRow.tsx` as a sibling of `PromptCard.tsx`.

**Rationale**: The list row has different visual structure (horizontal, single-line description, more compact) than the card. Merging both into `PromptCard` via a `variant` prop adds conditional rendering complexity. A dedicated component keeps each layout self-contained and easier to style.

---

### Decision 5: Debounce search input

**Chosen**: Debounce `setSearchQuery` by 150 ms using a simple `useDebounce` hook.

**Rationale**: Re-running Fuse.js on every keystroke for large libraries is unnecessary work. 150 ms is imperceptible to users but avoids thrashing on fast typists. The hook can live in `src/shared/hooks/useDebounce.ts`.

## Risks / Trade-offs

- [Performance] Fuse.js re-indexes on every render if the `prompts` array reference changes → **Mitigation**: Memoize the `Fuse` instance with `useMemo`, re-creating it only when `prompts` changes.
- [Bundle size] Adding `fuse.js` increases bundle size by ~6 KB gzipped → **Acceptable** for the functionality gained; monitor with `vite build --report` if needed.
- [Threshold tuning] `threshold: 0.4` may surface false positives on very short queries → **Mitigation**: Fall back to substring match when query length ≤ 2 characters (Fuse.js handles short strings poorly).

## Migration Plan

1. Install `fuse.js`: `pnpm add fuse.js`.
2. Update `PromptsContext` to add `searchQuery`, `setSearchQuery`, and `filteredPrompts`.
3. Create `src/shared/hooks/useDebounce.ts`.
4. Create `src/features/prompts/PromptRow.tsx`.
5. Update `PromptListView.tsx`: add search bar, view-mode toggle, and conditional grid/list rendering.
6. Verify `PromptListView` renders from `filteredPrompts` (not raw `prompts`).

No data migrations or deployment steps required — purely additive UI change.

## Open Questions

- Should the search bar be cleared when the user creates or deletes a prompt, or should it persist? (Leaning toward: keep it as-is, let the user clear it.)
- Should list-view rows show the `updatedAt` timestamp? (Proposal is silent on this; design assumes no for MVP — can be added later.)
