## 1. Project Scaffold

- [x] 1.1 Bootstrap project with `pnpm create vite` using React + TypeScript template
- [x] 1.2 Install core dependencies: `react@19`, `react-dom@19`, `zod`, `idb`, `js-yaml`
- [x] 1.3 Install dev dependencies: `vitest`, `@vitest/coverage-v8`, `jsdom`, `@testing-library/react`, `@types/js-yaml`
- [x] 1.4 Install and configure `@tailwindcss/vite` plugin
- [x] 1.5 Configure `tsconfig.json` with `strict: true`, `noImplicitAny`, `strictNullChecks`, `exactOptionalPropertyTypes`, and `@/` path alias to `src/`
- [x] 1.6 Configure Vite (`vite.config.ts`) with path alias resolution and Vitest settings (`environment: 'jsdom'`, `globals: true`)
- [x] 1.7 Create CSS entry point (`src/styles/index.css`) with `@import "tailwindcss"` and `@theme` design tokens (brand colours, font sizes)
- [x] 1.8 Create `src/` folder structure: `app/`, `features/prompts/`, `shared/ui/`, `shared/hooks/`, `shared/lib/`, `domain/`, `infrastructure/`, `assets/`, `styles/`
- [x] 1.9 Verify `pnpm dev` starts without errors and `pnpm build` exits with code 0

## 2. Domain Layer — Prompt Model

- [x] 2.1 Create `src/domain/promptSchema.ts` with the Zod `PromptSchema` defining all required and optional fields (`id`, `title`, `content`, `description`, `tags`, `model`, `temperature`, `createdAt`, `updatedAt`)
- [x] 2.2 Export the `Prompt` TypeScript type inferred from `PromptSchema` (`z.infer<typeof PromptSchema>`)
- [x] 2.3 Write unit tests for `PromptSchema`: valid prompt passes, missing `title` fails, `temperature > 2` fails

## 3. Domain Layer — Markdown Parser & Serializer

- [x] 3.1 Create `src/domain/markdownParser.ts` with `parseMarkdown(raw: string)` that splits `---` frontmatter, parses YAML with `js-yaml`, validates with `PromptSchema`, and returns `{ data, error }`
- [x] 3.2 Implement `serializeMarkdown(prompt: Prompt): string` in the same module — serializes frontmatter fields to YAML wrapped in `---` delimiters, appends `content` as the body
- [x] 3.3 Write unit tests: valid frontmatter parses correctly, missing frontmatter returns error, unknown fields are stripped, serialize→parse roundtrip is lossless

## 4. Infrastructure Layer — promptRepository

- [x] 4.1 Create `src/infrastructure/db.ts` that opens the `byo-prompt-manager` IndexedDB (version `1`) with a `prompts` object store keyed by `id`, indexed on `updatedAt` (`by-updatedAt`) and `tags` (`by-tags`, `multiEntry: true`)
- [x] 4.2 Implement `promptRepository.getAll(): Promise<Prompt[]>` returning all prompts sorted by `updatedAt` descending
- [x] 4.3 Implement `promptRepository.getById(id: string): Promise<Prompt | undefined>`
- [x] 4.4 Implement `promptRepository.create(data: Omit<Prompt, 'id' | 'createdAt' | 'updatedAt'>): Promise<Prompt>` generating UUIDv4, `createdAt`, and `updatedAt`
- [x] 4.5 Define `PromptNotFoundError` class and implement `promptRepository.update(id, data): Promise<Prompt>` that merges partial data, refreshes `updatedAt`, and throws `PromptNotFoundError` for unknown ids
- [x] 4.6 Implement `promptRepository.delete(id: string): Promise<void>` as an idempotent operation
- [x] 4.7 Implement `promptRepository.bulkImport(prompts: Prompt[]): Promise<void>` using a single transaction with `put` semantics
- [x] 4.8 Write unit tests for all repository methods (use `fake-indexeddb` or `idb-keyval` mock)

## 5. State Management — PromptsContext

- [x] 5.1 Define the `PromptsState` type and all action types (`LOAD`, `ADD`, `UPDATE`, `REMOVE`, `SELECT`) in `src/features/prompts/PromptsContext.tsx`
- [x] 5.2 Implement the `promptsReducer` handling all action types
- [x] 5.3 Create `PromptsProvider` component that initialises state from `promptRepository.getAll()` on mount and exposes context value
- [x] 5.4 Export the `usePrompts()` convenience hook

## 6. Shared UI Primitives

- [x] 6.1 Create `src/shared/ui/Badge.tsx` — renders a tag chip with label text
- [x] 6.2 Create `src/shared/ui/Button.tsx` — primary/secondary/danger variants
- [x] 6.3 Create `src/shared/ui/Modal.tsx` — overlay modal with title, body slot, and action buttons
- [x] 6.4 Create `src/shared/ui/Toast.tsx` and a `useToast()` hook for brief success/error notifications

## 7. Feature UI — Prompt List View

- [x] 7.1 Create `src/features/prompts/PromptCard.tsx` — displays `title` (bold), `description` (truncated, optional), and `tags` as `Badge` chips; highlights when selected
- [x] 7.2 Create `src/features/prompts/PromptListView.tsx` — scrollable list of `PromptCard` components sorted by `updatedAt` desc, with empty-state message when no prompts exist
- [x] 7.3 Wire card click to dispatch `SELECT` action in `PromptsContext`
- [x] 7.4 Add "New Prompt" button above the list that opens the editor in create mode

## 8. Feature UI — Prompt Editor Form

- [x] 8.1 Create `src/features/prompts/PromptEditor.tsx` with fields: `title` (text), `content` (textarea ≥8 lines), `description` (text), `tags` (tokenized chip input), `model` (text), `temperature` (numeric 0–2, step 0.1)
- [x] 8.2 Implement tag chip input: accept comma-separated or Enter-delimited input, render chips, allow removing individual chips
- [x] 8.3 Implement create mode: on submit call `promptRepository.create()` and dispatch `ADD` action; show inline validation errors for blank `title` or `content`
- [x] 8.4 Implement edit mode: pre-fill fields from selected prompt, on submit call `promptRepository.update()` and dispatch `UPDATE` action
- [x] 8.5 Add "Cancel" button and close affordance (×) that dismiss the form without persisting changes

## 9. Feature UI — Prompt Detail Panel

- [x] 9.1 Create `src/features/prompts/PromptDetailPanel.tsx` — side panel showing `title`, `tags`, `description`, rendered Markdown `content`, and optional `model`/`temperature` metadata rows
- [x] 9.2 Render `createdAt` and `updatedAt` as human-readable dates
- [x] 9.3 Add "Edit" button that opens `PromptEditor` in edit mode pre-filled with the selected prompt
- [x] 9.4 Add "Delete" button that opens a `Modal` confirmation; on confirm call `promptRepository.delete()` and dispatch `REMOVE` action; dismiss the panel
- [x] 9.5 Add "Copy" button that writes raw Markdown `content` to the clipboard and shows a success `Toast`
- [x] 9.6 Hide/unmount the panel when no prompt is selected

## 10. App Layout & Wiring

- [x] 10.1 Create `src/app/App.tsx` that renders a two-column layout: `PromptListView` on the left, `PromptDetailPanel` on the right
- [x] 10.2 Wrap the app with `PromptsProvider` in `src/main.tsx`
- [x] 10.3 Import `src/styles/index.css` in `src/main.tsx`
- [x] 10.4 Smoke-test the full flow: create a prompt, view it in the list, open the detail panel, edit it, delete it
