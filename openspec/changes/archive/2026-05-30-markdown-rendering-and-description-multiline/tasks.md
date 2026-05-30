## 1. Dependencies & tooling

- [x] 1.1 Install `react-markdown` and `remark-gfm` as runtime dependencies (`pnpm add react-markdown remark-gfm`)
- [x] 1.2 Install `@tailwindcss/typography` as a dev dependency (`pnpm add -D @tailwindcss/typography`)
- [x] 1.3 Register the typography plugin in `src/styles/index.css` via `@plugin "@tailwindcss/typography"`

## 2. Markdown rendering — content block

- [x] 2.1 Import `ReactMarkdown` from `react-markdown` and `remarkGfm` from `remark-gfm` in `PromptView.tsx`
- [x] 2.2 Replace the `dangerouslySetInnerHTML` block in the content enclosure with `<ReactMarkdown remarkPlugins={[remarkGfm]}>{p.content}</ReactMarkdown>`
- [x] 2.3 Apply `prose prose-sm max-w-none` (and any dark-mode overrides) to the wrapper inside the content enclosure
- [x] 2.4 Remove the `renderMarkdown()` and `escHtml()` helper functions

## 3. Markdown rendering — description and notes

- [x] 3.1 Replace the plain `<p>` for description in read mode with a `<ReactMarkdown>` component wrapped in a `prose prose-sm` container with italic/muted styling
- [x] 3.2 Replace the `whitespace-pre-wrap` `<p>` for notes in the Notes aside card with a `<ReactMarkdown>` component wrapped in a `prose prose-sm` container

## 4. Description multiline textarea

- [x] 4.1 In the edit/create form inside `PromptView.tsx`, change the description `<input type="text">` to a `<textarea rows={3}>` with the same styling classes, adding `resize-y`
- [x] 4.2 Verify the `onChange` handler still works correctly with the textarea event

## 5. Verification

- [x] 5.1 Run `pnpm build` and confirm zero TypeScript errors
- [x] 5.2 Run `pnpm test` and confirm all 29 tests still pass (no logic changes expected)
- [ ] 5.3 Manually verify in the browser: numbered list, bulleted list, paragraph breaks, bold/italic, inline code, fenced code block all render correctly in the content block
- [ ] 5.4 Manually verify description and notes render Markdown formatting in read mode
- [ ] 5.5 Manually verify description textarea accepts and saves multiline text in edit mode
