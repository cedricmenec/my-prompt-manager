## Why

The encrypted vault (PBKDF2 + AES-256-GCM, session cache with TTL, IndexedDB persistence) is a self-contained, generic capability with zero coupling to the prompt manager domain. Other local-first, BYOK static web apps being built need the same vault pattern — but currently it's embedded in this project's infrastructure layer, coupled to its database schema, React components, and Tailwind styling.

Extracting the vault into a reusable SDK (`local-encrypted-vault`) will:

- Allow other static web apps to adopt encrypted credential storage with zero effort
- Improve the vault's architecture through clean interface boundaries
- Enable independent versioning, testing, and documentation
- Prepare for eventual publication as an npm package

## What Changes

- Create a new monorepo workspace package `packages/encrypted-vault/` within this project
- Extract core vault logic (`crypto`, `session`, `storage interface`, `vault orchestration`) into a framework-agnostic `core/` layer
- Extract IndexedDB storage as a built-in `storage/` plugin (`idb`-based)
- Extract React hooks and generic components into an optional `react/` sub-package
- Refactor `src/infrastructure/vault/` into a thin adapter that wraps the SDK
- Remove `EncryptedVaultRecord` and related code from `src/infrastructure/db.ts` (responsibility moves to SDK)
- The `sessionCredentials.ts` integration is updated to use the new vault API
- **BREAKING**: Internal imports from `@/infrastructure/vault` change; the public API surface for the vault changes from bare functions to a `Vault` class instance

## Capabilities

### New Capabilities

- `encrypted-vault-core`: Framework-agnostic vault SDK — crypto primitives, session cache, storage abstraction, vault lifecycle orchestration, all generic (no React, no app-specific types)
- `encrypted-vault-storage-indexeddb`: IndexedDB persistence plugin for the vault SDK, using the `idb` library
- `encrypted-vault-react`: Optional React bindings — `useVault()` hook, `VaultGate`, `VaultCreateModal`, `VaultUnlockModal`, `VaultSettings` panel (CSS-vanilla with className props, not Tailwind-coupled)

### Modified Capabilities

- `encrypted-vault`: The existing encrypted vault spec will be updated to reflect the new architecture (adapter-based, SDK-powered)

## Impact

- **New package**: `packages/encrypted-vault/` with its own `package.json`, `tsconfig.json`, and build config
- **pnpm-workspace.yaml**: Add the new package to the workspace
- **`src/infrastructure/vault/`**: Rewritten as thin adapter (delegates to SDK, keeps app-specific `VaultPayload` type and `sessionCredentials` integration)
- **`src/infrastructure/db.ts`**: `EncryptedVaultRecord` type and `encryptedVault` store definition migrate to SDK
- **`src/features/vault/`**: VaultGate, VaultCreateModal, VaultUnlockModal simplified to use SDK components (or adapter)
- **`src/features/settings/VaultSettingsSection.tsx`**: Uses SDK VaultSettings + app-specific overrides
- **No change to**: Application domain, features (prompts, settings, layout), Google Drive sync, AI providers
- **Open point**: The `idb` dependency is kept for now. Future exploration could remove it by using the native IndexedDB API directly, reducing the SDK's dependency footprint.