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

## AI provider/model settings foundation

**Description**: The Settings panel now includes an `API & Models` section for session-only OpenRouter key entry, model catalog loading, cached model metadata, and enabled model selection stored in IndexedDB.

**Deferred follow-up**: Encrypted Vault persistence for API keys is intentionally deferred. Persistent BYOK secrets must not be offered until a local encrypted vault stores sensitive material with a user-controlled passphrase and keeps decrypted keys in memory only.

**Why deferred**: This change establishes provider/model selection without persisting raw API keys. Storing API keys in clear text in localStorage or IndexedDB would violate the local-first BYOK security model.
