## Why

The current prompt detail panel is a fixed 384px side column — too narrow for the primary use case (reading, copying, and editing a prompt's full content). Selecting a prompt should give it the full stage, not a sliver of screen real estate.

## What Changes

- **BREAKING** Replace the fixed-width `PromptDetailPanel` side column with a full-screen `PromptView` that takes over the entire content area (sidebar excluded) when a prompt is selected
- **BREAKING** Replace the `PromptEditor` modal overlay with an in-page edit mode toggle inside `PromptView` (same view, two modes: read / edit)
- **BREAKING** `TopAppBar` is hidden when a prompt is selected; `PromptView` provides its own action bar
- Prompt content is displayed inside a terminal/code-block style enclosure to visually distinguish it as the copyable artifact
- A prominent "Copy" CTA button appears both above and below the content block
- Notes field is rendered as plain free-text below the content block (no Markdown)
- Navigating to a new prompt via "New" button goes directly into `PromptView` in edit mode (no separate modal)
- `← Back` button and `Esc` keyboard shortcut return to the list view

## Capabilities

### New Capabilities

- `prompt-view`: Full-screen prompt reading and editing experience. Replaces `PromptDetailPanel` and the `PromptEditor` modal. Includes read mode (styled Markdown content, copy CTA, notes) and edit mode (inline form fields, save/cancel).

### Modified Capabilities

- `prompt-detail-panel`: **Retired** — all requirements superseded by `prompt-view`
- `prompt-editor`: **Retired** — all requirements superseded by `prompt-view`
- `main-layout-shell`: `TopAppBar` SHALL be hidden when a prompt is selected (i.e., when `PromptView` is active)

## Impact

- `src/app/App.tsx` — replace side-panel + modal orchestration with `PromptView` route-like swap
- `src/features/layout/MainLayoutShell.tsx` — conditional TopAppBar rendering
- `src/features/prompts/PromptDetailPanel.tsx` — **deleted**
- `src/features/prompts/PromptEditor.tsx` — **deleted** (logic absorbed into PromptView)
- `src/features/prompts/PromptView.tsx` — **new file**
- `src/features/prompts/PromptsContext.tsx` — add `viewMode: 'read' | 'edit'` to state; add `OPEN_CREATE` navigation to PromptView edit mode
