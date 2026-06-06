## Why

The prompt content editor is currently a plain `<textarea>`. Prompt authors overwhelmingly write in Markdown — formatting, headings, lists, code blocks — but they have no visual feedback while editing. They write blind, relying on memory to verify that their Markdown syntax is correct, and only see the rendered result in read mode. This creates friction: typos in Markdown syntax go unnoticed until after save, and editing existing prompts requires mental translation between raw syntax and intended output.

The goal is an Obsidian-like editing experience: WYSIWYG by default with Markdown keyboard shortcuts (Ctrl+B, Ctrl+I, etc.), a simple toggle to view/edit raw Markdown source, and full clipboard interoperability — pasting Markdown renders it, and copying from the editor yields Markdown on the clipboard. The underlying storage format remains unchanged: a plain Markdown string in IndexedDB.

## What Changes

- Replace the plain `<textarea>` for prompt content with a WYSIWYG Markdown editor powered by Tiptap (ProseMirror-based) and the `tiptap-markdown` extension.
- Default to WYSIWYG mode where Markdown is rendered inline during editing (bold, italic, headings, lists, code blocks, tables all display as formatted content).
- Provide a simple `[MD]` toggle button to switch between WYSIWYG and raw source mode. Both modes edit the same Markdown string — no data transformation on toggle.
- Clipboard integration: pasting Markdown content into WYSIWYG mode renders it; copying from the editor yields Markdown on the clipboard.
- Preserve the existing read mode using `ReactMarkdown` with `remark-gfm` and `remark-breaks`.
- No changes to the `PromptSchema`, `promptRepository`, IndexedDB storage, export/import, or any other existing functionality.

## Capabilities

### Modified Capabilities

- `prompt-view`: The edit mode content textarea is replaced by a `MarkdownEditor` component. All other fields, validation, save/cancel behavior, and read mode remain unchanged.

### New Capabilities

- `markdown-editor`: A reusable WYSIWYG Markdown editing component with source mode toggle, clipboard interoperability, and Tiptap/ProseMirror integration.

## Impact

- Adds 4 new npm dependencies: `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-placeholder`, and `tiptap-markdown`.
- Adds approximately 120-140KB to the JavaScript bundle (ProseMirror core).
- Creates a new `MarkdownEditor` component (~200 lines) in `shared/ui/`.
- Requires CSS for ProseMirror editor styling mapped to existing theme tokens.
- Minimal changes to `PromptView.tsx`: swap the content `<textarea>` for `<MarkdownEditor>`.
- No schema changes, no repository changes, no test breakage.
