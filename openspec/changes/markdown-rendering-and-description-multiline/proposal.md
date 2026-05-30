## Why

The prompt view currently uses a hand-rolled Markdown renderer that handles only basic formatting (bold, italic, headings, fenced code blocks). Newlines, numbered/bulleted lists, blockquotes, and other common Markdown constructs are silently dropped or mis-rendered. Additionally, `description` and `notes` are displayed as plain text even though users naturally write them with basic Markdown formatting. The description field is also a single-line input, which is limiting for any meaningful description. These gaps degrade the readability of prompts and create a mismatch between what the user writes and what they see.

## What Changes

- Replace the custom `renderMarkdown()` function with `react-markdown` + `remark-gfm` for full CommonMark + GitHub Flavored Markdown support
- Add `@tailwindcss/typography` for a clean, modern prose style
- Render `content` with a visually distinct enclosure (preserved from current design) but with proper Markdown rendering
- Render `description` as Markdown in read mode (currently plain text)
- Render `notes` as Markdown in read mode (currently plain text with `whitespace-pre-wrap`)
- Change the `description` form field from `<input type="text">` to `<textarea>` (multiline) in edit/create mode
- Remove the now-obsolete `renderMarkdown()` and `escHtml()` helper functions from `PromptView.tsx`

## Capabilities

### New Capabilities
- (none)

### Modified Capabilities
- `prompt-view`: description and notes fields are now rendered as Markdown in read mode; description edit field becomes a multiline textarea; content rendering delegates to `react-markdown` instead of custom renderer

## Impact

- **Dependencies added**: `react-markdown`, `remark-gfm` (runtime); `@tailwindcss/typography` (dev/CSS)
- **Files modified**: `src/features/prompts/PromptView.tsx`, `src/styles/index.css`, `vite.config.ts` (if needed for Tailwind plugin), `package.json`
- **No model/schema changes**: `description` is already `z.string().optional()` with no length constraint
- **No data migration needed**: all changes are UI/rendering only
