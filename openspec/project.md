# BYO Prompt Manager — Web App

## Purpose

Browser-based prompt manager for power users and LLM agent developers who maintain a personal library of prompts.

Goals:
- Provide a fast, frictionless prompt management experience entirely in the browser, with no backend, no account, and no cloud dependency by default.
- Preserve the Markdown + YAML frontmatter format from the original project for full interoperability with Git-based vaults and external editors.
- Store all data locally in IndexedDB as the single source of truth; cloud sync is opt-in.
- Add lightweight BYOK AI features (prompt improvement, description generation, tag suggestions) using user-provided API keys.
- Deploy as static files to GitHub Pages with zero server infrastructure.

Non-goals for MVP:
- No server-side component, no backend API, no database.
- No multi-user features, no shared collections, no authentication beyond Google OAuth for Drive sync.
- No real-time file watcher or edit conflict detection (replaced by explicit import/export).
- No template/placeholder instantiation system.

---

## Tech Stack

| Concern | Technology |
|---|---|
| Build tool | Vite (latest stable) |
| UI framework | React 19 |
| Language | TypeScript 5 — strict mode |
| Styling | Tailwind CSS v4 |
| Local storage | IndexedDB (via `idb` thin wrapper) |
| Fuzzy search | Fuse.js |
| Markdown / YAML | `js-yaml` + custom frontmatter parser |
| Schema validation | Zod |
| Encryption | Web Crypto API (AES-GCM, PBKDF2) |
| Google Drive sync | Google Drive REST API v3 + OAuth 2.0 (PKCE) |
| AI providers | OpenAI API, OpenRouter API, custom OpenAI-compatible endpoints |
| Testing | Vitest |
| Deployment | GitHub Pages (`gh-pages` package or GitHub Actions) |

---

## Project Conventions

### Code Style

- TypeScript `strict: true` (`noImplicitAny`, `strictNullChecks`, `exactOptionalPropertyTypes`).
- Prefer explicit return types on public functions and domain services.
- ESLint with TypeScript + React ruleset enforced on CI.
- Prettier as sole formatting authority (100-char line width, trailing commas in ES5 positions).
- No `any` casts in domain and infrastructure layers; limited to third-party adapter boundaries only.

### Naming Conventions

- React components: **PascalCase** — `PromptList.tsx`, `PromptCard.tsx`.
- Custom hooks: **camelCase** with `use` prefix — `usePromptSearch.ts`, `useDriveSync.ts`.
- Non-component modules: **camelCase** — `promptRepository.ts`, `markdownParser.ts`, `driveClient.ts`.
- Types and interfaces: **PascalCase**, no `I` prefix, props types suffixed with `Props`.
- Tests colocated with implementation: `markdownParser.test.ts`, `PromptList.test.tsx`.

### Import Conventions

- Absolute imports via TypeScript path aliases (`@/features/...`, `@/domain/...`, `@/shared/...`).
- Domain layer must not import from React or browser APIs; only from its own modules and standard libraries.
- Infrastructure layer wraps all browser APIs (IndexedDB, Clipboard, Web Crypto) in typed adapters.

### Folder Structure

```
src/
├── app/                    — App shell, React providers, router, global error boundary
├── features/
│   ├── prompts/            — Dashboard, prompt list, grid, detail panel, editor, search bar
│   ├── settings/           — API key management, AI provider config, import/export
│   └── drive-sync/         — Google Drive OAuth flow, sync UI, conflict resolution
├── shared/
│   ├── ui/                 — Reusable primitives (Button, Badge, Modal, Toast, Input…)
│   ├── hooks/              — Cross-feature hooks (useClipboard, useDebounce, useLocalStorage…)
│   └── lib/                — Pure utilities (debounce, slug, date formatting…)
├── domain/                 — Domain models and pure services (no React, no browser APIs)
├── infrastructure/         — Browser API adapters (IndexedDB, clipboard, crypto, Drive client)
├── assets/                 — Icons, SVG, static images
└── styles/                 — Tailwind base and global CSS entry point
```

---

## Architecture

### Overview

Single-page application (SPA). No routing complexity in MVP; the app is a single-screen dashboard with a side panel for detail/edit.

```
UI Events (React)
  → State update (React context + reducers)
  → Domain validation (Zod)
  → IndexedDB persistence (promptRepository)
  → Optional encryption (Web Crypto)
  → Optional AI call (BYOK provider client)
  → Optional Drive sync (Google Drive API)
  → Re-render
```

### Domain Layer (pure TypeScript)

Models:
- `Prompt` — core entity with all metadata and body.
- `PromptMetadata` — subset of fields used for list rendering and search indexing.
- `Tag`, `Language`, `PromptType` — value types and enums.
- `ValidationResult` — result of lenient validation (valid | incomplete with field list).

Services:
- `MarkdownParser` — parses `.md` files with YAML frontmatter (using `js-yaml`). Produces a `Prompt` or a `ParseError`. Used for import only.
- `MarkdownSerializer` — serializes a `Prompt` back to `.md` format. Used for export only.
- `SearchService` — builds and queries a Fuse.js index over `PromptMetadata[]`.
- `ValidationService` — lenient schema validation; marks incomplete prompts instead of rejecting them.
- `ExportService` — produces JSON export payloads (single prompt or full collection).

### Infrastructure Layer (browser adapters)

- `promptRepository` — CRUD over IndexedDB (`idb`). Schema versioned, migrations handled.
- `settingsRepository` — small preferences in `localStorage` (theme, last-used view mode, last-used filters).
- `clipboardAdapter` — wraps `navigator.clipboard.writeText`.
- `cryptoVault` — Web Crypto-based encrypt/decrypt (AES-GCM, key derived via PBKDF2 from a user passphrase). Used for Drive snapshot encryption and optional API key persistence.
- `driveClient` — Google Drive REST API v3 client. Handles OAuth token lifecycle (PKCE flow), file read/write, metadata.
- `aiProviderClient` — unified OpenAI-compatible API client. Supports OpenAI, OpenRouter, and any custom base URL.

### UI Layer (React)

Components:
- `Dashboard` — main view: search bar, filter bar, prompt list or grid, favorites section.
- `PromptCard` / `PromptListRow` — compact display of one prompt with copy button and favorite toggle.
- `PromptDetailPanel` — full metadata + body + actions (copy, edit, AI actions, export).
- `PromptEditor` — create/edit form with Markdown body textarea and metadata fields.
- `SettingsPanel` — API key management, AI provider selector, Drive sync configuration.
- `DriveSyncStatus` — sync state indicator, last sync time, manual sync button.
- `ImportExportPanel` — Markdown file import (batch), JSON export.

State management:
- React context + `useReducer` for:
  - Prompt collection and filtered/sorted subset.
  - Search query and active filter state.
  - Selected prompt and editor state.
  - AI operation state (idle / loading / result / error).
  - Drive sync state.
  - Settings (API keys in session memory only, not in context).

---

## Domain Context

### Data Model

Each prompt is stored as a JSON object in IndexedDB. The schema matches the original Markdown frontmatter model for interoperability.

```typescript
interface Prompt {
  id: string;           // UUID v4, stable identifier
  title: string;        // Required
  tags: string[];       // Normalized to lowercase, trimmed
  language: "fr" | "en" | "multi";
  description: string;  // Optional; triggers "Incomplete" badge if missing
  usage: string;        // Optional; triggers "Incomplete" badge if missing
  type: "system" | "user" | "tool" | "image" | "agent" | "other";
  body: string;         // Prompt text
  favorite: boolean;
  incomplete: boolean;  // Set by ValidationService; not stored, derived on load
  createdAt: string;    // ISO 8601
  updatedAt: string;    // ISO 8601
}
```

No `.promptignore`, no vault subdirectories, no `deletedAt` soft-delete in MVP.

### Prompt Management

- **Create**: form with all metadata fields + Markdown body editor. Auto-generates a UUID. Body is free text.
- **Read**: all prompts loaded into memory on startup; no lazy loading for MVP (target: thousands of prompts).
- **Update**: same form as create, pre-populated.
- **Delete**: confirmation dialog before deletion. Permanent (no trash or soft-delete in MVP).
- **Favorite toggle**: single click from list or card view.

### Validation (Lenient)

`ValidationService` marks a prompt as `incomplete` if any of the following optional fields are absent: `description`, `usage`. An "Incomplete" badge is shown on the card and in the detail panel. The prompt is fully functional despite the badge.

`title` is the only truly required field; a prompt without a title cannot be saved.

`language` and `type` default to `"en"` and `"user"` respectively if absent on import.

### Dashboard & Navigation

- **Default view**: list view (title, tags, language, type, description excerpt, favorite toggle, copy button).
- **Grid view**: cards with the same subset of fields. Toggle between list and grid persisted in `localStorage`.
- **Sorting**: favorites always first, then non-favorites, both groups sorted alphabetically by `title`. No user-configurable sort in MVP.
- **Favorites filter**: toggle to show only favorites.

### Search & Filters

- **Global search bar**: Fuse.js fuzzy search over `title`, `description`, `usage`, `tags`, `type`, `language`, `body`.
- **Tag filter**: multi-select from existing tags. Intersection logic (prompt must match all selected tags).
- **Language filter**: single select (fr / en / multi / all).
- **Type filter**: single select (system / user / tool / image / agent / other / all).
- Filters applied first; fuzzy search runs on the filtered subset.
- Filter state is not persisted; resets on page reload.

### Copy & Clipboard

- **Raw copy button** on each card and in the detail panel. Copies `body` unmodified.
- Visual feedback: button label or icon transitions to "Copied!" for 1.5 s, then reverts.
- Uses `navigator.clipboard.writeText` (requires HTTPS; satisfied by GitHub Pages).

### Import / Export

**Import (Markdown)**:
- User selects one or multiple `.md` files via `<input type="file" multiple accept=".md">`.
- `MarkdownParser` parses each file (frontmatter + body).
- `ValidationService` runs lenient validation.
- Conflict resolution on import: if a prompt with the same `title` exists, user is prompted (skip / overwrite).
- New prompts receive a fresh UUID and `createdAt`.
- Batch import shows a summary (imported / skipped / errors).

**Export (Markdown)**:
- Single prompt: downloads `<slug>.md` with YAML frontmatter + body.
- Full collection: downloads a `.zip` file containing one `.md` per prompt (browser-native `showSaveFilePicker` or fallback to `<a download>`).

**Export (JSON)**:
- Single prompt or full collection exported as `prompts_export.json`.
- Schema mirrors the `Prompt` model minus internal fields (`incomplete`, `favorite`).

### AI Features (BYOK)

AI actions are opt-in and surfaced in the prompt detail panel:
- **Improve prompt**: sends the current `body` to the configured AI provider and shows a suggested rewrite. User can accept (replaces body), copy, or discard.
- **Generate description**: generates a short `description` from the `body`. User can accept or discard.
- **Suggest tags**: generates a list of suggested tags. User selects which to add.

**Provider configuration** (in Settings):
- Choose provider: OpenAI, OpenRouter, or custom (base URL).
- Enter API key.
- Choose model (free text, defaults provided per provider).
- API key storage: **session-only by default** (held in React state, lost on page reload). User can opt in to encrypted persistence (AES-GCM, key derived from a passphrase via PBKDF2, stored encrypted in IndexedDB).

**AI call behavior**:
- Validate key and model before calling.
- Uses `AbortController` for cancellation (cancel button shown during generation).
- Clear warning displayed before any call: "This action sends your prompt content to [provider]. Your API key and usage costs are your responsibility."
- Handles: missing key, invalid key, rate limit (429), billing error (402), network failure, CORS failure.

### Google Drive Sync

Optional. Stores the entire prompt collection as a single encrypted JSON snapshot on the user's Google Drive.

**Setup**:
- Requires a Google Cloud OAuth 2.0 client ID configured by the developer and embedded in the app's `config.ts` (public, no secret).
- The Google Cloud app must have the `drive.file` scope authorized.

**Auth flow**:
- Authorization Code + PKCE (public client, no client secret).
- Access token stored in `sessionStorage`; refresh token stored encrypted in IndexedDB (if user opts in).
- Disconnect button clears all tokens.

**Sync files on Drive**:
```
/prompt-manager/vault.json.enc     — current encrypted snapshot
/prompt-manager/metadata.json      — unencrypted: version, last sync timestamp
/prompt-manager/backups/vault-<ISO-datetime>.enc — automatic backup before overwrite
```

**Sync workflow**:
1. Authenticate (OAuth).
2. Read `metadata.json` from Drive.
3. Compare `version` with local IndexedDB state.
4. If remote is newer: download, decrypt, merge into local IndexedDB.
5. If local is newer: encrypt, upload, update `metadata.json`.
6. Always create a timestamped backup before overwriting remote.
7. Conflict (both modified since last sync): show diff summary; user chooses "keep local" or "use remote".
8. Show sync status and last sync time in the UI.

**Encryption**:
- Snapshot is encrypted with AES-GCM.
- Key is derived from the same user passphrase used for the local API key vault (PBKDF2, 600 000 iterations, SHA-256).
- IV and salt stored alongside the encrypted blob.

---

## Important Constraints

- **Static-only**: no server, no backend, no serverless functions. All logic runs in the browser.
- **Offline-first**: the app must be fully functional without a network connection (Drive sync and AI features gracefully degrade).
- **HTTPS required**: Clipboard API and OAuth redirects require a secure origin. GitHub Pages satisfies this by default.
- **No shared secrets**: the Google OAuth client ID is public. No client secret is embedded. API keys are user-owned.
- **Personal use**: the BYOK model is appropriate for personal or small-team use. Not suitable for shared deployments where the app owner controls a platform API key.
- **Browser compatibility**: target modern evergreen browsers (Chrome 110+, Firefox 115+, Edge 110+). No IE11 support.
- **Scale target**: designed for a few hundred to a few thousand prompts. Full collection loaded in memory on startup; no pagination needed for MVP.

---

## External Dependencies

| Dependency | Purpose | Notes |
|---|---|---|
| `idb` | IndexedDB wrapper | Thin typed wrapper, no ORM |
| `fuse.js` | Fuzzy search | Client-side, in-memory |
| `js-yaml` | YAML frontmatter parsing/serialization | Import/export only |
| `zod` | Schema validation | Domain models and import validation |
| Google Drive API v3 | Cloud sync | User-owned OAuth, `drive.file` scope only |
| OpenAI-compatible APIs | BYOK AI features | User-provided key and endpoint |
| `jszip` | Batch Markdown export as ZIP | Export only |

---

## Testing Strategy

Scope: **unit tests only** for MVP.

Focus on domain services and infrastructure adapters:
- `MarkdownParser`: valid frontmatter, missing fields, invalid YAML, body extraction, roundtrip with `MarkdownSerializer`.
- `ValidationService`: complete prompt, missing optional fields, missing title.
- `SearchService`: fuzzy matching, filter combinations, empty query, no results.
- `cryptoVault`: encrypt/decrypt roundtrip, wrong passphrase handling.
- `aiProviderClient`: request shape, error mapping (401, 429, 402, network error).

Test location: colocated with implementation (`*.test.ts`).
No filesystem or real network calls in tests; all browser APIs mocked.
No coverage threshold for MVP; priority is happy paths and critical error paths.

---

## Security Notes

- Google OAuth client ID is public and intentionally included in source. No client secret exists for browser-only PKCE flows.
- API keys must never be logged, included in error reports, or sent to any endpoint other than the declared provider.
- `innerHTML` must not be used to render user-supplied prompt content; use `textContent` or DOM construction.
- The Drive sync passphrase is never stored; only the encrypted output and its derivation parameters (salt, IV) are persisted.
- Content Security Policy headers should be configured on GitHub Pages (via `_headers` or equivalent) to restrict script sources.
