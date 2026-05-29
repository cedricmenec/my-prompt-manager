## Context

The app currently uses a bare `flex h-screen` shell in `src/app/App.tsx` that divides the screen into a list column and a detail panel. There is no global navigation, no brand header, and no search bar. The design reference shows a polished vault-style layout with a fixed 260px sidebar and a content area with its own top bar.

Existing design tokens live in `src/styles/index.css` under `@theme` (Tailwind CSS v4). They use the current project palette (purple primary, light surfaces, border colours). The new components must use these tokens — the reference HTML uses a Material Design 3 colour scheme that differs from the project tokens; we adopt the layout structure but map all colours to the project's existing `--color-*` variables.

The `PromptsContext` already exposes `state.prompts`, `state.selectedPromptId`, `state.editorMode`, and `dispatch`. The layout components are consumers of this context, not owners.

## Goals / Non-Goals

**Goals:**
- Implement a fixed left sidebar (`260px`) with brand header, "New Prompt" CTA, primary nav links, a Collections section (derived from prompt tags), and a dark mode toggle
- Implement a sticky top app bar with a search input and a filter toolbar (within the main content area, not above the sidebar)
- Replace `App.tsx`'s ad-hoc layout with a `MainLayoutShell` that composes `SidebarNav`, `TopAppBar`, and a scrollable content canvas
- Adapt `PromptListView` to render as a responsive grid (1-2-3 columns) inside the canvas

**Non-Goals:**
- Functional routing between views (navigation links are visual only for now; active state based on a simple local state value)
- Dark mode implementation (the toggle button is rendered but does not yet switch themes)
- Real search/filter logic (search input is rendered but filtering is deferred to a future change)
- Responsive mobile layout (sidebar collapses on mobile are deferred)

## Decisions

### Decision: New components go under `src/features/layout/`
**Rationale**: The sidebar and top bar are layout-level concerns, not generic UI primitives (`shared/ui`) nor domain features. A dedicated `features/layout/` folder keeps them co-located and distinct from prompt-specific features.

**Alternatives considered**: `src/shared/ui/` — rejected because these components are app-specific and consume `PromptsContext`; they are not reusable primitives.

### Decision: Collections derived from prompt tags at runtime
**Rationale**: The current data model has no explicit "Collection" entity — only `tags` on prompts. The sidebar's Collections section will group prompts by tag and show the count. This avoids a new data model or migration.

**Alternatives considered**: Separate Collection entity with CRUD — deferred to a future change as it requires schema changes.

### Decision: `MainLayoutShell` wraps children via `children` prop
**Rationale**: `App.tsx` passes `<PromptListView>`, `<PromptDetailPanel>`, and `<PromptEditor>` as children to the shell. This keeps the shell layout-agnostic and the existing orchestration logic in `App.tsx` unchanged except for the wrapper.

### Decision: "New Prompt" in sidebar dispatches `OPEN_CREATE` via `usePrompts()`
**Rationale**: The sidebar consumes `PromptsContext` directly rather than receiving a prop callback. This is consistent with how all other components use the context.

### Decision: Top app bar is inside `<main>` (not full-width above sidebar)
**Rationale**: Matching the reference layout where the sidebar is full-height and independent. The top bar is sticky within the scrollable main region, not a global page header.

## Risks / Trade-offs

- **Collections derived from tags may feel awkward** if users have many tags or no tags at all → Mitigation: show "All Prompts" nav link as always-available fallback; Collections section shows empty state gracefully.
- **`PromptListView` layout change** (list → grid) may affect existing snapshot tests → Mitigation: update/delete snapshots as part of this change; behaviour tests remain valid.
- **Design tokens mismatch with reference HTML**: The reference uses Material Design 3 token names (`on-surface`, `surface-container`, etc.) not present in the project → Mitigation: map layout structure to existing `--color-*` tokens; accept slight visual difference from reference.

## Migration Plan

1. Create `src/features/layout/` folder with `SidebarNav.tsx`, `TopAppBar.tsx`, `MainLayoutShell.tsx`
2. Update `src/app/App.tsx` to use `MainLayoutShell`
3. Update `src/features/prompts/PromptListView.tsx` grid layout and remove its own "New Prompt" button
4. Run `pnpm dev` and visually verify layout
5. Run `pnpm test` and fix any snapshot failures
6. No rollback complexity — pure UI change with no data or API impact

## Open Questions

- Should the sidebar "Uncollected" count show prompts with zero tags? (Assumed: yes)
- Should the active collection filter actually filter the prompt grid in this change, or is it visual only? (Assumed: visual only for now; filtering is a future change)
