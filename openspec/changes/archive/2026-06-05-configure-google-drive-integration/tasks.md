## 1. Drive Configuration Model

- [x] 1.1 Define TypeScript types for non-sensitive Google Drive configuration, connection status, folder access test result, and snapshot settings
- [x] 1.2 Add local persistence for Google Drive Client ID, folder ID, snapshot enabled state, snapshot interval, and last snapshot metadata
- [x] 1.3 Implement folder URL/ID parsing and validation helpers with unit tests
- [x] 1.4 Ensure sensitive values such as OAuth tokens, API keys, client secrets, passphrases, and connector secrets are not persisted in Drive configuration

## 2. Google Drive Infrastructure

- [x] 2.1 Add a browser-only Google Drive auth adapter for user-provided OAuth Client ID and session-only access tokens
- [x] 2.2 Add connect, disconnect, expired, and error state handling for Google Drive sessions
- [x] 2.3 Add a Google Drive REST adapter for folder access testing, file upload, file listing, and file download
- [x] 2.4 Map Google Drive network, authorization, and folder permission failures to actionable UI-facing errors
- [x] 2.5 Add tests for auth/session state transitions and Drive adapter error mapping with mocked browser/network APIs

## 3. Settings Panel UI

- [x] 3.1 Replace the Settings Sync placeholder with an active Google Drive configuration section
- [x] 3.2 Add controls for Google OAuth Client ID, Drive folder URL/ID, save, connect, disconnect, and test folder access
- [x] 3.3 Add visible status states for not configured, configured, connected, disconnected, expired, and error
- [x] 3.4 Add snapshot controls for enabled/disabled state and automatic interval, defaulting to 15 minutes
- [x] 3.5 Preserve existing Data import/export actions and remaining coming-soon placeholders
- [x] 3.6 Add UI tests for validation, status rendering, connect/disconnect actions, and snapshot interval validation

## 4. Drive Import And Export

- [x] 4.1 Add a Drive export action that uploads the existing prompt JSON export envelope to the configured visible Drive folder
- [x] 4.2 Add a Drive import action that lists/selects a Drive JSON export and reuses existing parse, validation, confirmation, and replace behavior
- [x] 4.3 Preserve local JSON import/export behavior without requiring Google Drive configuration or connection
- [x] 4.4 Ensure all local and Drive export payloads exclude API keys, OAuth tokens, refresh tokens, client secrets, passphrases, and connector secrets
- [x] 4.5 Add tests for Drive export/import orchestration and sensitive-data exclusion

## 5. Visible Drive Snapshots

- [x] 5.1 Implement snapshot payload creation using prompt export data, local image assets, schema metadata, app metadata, and explicitly non-sensitive settings only
- [x] 5.2 Create snapshots after successful manual Drive exports when snapshots are enabled
- [x] 5.3 Create pre-import and pre-restore snapshots before destructive prompt data operations when snapshots are enabled
- [x] 5.4 Add restore-from-snapshot flow with validation, confirmation, and existing import replacement behavior
- [x] 5.5 Add automatic snapshot scheduling using the configured interval and only running when exportable data changed
- [x] 5.6 Add tests for manual, pre-operation, automatic, unchanged-data, and failed-snapshot scenarios

## 6. Documentation

- [x] 6.1 Document Google Cloud OAuth Client ID setup for a static browser app, including no client secret usage
- [x] 6.2 Document Drive folder creation and how to paste the folder URL or folder ID into Settings
- [x] 6.3 Document required Google Drive permissions/scopes and reconnect behavior when the session expires
- [x] 6.4 Document export, import, snapshot, and restore workflows
- [x] 6.5 Document that prompt exports and snapshots are unencrypted by default and that sensitive credentials are never exported
- [x] 6.6 Document deferred items: encrypted vault, encrypted secret export, hidden appDataFolder sync, conflict resolution, and Drive Picker support

## 7. Verification

- [x] 7.1 Run unit tests for domain, import/export, settings, and Google Drive integration modules
- [x] 7.2 Run lint and TypeScript build
- [ ] 7.3 Manually verify Settings panel flows in a local browser with mocked or configured Google Drive credentials
- [x] 7.4 Verify local import/export still works offline and without Google Drive configuration
- [x] 7.5 Verify no sensitive credential names or values appear in generated export or snapshot payloads
