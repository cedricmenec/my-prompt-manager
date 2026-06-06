# Tasks: WYSIWYG Markdown Editor

- [x] Install Tiptap dependencies <!-- id: 1 -->
  - [x] Add `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-placeholder`, and `tiptap-markdown` to dependencies via `pnpm add`
  - [x] Verify the app builds and existing tests pass with new dependencies installed

- [x] Create MarkdownEditor component <!-- id: 2 -->
  - [x] Create `src/shared/ui/MarkdownEditor.tsx` with the `MarkdownEditorProps` interface (`value`, `onChange`, `placeholder?`, `rows?`, `error?`)
  - [x] Implement Tiptap editor setup with `StarterKit` (headings h1-h3, bold, italic, bullet lists, ordered lists, code blocks, blockquotes, horizontal rules), `Placeholder`, and `tiptap-markdown` with `html: false`, `transformPastedText: true`, `transformCopiedText: true`
  - [x] Implement WYSIWYG mode: render `<EditorContent>` with the Tiptap editor; on `onUpdate`, serialize to Markdown via `editor.storage.markdown.getMarkdown()` and call `onChange`
  - [x] Implement source mode: render a `<textarea>` with monospace font, `value` prop, and `onChange` handler that calls the parent `onChange`
  - [x] Implement the `[MD]` toggle button in the top-right corner of the editor container
  - [x] Implement toggle logic: WYSIWYG → source (serialize current document, switch to textarea), source → WYSIWYG (re-parse Markdown into ProseMirror via `editor.commands.setContent`)
  - [x] Implement `rows` prop for minimum editor height (default 8)
  - [x] Implement `error` prop for error border styling
  - [x] Ensure `useEffect` syncs the `value` prop into the editor when it changes externally (e.g. cancel restore)

- [x] Add ProseMirror editor styles <!-- id: 3 -->
  - [x] Create `src/shared/ui/MarkdownEditor.css` with ProseMirror base styles
  - [x] Map ProseMirror styles to existing theme tokens (`--color-primary`, `--color-surface`, `--color-border`, `--color-text-heading`, `--color-text`)
  - [x] Style the `[MD]` toggle button to match existing UI vocabulary
  - [x] Style the source-mode textarea (monospace, matching border/radius/padding of WYSIWYG mode)
  - [x] Style placeholder text appearance

- [x] Integrate MarkdownEditor into PromptView <!-- id: 4 -->
  - [x] In `PromptView.tsx`, import `MarkdownEditor` from `@/shared/ui/MarkdownEditor`
  - [x] Replace the content `<textarea>` in `renderEditMode()` with `<MarkdownEditor value={content} onChange={...} rows={8} placeholder="Write your prompt here…" error={!!errors.content} />`
  - [x] Verify that `handleSave`, `handleCancel`, and form validation continue to work unchanged
  - [x] Verify that `ReactMarkdown` read mode is unaffected

- [x] Manual validation <!-- id: 5 -->
  - [x] Verify WYSIWYG mode renders formatted Markdown (headings, bold, italic, lists, code blocks)
  - [x] Verify pasting Markdown text into WYSIWYG mode renders it visually
  - [x] Verify copying from WYSIWYG mode yields Markdown on the clipboard
  - [x] Verify toggle to source mode shows raw Markdown in a textarea
  - [x] Verify editing in source mode and toggling back preserves changes
  - [x] Verify creating a new prompt opens the WYSIWYG editor
  - [x] Verify save persists Markdown correctly and read mode renders it identically
  - [x] Verify cancel discards changes and restores original content
  - [x] Verify validation error shows when content is empty
  - [x] Run `pnpm test` — all existing tests pass
  - [x] Run `pnpm build` — build succeeds
