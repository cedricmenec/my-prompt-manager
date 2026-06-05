## Why

Users need a way to configure their own Google Drive integration so the app can later import,
export, and back up prompt data without introducing a backend or app-owned cloud account.
This is needed now because Drive import/export and snapshot workflows require a clear
user-owned authentication and folder configuration boundary before sync can be added.

## What Changes

- Add a Google Drive integration configuration flow for a static, local-first, BYOK app.
- Allow the user to provide their own Google OAuth Client ID; no client secret is accepted or
  stored.
- Allow the user to configure a visible Google Drive folder that they created themselves.
- Add session-only Google Drive connection handling with connect, disconnect, and folder access
  test states.
- Support Google Drive-backed manual exports/imports and visible prompt snapshots as the first
  Drive use cases.
- Define snapshot behavior: create snapshots after manual exports, before imports/restores, and
  automatically every configurable interval when exportable data changed.
- Keep prompt exports and prompt snapshots unencrypted by default because prompt data is treated
  as non-sensitive user-owned content.
- Explicitly exclude sensitive credentials from exports and snapshots: AI API keys, OAuth access
  tokens, OAuth refresh tokens, service secrets, passphrases, and connector secrets.
- Document the feature clearly, including Google Cloud OAuth setup, Drive folder setup, what data
  is exported, what data is never exported, and the reconnect/expiry behavior.
- Defer encrypted vault support, encrypted secret export, hidden appDataFolder sync, and conflict
  resolution to later changes.

## Capabilities

### New Capabilities

- `google-drive-integration`: Configuration, authentication state, visible folder access, Drive
  error handling, and security boundaries for user-owned Google Drive integration.
- `drive-snapshots`: Visible Google Drive snapshot creation and restore preparation for
  non-sensitive prompt data.

### Modified Capabilities

- `settings-panel`: Replace the non-interactive Sync placeholder with Google Drive integration
  configuration and status controls.
- `import-export`: Extend import/export requirements to support Google Drive as a visible
  destination/source while preserving local JSON import/export behavior and excluding sensitive
  data from exported payloads.

## Impact

- Affected UI: `src/features/settings/SettingsPanel.tsx` and any new Google Drive settings/status
  components.
- Affected infrastructure: new Google Drive OAuth/client adapter modules, local non-sensitive
  settings persistence, and snapshot/export orchestration.
- Affected domain/data behavior: exported payloads and snapshots must remain limited to prompt
  data, local image assets, and explicitly non-sensitive settings.
- Affected documentation: `README.md` or equivalent user-facing documentation must explain setup,
  permissions, folder configuration, data boundaries, and deferred encrypted vault/sync features.
- External APIs: Google Identity Services and Google Drive REST API v3, used directly from the
  browser with user-owned OAuth configuration.
- No backend, serverless function, shared secret, SaaS account, analytics, or third-party
  telemetry is introduced.
