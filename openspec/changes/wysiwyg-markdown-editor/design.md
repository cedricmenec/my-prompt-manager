# Design: WYSIWYG Markdown Editor

## Overview

Replace the plain `<textarea>` used for prompt content editing with a Tiptap-based WYSIWYG Markdown editor. The component encapsulates all ProseMirror complexity and exposes a simple `value`/`onChange` interface matching the existing textarea contract. The Markdown string remains the single source of truth — ProseMirror is an editing viewport, not a data model.

```text
PromptView (state owner)
  content: string          ← Markdown, unchanged contract
  setContent: (md) => void
      │
      ▼
  MarkdownEditor (new shared/ui component)
  ┌─────────────────────────────────────────────┐
  │  value: string   (Markdown)                 │
  │  onChange: (md: string) => void             │
  │                                             │
  │  Internal:                                  │
  │  ┌─────────┐    tiptap-markdown    ┌──────┐ │
  │  │ Tiptap   │ ◀── parse ────────── │ MD   │ │
  │  │ editor   │ ── serialize ──────▶ │ str  │ │
  │  │ (WYSIWYG)│                      │      │ │
  │  └─────────┘                      └──┬───┘ │
  │                                      │      │
  │  ┌───────────┐                       │      │
  │  │ textarea   │ ◀── direct edit ─────┘      │
  │  │ (source)   │                             │
  │  └───────────┘                              │
  │                                             │
  │  [MD] toggle switches between the two       │
  └─────────────────────────────────────────────┘
```

## Component Design

### MarkdownEditor props

```typescript
interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
  error?: boolean
}
```

The interface is intentionally identical to what a controlled `<textarea>` expects. This makes the migration in `PromptView.tsx` a drop-in replacement.

### Internal state

```typescript
const [isSourceMode, setIsSourceMode] = useState(false)
```

Single boolean. No other internal state — the Markdown string lives entirely in the parent.

### Tiptap editor setup

```typescript
const editor = useEditor({
  extensions: [
    StarterKit.configure({
      heading: { levels: [1, 2, 3] },
    }),
    Placeholder.configure({
      placeholder: props.placeholder ?? 'Write your prompt here…',
    }),
    Markdown.configure({
      html: false,        // reject HTML input
      transformPastedText: true,  // parse pasted text as Markdown
      transformCopiedText: true,  // copy as Markdown
    }),
  ],
  content: '',  // set via useEffect
  onUpdate: ({ editor }) => {
    const md = editor.storage.markdown.getMarkdown()
    props.onChange(md)
  },
})
```

### Source mode toggle

When the user clicks the `[MD]` toggle:

**WYSIWYG → Source:**
1. Serialize the current ProseMirror document to Markdown via `editor.storage.markdown.getMarkdown()`.
2. Set `isSourceMode = true`.
3. Render `<textarea>` with the serialized Markdown.

**Source → WYSIWYG:**
1. Set `isSourceMode = false`.
2. Re-parse the Markdown string into ProseMirror via `editor.commands.setContent(content, false, { preserveWhitespace: 'full' })`.
3. Render `<EditorContent>`.

The toggle does NOT call `onChange`. The Markdown string is already synchronized — the Tiptap `onUpdate` callback kept it current while in WYSIWYG mode, and the textarea `onChange` kept it current while in source mode.

### Clipboard behavior

- **Paste in WYSIWYG mode:** `tiptap-markdown` with `transformPastedText: true` intercepts the paste event, parses the clipboard content as Markdown, and inserts the corresponding ProseMirror nodes. Pasting `**bold**` renders as bold text.
- **Copy from WYSIWYG mode:** `tiptap-markdown` with `transformCopiedText: true` serializes the selection to Markdown on the clipboard.
- **Paste in source mode:** Standard textarea paste — raw text insertion.
- **Copy in source mode:** Standard textarea copy — raw text.

## Styling

ProseMirror requires its own CSS. The editor styles will be mapped to the existing Tailwind theme tokens:

```css
/* ProseMirror editor container */
.ProseMirror {
  min-height: <computed from rows prop>;
  padding: 0.375rem 0.75rem;    /* matches px-3 py-1.5 */
  font-size: 0.875rem;          /* matches text-sm */
  color: var(--color-text-heading);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 0.375rem;      /* matches rounded-md */
  outline: none;
}

.ProseMirror:focus {
  border-color: var(--color-primary);
}

.ProseMirror p.is-editor-empty:first-child::before {
  color: var(--color-text);     /* placeholder color */
  content: attr(data-placeholder);
  float: left;
  height: 0;
  pointer-events: none;
}
```

The toggle button will be a small pill-shaped button in the top-right corner of the editor container, styled consistently with the existing UI vocabulary.

## Data Flow — No Schema Changes

```text
BEFORE:
  content state (string) ──▶ <textarea> ──▶ onChange ──▶ content state
  content state (string) ──▶ handleSave ──▶ repository

AFTER:
  content state (string) ──▶ <MarkdownEditor> ──▶ onChange ──▶ content state
  content state (string) ──▶ handleSave ──▶ repository
```

The `PromptSchema`, `promptRepository`, IndexedDB storage, export/import, and all other systems remain completely unchanged. The `content` field is still a `string` containing Markdown.

## Read Mode — Unchanged

The existing read mode using `ReactMarkdown` with `remark-gfm` and `remark-breaks` is preserved as-is. The `MarkdownEditor` is only used in edit mode. This avoids the risk of introducing rendering regressions in the read path.

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| User pastes HTML into WYSIWYG | `html: false` in Markdown config means HTML tags are stripped or treated as text |
| User pastes rich text (from Google Docs) | ProseMirror handles rich text paste natively; tiptap-markdown only transforms plain text paste |
| Empty content on toggle | Both modes handle empty strings gracefully |
| Very long content (>1000 lines) | ProseMirror handles large documents well; no virtualization needed for typical prompt lengths |
| ProseMirror fails to parse Markdown | `editor.commands.setContent(rawMarkdown, false, { preserveWhitespace: 'full' })` falls back gracefully — unrecognized syntax is kept as text nodes |
| User switches to source, edits, switches back | Re-parse from textarea value; any Markdown that ProseMirror cannot represent is preserved as text |

## Bundle Impact

| Package | Size (minified+gzipped) |
|---------|------------------------|
| `@tiptap/react` | ~15KB |
| `@tiptap/starter-kit` | ~25KB |
| `@tiptap/extension-placeholder` | ~2KB |
| `tiptap-markdown` | ~8KB |
| ProseMirror core (transitive) | ~70KB |
| **Total addition** | **~120KB gzipped** |

This is acceptable for a productivity app that already loads React, Vite, Zod, and other dependencies.
