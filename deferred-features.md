# Deferred Features

Features deliberately scoped out of the `manual-import-export` change.

## Import merge strategy

**Description**: Instead of replacing all existing prompts on import, offer a merge mode that skips prompts whose `id` already exists in the store, or lets the user choose per-conflict.

**Why deferred**: The overwrite strategy is simpler and covers the primary backup/restore use-case. A merge strategy requires a conflict-resolution UI that would significantly increase scope.

---

## Auto-backup to the browser file system

**Description**: Periodically write an export snapshot to a user-approved directory via the File System Access API, so no manual action is required.

**Why deferred**: The File System Access API has limited cross-browser support and requires additional UX for permission management. Manual export is sufficient for V1.

---

## Cloud / Google Drive sync

**Description**: Allow the user to connect a Google Drive (or Dropbox/OneDrive) account and automatically sync their prompts across devices.

**Why deferred**: Requires OAuth flows, a backend or a GAPI client integration, and ongoing token management — out of scope for a local-first, no-backend app.

---

## Export selection (subset export)

**Description**: Let the user select a subset of prompts (e.g., by collection/tag) and export only those.

**Why deferred**: Low demand for V1; the full export is a useful baseline. A multi-select UI across the list view is a bigger UX change.

---

## Editable prompt input assistant system prompts

**Description**: Add a UI for viewing, editing, versioning, and restoring the system prompts used by the Prompt input assistant for title and description generation.

**Deferred follow-up**: The current implementation keeps title and description generation prompts in an isolated hardcoded module. Future work should let users inspect the active prompt, create revisions, restore defaults, and possibly scope variants per AI feature or model.

**Why deferred**: Editable generation instructions require versioning UX, validation, reset behavior, and import/export semantics. Hardcoded isolated prompts are sufficient for the first explicit generation workflow.
