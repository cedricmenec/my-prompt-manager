## Context

The application stores prompts in IndexedDB via a Zod-validated schema (`PromptSchema`). The schema is the single source of truth for all prompt fields. The detail panel (`PromptDetailPanel`) is currently stateless regarding its own visibility — it relies entirely on `selectedPromptId` in `PromptsContext`. The list view renders `PromptRow` items inside a plain flex column with no max-width constraint.

Three independent improvements are bundled here because they are small, low-risk, and share no cross-cutting concerns: a schema field addition, a UI close action, and a layout constraint.

## Goals / Non-Goals

**Goals:**
- Add `notes?: string` to the prompt schema and propagate it through parser, editor, and detail panel
- Allow users to close the detail panel without selecting another prompt
- Constrain list-mode rows to a readable maximum width on wide screens

**Non-Goals:**
- Rich-text / Markdown rendering of notes (plain text only)
- Notes search or filtering
- Persisting panel-open/closed state across sessions
- Redesigning the list layout beyond the max-width constraint

## Decisions

### 1. `notes` stored in YAML frontmatter (not in `content` body)

**Decision**: `notes` is a frontmatter field, stored alongside `description`, `model`, and `temperature`.

**Rationale**: Keeping structured metadata in frontmatter preserves the invariant that `content` is the raw prompt text. Mixing notes into the body would require a parsing convention (e.g., a `## Notes` heading), adding complexity for no gain.

**Alternative considered**: Store notes as a special section in `content` — rejected because it conflates prompt text with author notes and breaks the clean frontmatter/body split.

### 2. `DESELECT` action added to `PromptsContext` reducer

**Decision**: A dedicated `DESELECT` action sets `selectedPromptId` to `null`.

**Rationale**: `SELECT` already accepts any `id`; a `DESELECT` action is semantically clearer at the call site and avoids callers passing `null` explicitly.

**Alternative considered**: Reuse `SELECT` with `id: null` — rejected for legibility; `DESELECT` is self-documenting.

### 3. Max-width via Tailwind utility on the list container

**Decision**: Wrap the `<ul>` in list mode with `max-w-3xl mx-auto` on the container div.

**Rationale**: `max-w-3xl` (48rem / 768px) provides a comfortable reading width without over-constraining on medium screens. `mx-auto` centres the list when space allows.

**Alternative considered**: `max-w-2xl` — slightly too narrow for rows showing title + description + tags. `max-w-4xl` — tested but feels loose. `max-w-3xl` is the best balance.

### 4. `notes` field is `optional()` with no default

**Decision**: `notes: z.string().optional()` — no `.default('')`.

**Rationale**: An absent `notes` field should not be serialized to frontmatter as an empty string. The UI treats `undefined` and `''` identically (empty textarea), and the detail panel section is hidden when `notes` is falsy.

## Risks / Trade-offs

- **Schema migration**: Existing prompts in IndexedDB lack `notes`. Since the field is optional, Zod validation continues to pass — no migration script needed.
- **Frontmatter round-trip**: If `notes` contains newlines, `js-yaml` must quote the string correctly. This is handled automatically by `js-yaml`'s `dump()`.
- **List max-width UX**: On very narrow screens the constraint has no visible effect (the list is already narrower than 3xl). No regressions expected.
