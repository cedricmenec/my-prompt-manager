## Context

`PromptView.tsx` currently ships a ~30-line hand-rolled Markdown renderer (`renderMarkdown()`) that converts a small subset of Markdown to HTML and injects it via `dangerouslySetInnerHTML`. The `prose` Tailwind class is already applied to the content block but `@tailwindcss/typography` is not installed, so it has no effect. Description and notes are rendered as plain `<p>` / pre-wrap text.

The goal is to replace this with a proper Markdown pipeline while keeping the visual identity of the app (modern, not overly technical) and clearly differentiating the prompt content block from the surrounding metadata (title, description, notes).

## Goals / Non-Goals

**Goals:**
- Full CommonMark + GFM rendering: paragraphs, line breaks, numbered/bulleted lists, headings, bold/italic, code inline/block, blockquotes, tables, strikethrough
- Render `content`, `description`, and `notes` as Markdown in read mode
- Multiline `description` textarea in edit/create mode
- Clean prose typography via `@tailwindcss/typography`
- No XSS risk: use React component rendering, not `dangerouslySetInnerHTML`
- Visually differentiate the `content` block (distinct enclosure, slightly different background) from `description` and `notes`

**Non-Goals:**
- Markdown editing preview (live split-pane editor)
- Custom Markdown extensions beyond GFM
- Rendering Markdown in list cards (`PromptCard`, `PromptRow`) — these stay as plain text (clamp/truncate)
- Changes to the data model or storage layer

## Decisions

### Decision 1: `react-markdown` + `remark-gfm` over `marked` + `DOMPurify`

**Chosen**: `react-markdown` with the `remark-gfm` plugin.

**Rationale**: Produces React elements rather than raw HTML, eliminating the need for `dangerouslySetInnerHTML` and a separate sanitizer. The component model allows mapping any Markdown node to a custom React component (e.g., to style code blocks or apply specific Tailwind classes). Bundle impact is acceptable (~35KB gzip on top of current 96KB).

**Alternative considered**: `marked` → HTML string → `DOMPurify` → `dangerouslySetInnerHTML`. Requires two libraries, keeps the unsafe HTML injection pattern, and is less idiomatic in React.

### Decision 2: `@tailwindcss/typography` for prose styling

**Chosen**: Add `@tailwindcss/typography` as a dev dependency and register it as a Tailwind v4 plugin via `@plugin "@tailwindcss/typography"` in `styles/index.css`.

**Rationale**: Provides battle-tested, readable prose defaults (line height, spacing between headings/paragraphs/lists) without writing custom CSS. In Tailwind v4, plugins are loaded via `@plugin` in CSS rather than `tailwind.config.js`.

**Scope**: `prose` class applied to the `content` block and `description`/`notes` sections. Scoped with `prose-sm` or custom overrides for `notes` to give it a secondary visual weight.

### Decision 3: Visual differentiation strategy

```
┌──────────────────────────────────────────────┐
│  h1  Title                                   │
│  [tag] [tag]                                 │
│                                              │
│  Description (prose, normal background,      │
│  italic/muted tone, smaller text)            │
│                                              │
│  ┌──────────────────────────────────────┐   │
│  │  CONTENT BLOCK (distinct enclosure)  │   │
│  │  bg-surface-muted, border, padding   │   │
│  │  prose rendering inside              │   │
│  └──────────────────────────────────────┘   │
│                                              │
│  ┌──────────────────────────────────────┐   │
│  │  NOTES                               │   │
│  │  subtle border, label "NOTES",       │   │
│  │  prose-sm rendering inside           │   │
│  └──────────────────────────────────────┘   │
└──────────────────────────────────────────────┘
```

- **Description**: inline prose, italic styling, muted color — feels like a subtitle
- **Content**: distinct card enclosure (existing design preserved), prose rendering inside
- **Notes**: subtle aside card, `prose-sm`, secondary visual weight

### Decision 4: Description textarea size

3 rows minimum, auto-grows with content (CSS `field-sizing: content` where supported, or manual `rows={3}`). No hard character limit imposed in the UI; the schema has none.

## Risks / Trade-offs

- **Bundle size increase** (~35KB gzip): acceptable given the app is purely client-side and the improvement in rendering quality justifies it.
- **Typography plugin scope**: `prose` styles can bleed if misapplied. Risk mitigated by scoping `prose` to the three specific render areas only.
- **`font-mono` on content block**: the current content block uses `font-mono`. With `react-markdown`, body text inside the content block will no longer be monospace unless explicitly overridden via custom component props. This is acceptable — the block enclosure already provides the visual distinction; forcing monospace on prose text is jarring.

## Migration Plan

1. Install dependencies
2. Add `@plugin "@tailwindcss/typography"` to CSS
3. Replace `renderMarkdown()` + `dangerouslySetInnerHTML` with `<ReactMarkdown>` in the content block
4. Replace plain `<p>` for description and `whitespace-pre-wrap` for notes with `<ReactMarkdown>` wrapped in appropriate containers
5. Change description `<input>` to `<textarea>` in the edit form
6. Remove dead code (`renderMarkdown`, `escHtml`)
7. Verify build passes and tests still pass (no logic changes)

Rollback: revert the single file `PromptView.tsx` and the CSS `@plugin` line.
