## Why

API keys entered by the user (e.g. OpenRouter) are currently stored in an in-memory `Map` only, meaning they are lost on every page reload. Users must re-enter their keys each session, which degrades the BYOK experience. The `ai-provider-model-settings` change explicitly deferred encrypted vault persistence until a secure mechanism could store sensitive material with a user-controlled passphrase, keeping decrypted keys in memory only. This change fulfills that deferred follow-up.

## What Changes

- **New encrypted vault infrastructure**: A vault module using the Web Crypto API (PBKDF2 key derivation + AES-256-GCM encryption) stores sensitive data as an encrypted blob in IndexedDB. The encryption key is derived from a user-supplied passphrase and held in memory only — never persisted.
- **Vault lifecycle UI**: A `VaultUnlockModal` shown at app startup when an existing vault is detected, and a `VaultCreateModal` for first-time setup. Both modals handle passphrase entry with simple "wrong password" feedback.
- **Session credentials integration**: `sessionCredentials.ts` is extended so that `getApiKey()` and `setApiKey()` transparently read from / write to the encrypted vault in addition to the in-memory cache. No upstream consumers change their API.
- **Vault settings panel**: A new section in Settings for vault management — export (download encrypted blob as JSON), import (upload + passphrase verification), change passphrase, and delete vault.
- **Migration path**: Existing users without a vault are prompted to create one (or continue session-only) on next page load. The vault is opt-in.
- **IndexedDB schema bump**: A new `encryptedVault` store is added (DB version 8 → 9).

## Capabilities

### New Capabilities

- `encrypted-vault`: The core vault infrastructure — Web Crypto encryption/decryption, IndexedDB persistence of the encrypted blob, passphrase verification, and the lifecycle API (`createVault`, `unlockVault`, `lockVault`, `exportVault`, `importVault`).

### Modified Capabilities

- `ai-provider-model-settings`: `sessionCredentials` is extended to persist API keys into the vault (and restore from it on unlock). The `apiKeys` field of the vault payload maps to provider IDs. No spec-level requirement changes — the external behavior (key is available for API calls) is the same; the storage mechanism is enriched.
- `settings-panel`: A vault management section is added to the Settings panel (export, import, change passphrase, delete vault).

## Impact

- **New files**: `vaultCrypto.ts` (Web Crypto wrapper), `vaultRepository.ts` (IDB store for encrypted blob), `vault.ts` (façade module), `VaultUnlockModal`, `VaultCreateModal`, `VaultSettingsSection`.
- **Modified files**: `db.ts` (new `encryptedVault` store, schema version bump), `sessionCredentials.ts` (vault integration), `SettingsPanel` (vault section), app initialization (vault check on load).
- **Dependencies**: None — Web Crypto API is native to all modern browsers.
- **Risk**: Web Crypto API requires a secure context (HTTPS or localhost). If unavailable, the app falls back to session-only mode with a clear message. PBKDF2 with 600k iterations may be slower on low-end mobile devices (~200-500ms), which is acceptable for a one-time unlock at page load.
- **No breaking changes**: All existing consumers of `sessionCredentials` continue to work unchanged.
