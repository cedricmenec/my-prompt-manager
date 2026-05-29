## Context

The repo is currently empty of source code — only OpenSpec planning files exist. This change creates the entire working application from scratch: project scaffolding, domain model, persistence layer, and React feature UI for prompts. It is the first and most cross-cutting change in the project, touching every architectural layer defined in `project.md`.

## Goals / Non-Goals

**Goals:**
- Establish a running Vite + React 19 + TypeScript 5 + Tailwind v4 dev environment
- Define the canonical `Prompt` domain model and its Zod validation schema
- Implement a YAML frontmatter parser/serializer compatible with the original Markdown format
- Implement the `promptRepository` IndexedDB adapter (full CRUD + bulk import)
- Build the prompts feature UI: list view, detail panel, create/edit form, delete flow
- Wire state management with React context + `useReducer`
- Add the shared UI primitives required by the prompts feature

**Non-Goals:**
- No AI/BYOK integration in this change
- No Google Drive sync
- No encryption
- No search/filtering (Fuse.js integration deferred)
- No routing beyond the single-screen dashboard
- No import/export UI (bulk import adapter only, no file picker)

## Decisions

### 1. `idb` as the IndexedDB wrapper
**Decision**: Use the `idb` package instead of raw IndexedDB or a heavier ORM (Dexie, RxDB).  
**Rationale**: `idb` adds typed Promise wrappers with minimal overhead (~1KB), keeping the infrastructure layer thin. Dexie adds reactivity and schema migration complexity we don't need yet. RxDB is far too heavy for a local-only MVP.  
**Alternative rejected**: Raw `indexedDB` API — verbose, error-prone, no TypeScript ergonomics.

### 2. React context + `useReducer` for state management
**Decision**: Use `React.createContext` + `useReducer` for prompt state, not Zustand, Redux, or Jotai.  
**Rationale**: The prompts feature is the only stateful domain in scope. A context+reducer is sufficient, avoids a third-party dependency, and is idiomatic with React 19's new compiler. External stores can be adopted later if cross-feature state grows.  
**Alternative rejected**: Zustand — adds a dependency for no benefit at this scope.

### 3. Zod for domain validation at the boundary
**Decision**: Zod schema is the single source of truth for `Prompt` shape; the TypeScript type is inferred from it (`z.infer<typeof PromptSchema>`).  
**Rationale**: Ensures runtime safety when parsing YAML frontmatter from user files. Validation errors surface early at the repository boundary, not in render code.  
**Alternative rejected**: Manual TypeScript types with no runtime validation — unsafe for user-supplied Markdown files.

### 4. YAML frontmatter parser: `js-yaml` + custom regex splitter
**Decision**: Write a thin `markdownParser.ts` that splits `---` frontmatter, parses with `js-yaml`, and validates with the Zod schema.  
**Rationale**: No existing library in the stack handles the full roundtrip (parse → validate → serialize back to Markdown). A ~60-line custom module is simpler than adding `gray-matter` (CommonJS, heavier) or `vfile`.  
**Alternative rejected**: `gray-matter` — CJS-first, heavier, not tree-shakeable with Vite ESM.

### 5. Single IndexedDB object store `prompts` keyed by `id` (UUID)
**Decision**: One object store, `id` as keyPath (UUIDv4 generated at create time), indexed on `updatedAt` and `tags`.  
**Rationale**: Simple enough for MVP. No relational data. UUIDs avoid collisions during future Drive-sync merge.  
**Deferred**: Full-text index deferred to the search feature change.

### 6. Tailwind v4 with CSS-first configuration
**Decision**: Use Tailwind v4's CSS `@import "tailwindcss"` entry point and `@theme` for design tokens, not `tailwind.config.js`.  
**Rationale**: Tailwind v4 is already specified in `project.md`. The CSS-first config is idiomatic for v4 and avoids the PostCSS config gymnastics of v3.

## Risks / Trade-offs

- **[Risk] IndexedDB schema migration** — If the `Prompt` model changes in a future iteration, existing DB stores may need migration. → Mitigation: bump `DB_VERSION` constant and add `onupgradeneeded` handlers in `promptRepository`; document the version in the repo.
- **[Risk] YAML frontmatter edge cases** — User-authored Markdown may have malformed frontmatter. → Mitigation: Zod `safeParse` returns typed errors; UI shows a non-blocking validation warning rather than crashing.
- **[Risk] React 19 + Vite stability** — React 19 and the new compiler are still recent. → Mitigation: Pin exact versions in `package.json`; disable the compiler if it causes issues (it's opt-in).
- **[Risk] Tailwind v4 DX** — v4 tooling is newer; IDE autocomplete and PostCSS support may lag. → Mitigation: Use the official `@tailwindcss/vite` plugin (first-class Vite support).

## Migration Plan

Greenfield — no existing code to migrate. Steps:
1. Scaffold project (`pnpm create vite`, configure TS/Tailwind/aliases).
2. Implement domain layer (`Prompt` model, Zod schema, parser).
3. Implement infrastructure layer (`promptRepository`).
4. Implement feature UI (`features/prompts`).
5. Verify `pnpm dev` serves the app and `pnpm test` passes.

No rollback strategy needed (no production deployment yet).

## Open Questions

- Should `tags` be stored as an array of strings or a normalized join structure? → Assuming plain `string[]` for MVP; normalization deferred until search/filter feature.
- Exact fields for the `Prompt` model — `model`, `temperature` are listed in the proposal but may be premature. → Include as optional fields so they don't block the editor form; can be removed in a later spec revision.
