## ADDED Requirements

### Requirement: Vite + React + TypeScript project initialisation
The system SHALL provide a `package.json` bootstrapped with Vite (latest stable), React 19, and TypeScript 5 in strict mode. The project SHALL use `pnpm` as the package manager. The following scripts SHALL be defined:
- `pnpm dev` — starts the Vite dev server
- `pnpm build` — produces an optimised production bundle in `dist/`
- `pnpm preview` — serves the production bundle locally
- `pnpm test` — runs the Vitest test suite

#### Scenario: Dev server starts without errors
- **WHEN** `pnpm dev` is run in a fresh checkout with dependencies installed
- **THEN** the Vite dev server starts and the app is accessible at `http://localhost:5173` with no console errors

#### Scenario: Production build succeeds
- **WHEN** `pnpm build` is run
- **THEN** it exits with code 0 and a `dist/index.html` is produced

---

### Requirement: TypeScript strict mode configuration
The system SHALL include a `tsconfig.json` that enables `strict: true`, `noImplicitAny`, `strictNullChecks`, and `exactOptionalPropertyTypes`. Path aliases SHALL be configured so that `@/` resolves to `src/`.

#### Scenario: Path alias resolves at compile time
- **WHEN** a TypeScript file imports `@/domain/promptSchema`
- **THEN** the TypeScript compiler resolves it to `src/domain/promptSchema.ts` without error

#### Scenario: Implicit any causes a type error
- **WHEN** a function parameter has no type annotation
- **THEN** `tsc --noEmit` reports a type error for that parameter

---

### Requirement: Tailwind CSS v4 integration
The system SHALL configure Tailwind CSS v4 using the `@tailwindcss/vite` plugin and a CSS entry point that uses `@import "tailwindcss"`. Design tokens (brand colours, font sizes) SHALL be defined under `@theme` in the CSS entry point rather than in a JavaScript config file.

#### Scenario: Tailwind utility classes apply in the browser
- **WHEN** a component uses a Tailwind class such as `text-primary` or `bg-surface`
- **THEN** the corresponding CSS is included in the browser output with no PostCSS errors

---

### Requirement: Folder structure conventions
The project source SHALL follow the folder layout defined in `project.md`:
```
src/
├── app/
├── features/prompts/
├── shared/ui/
├── shared/hooks/
├── shared/lib/
├── domain/
├── infrastructure/
├── assets/
└── styles/
```
Each folder SHALL contain at minimum a placeholder file or first implementation module.

#### Scenario: Folder structure matches the project spec
- **WHEN** the scaffolded project is inspected
- **THEN** all folders listed above exist under `src/`

---

### Requirement: Vitest configuration
The system SHALL include a Vitest configuration (in `vite.config.ts` or a separate `vitest.config.ts`) with:
- `environment: 'jsdom'` for React component tests
- `globals: true` so that `describe`/`it`/`expect` are available without explicit imports
- Coverage support via `@vitest/coverage-v8`

#### Scenario: A basic unit test passes
- **WHEN** `pnpm test` is run with a trivial passing test
- **THEN** Vitest exits with code 0 and reports 1 test passed
