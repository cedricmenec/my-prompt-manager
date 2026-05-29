## Why

The application has no working code yet — it's a blank repo with only specs and configuration. The prompt CRUD skeleton is the foundational scaffold required before any other feature can be built: it establishes the domain model, IndexedDB persistence layer, React feature shell, and the basic UI to list, view, create, edit, and delete prompts.

## What Changes

- Scaffold the Vite + React 19 + TypeScript 5 project (package.json, tsconfig, vite.config, Tailwind v4, path aliases)
- Define the `Prompt` domain model (TypeScript type, Zod schema, YAML frontmatter parser)
- Implement the `promptRepository` IndexedDB adapter (CRUD operations via `idb`)
- Create the `features/prompts` feature shell: list view, prompt card, detail/preview panel, create/edit form, delete confirmation
- Wire up React context + reducers for prompt state management
- Add basic shared UI primitives needed by the feature: `Button`, `Input`, `Modal`, `Badge`
- Provide a working dev setup (`pnpm dev` serves the app) and initial Vitest config

## Capabilities

### New Capabilities

- `prompt-model`: Core `Prompt` domain type, Zod schema, and YAML frontmatter parser/serializer
- `prompt-repository`: IndexedDB persistence adapter — `getAll`, `getById`, `create`, `update`, `delete`, `bulkImport`
- `prompt-list-view`: Dashboard list/grid of prompts with title, tags, and description; supports select
- `prompt-detail-panel`: Side panel showing full prompt content (Markdown rendered) with edit and delete actions
- `prompt-editor`: Create / edit form with fields: title, content (textarea), tags, description, model, temperature
- `project-scaffold`: Vite + React + TypeScript + Tailwind project structure, path aliases, Vitest config

### Modified Capabilities

<!-- No existing specs to modify — specs/ is empty -->

## Impact

- Creates `src/` folder with the full initial project structure
- Adds `package.json`, `tsconfig.json`, `vite.config.ts`, `tailwind.config.ts`, `index.html`
- No external API calls, no auth, no encryption in this change — those come later
- No breaking changes (greenfield)
