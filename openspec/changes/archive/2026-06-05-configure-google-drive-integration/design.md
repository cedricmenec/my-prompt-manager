## Context

The app is a static React/Vite local-first prompt manager. The primary data store is IndexedDB,
manual JSON import/export already exists, and the Settings panel currently exposes Sync as a
non-interactive placeholder.

This change introduces a Google Drive integration owned by the user. The app remains static-only:
there is no backend, serverless function, shared OAuth secret, SaaS account, or app-owner cloud
tenant. The first Drive use cases are visible-folder import/export and snapshots. Hidden
appDataFolder synchronization is intentionally deferred.

## Goals / Non-Goals

**Goals:**
- Let the user configure their own Google OAuth Client ID.
- Let the user configure a visible Drive folder they created outside the app.
- Provide connect, disconnect, status, and folder access test flows.
- Support Drive-backed exports/imports and visible snapshots for prompt data.
- Keep prompt exports and snapshots unencrypted by default.
- Exclude all sensitive credentials and tokens from exports and snapshots.
- Document Google Cloud setup, Drive folder setup, scopes, reconnect behavior, and data boundaries.

**Non-Goals:**
- No Google OAuth client secret support.
- No backend token exchange or server-side token storage.
- No encrypted vault for API keys or connector secrets.
- No export of sensitive configuration.
- No hidden appDataFolder sync.
- No conflict resolution or bidirectional sync engine.
- No Drive Picker integration unless a later change explicitly adds it.

## Decisions

### Use a user-provided OAuth Client ID

The Google OAuth Client ID is configured by the user and persisted as non-sensitive local
configuration. This keeps the app aligned with the BYOK/local-first model: each user owns their
Google Cloud OAuth configuration and Drive account.

Alternatives considered:
- Project-provided Client ID: simpler UX, but introduces a central administrative dependency and
  is less aligned with user-owned deployments.
- Client secret: not viable in a browser-only static app because it would be exposed to users.

### Use browser-compatible session-only OAuth

Drive operations use a browser-compatible Google OAuth flow for a public client. Access tokens are
kept only for the current browser session and cleared on disconnect or expiry. The implementation
must not persist refresh tokens or OAuth secrets.

Alternatives considered:
- Authorization code exchange with refresh token persistence: better long-lived automation, but
  normally requires a backend/token exchange component or an encrypted vault policy that is not in
  scope.
- Long-lived local tokens: convenient, but conflicts with the current decision to avoid secret
  persistence.

### Configure a visible folder by URL or ID

The user creates the Drive folder manually and pastes either its URL or folder ID into Settings.
The app normalizes this input and tests access through the Drive API.

Alternatives considered:
- App creates the folder automatically: slightly easier after connection, but the user explicitly
  wants to create the folder themselves.
- Google Drive Picker: better UX for browsing, but adds scope, dependency, and configuration
  complexity that is not needed for the first implementation.

### Treat exports and snapshots as non-sensitive prompt artifacts

Prompt exports and snapshots may be stored in clear text in the visible Drive folder. They include
prompt data, local prompt image assets, schema metadata, app metadata, and explicitly non-sensitive
settings only. They never include API keys, OAuth tokens, refresh tokens, client secrets,
passphrases, or connector secrets.

Alternatives considered:
- Encrypt all snapshots: stronger confidentiality, but not currently required because prompt data
  is treated as non-sensitive and this would introduce vault/passphrase complexity.
- Include connector/API configuration in snapshots: convenient for migration, but unsafe without a
  vault and explicitly out of scope.

### Separate visible backups from future hidden sync

The visible Drive folder is used for user-visible import/export and snapshots. Future
appDataFolder sync remains a separate capability because it has different UX, conflict handling,
and storage semantics.

Alternatives considered:
- Use appDataFolder immediately for all Drive operations: cleaner for sync, but does not satisfy
  the requirement that users see import/export artifacts outside the app.
- Use visible folder for sync: possible, but more exposed to manual edits and better handled after
  conflict policies are designed.

### Extend current import/export instead of replacing it

Existing local JSON import/export remains available. Google Drive import/export adds a second
source/destination path that reuses the current envelope, parsing, validation, and confirmation
logic as much as possible.

Alternatives considered:
- Build a separate Drive-specific format: unnecessary duplication and a migration burden.
- Replace local import/export with Drive-only workflows: violates offline-first behavior and makes
  Drive a runtime dependency.

## Risks / Trade-offs

- OAuth expiry interrupts Drive operations -> show an expired/disconnected state and require
  reconnect without modifying local prompt data.
- Folder URL/ID configuration is less polished than a picker -> document the setup and provide a
  clear folder access test.
- Snapshots in clear text may surprise users -> document that prompts are considered non-sensitive
  and that secrets are never included.
- Automatic snapshots may create many files -> use a configurable interval, default 15 minutes,
  and only snapshot when exportable data changed.
- Drive API scope verification may require Google Cloud setup work -> document required setup and
  keep scopes minimal.
- No refresh token means unattended snapshots may fail after session expiry -> make automatic
  snapshots best-effort while connected and document reconnect behavior.

## Migration Plan

1. Add non-sensitive Drive configuration persistence for Client ID, folder ID, snapshot enabled
   state, snapshot interval, last snapshot metadata, and exportable-data change marker.
2. Add Google Drive infrastructure adapters for OAuth session state, folder access testing, file
   listing/upload/download, and error mapping.
3. Replace the Settings Sync placeholder with Google Drive configuration and status controls.
4. Add Drive export/import actions that reuse existing import/export validation and confirmation.
5. Add visible snapshot creation and restore preparation.
6. Add automatic snapshot scheduling that runs only while Drive is connected and data changed.
7. Update project documentation with setup, permissions, usage, and data-boundary notes.

Rollback is straightforward: the new local configuration is non-sensitive and can be ignored or
deleted. Existing prompt data and local import/export behavior remain unchanged.

## Open Questions

- Which exact minimal Google Drive scopes should the first implementation request for visible
  folder import/export: `drive.file`, a narrower file scope where possible, or a staged scope
  strategy?
- Should Drive exports and snapshots use one shared folder root with `exports/` and `snapshots/`
  subfolders, or should the app write all files directly into the configured folder?
- Should automatic snapshots be enabled by default after Drive folder access succeeds, or should
  the user explicitly enable them?
