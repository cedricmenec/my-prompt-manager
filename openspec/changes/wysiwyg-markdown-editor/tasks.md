# Tasks: WYSIWYG Markdown Editor

- [ ] Install Tiptap dependencies <!-- id: 1 -->
  - [ ] Add `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-placeholder`, and `tiptap-markdown` to dependencies via `pnpm add`
  - [ ] Verify the app builds and existing tests pass with new dependencies installed

- [ ] Create MarkdownEditor component <!-- id: 2 -->
  - [ ] Create `src/shared/ui/MarkdownEditor.tsx` with the `MarkdownEditorProps` interface (`value`, `onChange`, `placeholder?`, `rows?`, `error?`)
  - [ ] Implement Tiptap editor setup with `StarterKit` (headings h1-h3, bold, italic, bullet lists, ordered lists, code blocks, blockquotes, horizontal rules), `Placeholder`, and `tiptap-markdown` with `html: false`, `transformPastedText: true`, `transformCopiedText: true`
  - [ ] Implement WYSIWYG mode: render `<EditorContent>` with the Tiptap editor; on `onUpdate`, serialize to Markdown via `editor.storage.markdown.getMarkdown()` and call `onChange`
  - [ ] Implement source mode: render a `<textarea>` with monospace font, `value` prop, and `onChange` handler that calls the parent `onChange`
  - [ ] Implement the `[MD]` toggle button in the top-right corner of the editor container
  - [ ] Implement toggle logic: WYSIWYG → source (serialize current document, switch to textarea), source → WYSIWYG (re-parse Markdown into ProseMirror via `editor.commands.setContent`)
  - [ ] Implement `rows` prop for minimum editor height (default 8)
  - [ ] Implement `error` prop for error border styling
  - [ ] Ensure `useEffect` syncs the `value` prop into the editor when it changes externally (e.g. cancel restore)

- [ ] Add ProseMirror editor styles <!-- id: 3 -->
  - [ ] Create `src/shared/ui/MarkdownEditor.css` with ProseMirror base styles
  - [ ] Map ProseMirror styles to existing theme tokens (`--color-primary`, `--color-surface`, `--color-border`, `--color-text-heading`, `--color-text`)
  - [ ] Style the `[MD]` toggle button to match existing UI vocabulary
  - [ ] Style the source-mode textarea (monospace, matching border/radius/padding of WYSIWYG mode)
  - [ ] Style placeholder text appearance

- [ ] Integrate MarkdownEditor into PromptView <!-- id: 4 -->
  - [ ] In `PromptView.tsx`, import `MarkdownEditor` from `@/shared/ui/MarkdownEditor`
  - [ ] Replace the content `<textarea>` in `renderEditMode()` with `<MarkdownEditor value={content} onChange={...} rows={8} placeholder="Write your prompt here…" error={!!errors.content} />`
  - [ ] Verify that `handleSave`, `handleCancel`, and form validation continue to work unchanged
  - [ ] Verify that `ReactMarkdown` read mode is unaffected

- [ ] Manual validation <!-- id: 5 -->
  - [ ] Verify WYSIWYG mode renders formatted Markdown (headings, bold, italic, lists, code blocks)
  - [ ] Verify pasting Markdown text into WYSIWYG mode renders it visually
  - [ ] Verify copying from WYSIWYG mode yields Markdown on the clipboard
  - [ ] Verify toggle to source mode shows raw Markdown in a textarea
  - [ ] Verify editing in source mode and toggling back preserves changes
  - [ ] Verify creating a new prompt opens the WYSIWYG editor
  - [ ] Verify save persists Markdown correctly and read mode renders it identically
  - [ ] Verify cancel discards changes and restores original content
  - [ ] Verify validation error shows when content is empty
  - [ ] Run `pnpm test` — all existing tests pass
  - [ ] Run `pnpm build` — build succeeds
