## 1. PromptsContext — state & actions

- [x] 1.1 Add `viewMode: 'read' | 'edit'` field to `PromptsState`
- [x] 1.2 Update `SELECT` action to set `viewMode: 'read'`
- [x] 1.3 Update `OPEN_EDIT` action to set `viewMode: 'edit'`
- [x] 1.4 Add `OPEN_CREATE` action: sets `selectedPromptId: null` and `viewMode: 'edit'`
- [x] 1.5 Update `DESELECT` and `CLOSE_EDITOR` actions to reset `viewMode` to `null`

## 2. MainLayoutShell — conditional TopAppBar

- [x] 2.1 Add `hideTopBar` boolean prop to `MainLayoutShell`
- [x] 2.2 Conditionally render `TopAppBar` based on `hideTopBar`

## 3. App.tsx — routing to PromptView

- [x] 3.1 Remove `PromptDetailPanel` side-panel rendering
- [x] 3.2 Remove `PromptEditor` overlay rendering
- [x] 3.3 Add conditional: when `selectedPromptId !== null || viewMode === 'edit'` → render `<PromptView />`
- [x] 3.4 Pass `hideTopBar` to `MainLayoutShell` when `PromptView` is active

## 4. PromptView — read mode

- [x] 4.1 Create `src/features/prompts/PromptView.tsx`
- [x] 4.2 Implement action bar: `← Back` button, favorite toggle (★), Edit button (✎), overflow menu (`⋯`) with Delete
- [x] 4.3 Render `Esc` key listener to deselect and return to list (read mode only)
- [x] 4.4 Render prompt title as `h1`
- [x] 4.5 Render tags as badge chips (hidden when empty)
- [x] 4.6 Render description as subtitle/lead paragraph (hidden when absent)
- [x] 4.7 Render content block: terminal/code-block style enclosure with Markdown rendered inside
- [x] 4.8 Render Copy CTA button above the content block
- [x] 4.9 Render Copy CTA button below the content block
- [x] 4.10 Implement clipboard copy: copies raw `content`, shows success toast
- [x] 4.11 Render Notes section as plain text below content block (hidden when absent)
- [x] 4.12 Wire favorite toggle to `promptRepository.update()` + dispatch `UPDATE`
- [x] 4.13 Wire Delete (overflow menu) with confirmation modal → `promptRepository.delete()` + dispatch `REMOVE` + `DESELECT`

## 5. PromptView — edit mode

- [x] 5.1 Implement mode toggle: clicking "Edit" switches internal state to edit mode
- [x] 5.2 Replace action bar with "Save" and "Cancel" buttons in edit mode
- [x] 5.3 Render `title` text input (required, pre-filled)
- [x] 5.4 Render `description` text input (optional, pre-filled)
- [x] 5.5 Render `tags` chip input with add/remove (pre-filled)
- [x] 5.6 Render `content` textarea with minimum 8 visible lines (required, pre-filled)
- [x] 5.7 Render `notes` textarea (optional, pre-filled)
- [x] 5.8 Render `model` text input (optional, pre-filled)
- [x] 5.9 Render `temperature` numeric input 0–2 step 0.1 (optional, pre-filled)
- [x] 5.10 Implement inline validation for `title` and `content` (required fields)
- [x] 5.11 Wire Save (edit mode): call `promptRepository.update()` + dispatch `UPDATE` + switch to read mode
- [x] 5.12 Wire Cancel (edit mode): discard changes + switch to read mode
- [x] 5.13 Wire Save (create mode, `selectedPromptId === null`): call `promptRepository.create()` + dispatch `ADD` + switch to read mode with new prompt selected

## 6. SidebarNav — new prompt navigation

- [x] 6.1 Update "New Prompt" button/action to dispatch `OPEN_CREATE` instead of `OPEN_EDITOR`

## 7. Cleanup

- [x] 7.1 Delete `src/features/prompts/PromptDetailPanel.tsx`
- [x] 7.2 Delete `src/features/prompts/PromptEditor.tsx`
- [x] 7.3 Remove all imports of `PromptDetailPanel` and `PromptEditor` from `App.tsx`
- [x] 7.4 Verify `pnpm build` passes with no TypeScript errors
- [x] 7.5 Verify `pnpm test` passes (update tests referencing deleted components if needed)
