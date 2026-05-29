## 1. Domain — Schema & Parser

- [x] 1.1 Add `notes: z.string().optional()` to `PromptSchema` in `src/domain/promptSchema.ts`
- [x] 1.2 Verify `parseMarkdown` already handles `notes` via frontmatter passthrough (Zod `strip` mode); add test scenario for notes round-trip in `markdownParser.test.ts`

## 2. Context — DESELECT Action

- [x] 2.1 Add `DESELECT` action type to the `PromptsAction` union in `src/features/prompts/PromptsContext.tsx`
- [x] 2.2 Handle `DESELECT` in the reducer: set `selectedPromptId` to `null`

## 3. Detail Panel — Close Button & Notes Section

- [x] 3.1 Add a close (×) button to the `PromptDetailPanel` header that dispatches `{ type: 'DESELECT' }`
- [x] 3.2 Add a "Notes" section below the content area in `PromptDetailPanel`: render `prompt.notes` as plain text, hidden when `notes` is falsy

## 4. Editor — Notes Field

- [x] 4.1 Add a `notes` state variable (string) initialised from `prompt.notes ?? ''` in `PromptEditor`
- [x] 4.2 Add the notes `<textarea>` field to the editor form (optional, labelled "Notes")
- [x] 4.3 Pass `notes: notes.trim() || undefined` in the `create` and `update` payloads

## 5. List View — Max-Width Constraint

- [x] 5.1 Wrap the list-mode `<ul>` in `PromptListView` with `max-w-3xl mx-auto` on the container `<div>`

## 6. Verification

- [x] 6.1 Run `pnpm tsc --noEmit` — no TypeScript errors
- [x] 6.2 Run `pnpm test` — all existing tests pass; new `markdownParser` notes scenario passes
- [x] 6.3 Run `pnpm build` — production build succeeds
- [x] 6.4 Manual smoke test: create a prompt with notes, verify notes display in detail panel; verify close button hides panel; verify list mode rows are constrained in width
