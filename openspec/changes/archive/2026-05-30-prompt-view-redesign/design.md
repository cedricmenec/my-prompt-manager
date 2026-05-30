## Context

Currently, when a prompt is selected, a `PromptDetailPanel` (fixed `w-96` / 384px) slides in on the right while the `PromptListView` remains visible on the left. The `PromptEditor` opens as a modal overlay. Both patterns sacrifice screen real estate and reading focus for the primary action of the app: reading and copying a prompt.

The redesign introduces a single `PromptView` component that takes over the full content area, inspired by article reading experiences (Substack/Medium for read mode, Obsidian for edit mode).

## Goals / Non-Goals

**Goals:**
- Replace `PromptDetailPanel` + `PromptEditor` modal with a single `PromptView` (two modes: read/edit)
- Maximise reading area for prompt content
- Visually distinguish the copyable prompt content block (terminal/code style)
- Provide a prominent Copy CTA above and below the content block
- Hide `TopAppBar` while `PromptView` is active to eliminate chrome noise
- Support keyboard navigation (`Esc` to go back)

**Non-Goals:**
- Live Markdown preview split-pane in edit mode (deferred)
- Inline/block-level editing (not a block editor — full form toggle only)
- Routing/URL-based navigation (remains state-driven, no React Router)

## Decisions

### Decision: Single `PromptView` component absorbs both `PromptDetailPanel` and `PromptEditor`

**Chosen**: One file `src/features/prompts/PromptView.tsx` with an internal `viewMode: 'read' | 'edit'` state. The component reads `state.selectedPromptId` and `state.viewMode` from `PromptsContext`.

**Alternatives considered**:
- Keep `PromptEditor` as modal, only redesign `PromptDetailPanel` → rejected: two overlapping concerns, user still sees the narrow panel pattern on first load
- Two separate full-screen components (`PromptReadView` + `PromptEditView`) → rejected: unnecessary split, they share all data and most layout

---

### Decision: `viewMode` lives in `PromptsContext` state, not local component state

**Chosen**: Add `viewMode: 'read' | 'edit'` to `PromptsState`. Actions `SELECT` sets `viewMode: 'read'`; `OPEN_EDIT` sets `viewMode: 'edit'`; `OPEN_CREATE` sets `selectedPromptId: null` + `viewMode: 'edit'`; `DESELECT`/`CLOSE_EDITOR` resets both.

**Rationale**: The sidebar "New Prompt" button already dispatches from outside `PromptView`. Keeping mode in context avoids prop-drilling through `MainLayoutShell` → `App` → `PromptView`.

---

### Decision: `App.tsx` renders `PromptView` when `selectedPromptId !== null || viewMode === 'edit'`

**Chosen**: Replace the current side-panel + modal orchestration in `App.tsx` with a simple conditional:
```
if (showPromptView) → <PromptView />
else                → <PromptListView />
```
`PromptEditor` is deleted; `PromptDetailPanel` is deleted.

---

### Decision: `TopAppBar` visibility controlled by a prop on `MainLayoutShell`

**Chosen**: `MainLayoutShell` accepts a boolean prop `hideTopBar` (or reads context). When `PromptView` is active, `App.tsx` passes `hideTopBar={true}`.

**Alternative**: Read `PromptsContext` directly inside `MainLayoutShell` → rejected: couples layout shell to domain state, violating the shell's role as a pure layout primitive. Prop is cleaner.

---

### Decision: Content block uses a `<pre>`-style bordered card, not a `<code>` block

**Chosen**: The prompt content is **rendered Markdown** (not raw text), so a literal `<pre>` would break formatting. Instead: a `<div>` with `border-2 border-border rounded-lg bg-surface font-mono`-inspired styling to evoke a terminal feel while still rendering HTML from the Markdown renderer.

---

### Decision: Markdown renderer stays as the existing `renderMarkdown()` utility

**Chosen**: Reuse the existing lightweight renderer from `PromptDetailPanel`. No new dependency.

**Future**: A proper Markdown library (e.g., `marked`, `remark`) is in `deferred-features.md`. Out of scope here.

## Risks / Trade-offs

- **Risk: Esc conflict with edit-mode form inputs** → Mitigation: only bind `Esc` to "back" when `viewMode === 'read'`; in edit mode, `Esc` does nothing (Cancel button is the exit path)
- **Risk: `PromptsContext` state grows** → Trade-off acceptable: `viewMode` is a single field; complexity is contained
- **Risk: Losing scroll position in list on back navigation** → Deferred to a future improvement; acceptable for MVP
- **Risk: Delete confirmation modal — re-using existing `Modal` component** → Low risk, `Modal` is already generic

## Migration Plan

1. Add `viewMode` to `PromptsContext` state and reducer
2. Create `PromptView.tsx` (read mode first, then edit mode)
3. Update `App.tsx` to route to `PromptView` instead of `PromptDetailPanel` + `PromptEditor`
4. Update `MainLayoutShell` to accept/respond to `hideTopBar`
5. Delete `PromptDetailPanel.tsx` and `PromptEditor.tsx`
6. Update `SidebarNav` "New Prompt" dispatch to use `OPEN_CREATE`

No data migration needed — `IndexedDB` schema is unchanged.

## Open Questions

- None — all decisions resolved during exploration.
