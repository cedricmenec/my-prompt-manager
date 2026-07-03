## Context

The encrypted vault currently lives in `src/infrastructure/vault/` as four internal modules (`vault.ts`, `vaultCrypto.ts`, `vaultRepository.ts`, `vaultSession.ts`) plus React components in `src/features/vault/`. It is tightly coupled to:

- The app's database schema (`EncryptedVaultRecord` in `src/infrastructure/db.ts`, `getDb()`)
- The app-specific `VaultPayload` type (`{ version: 1, apiKeys: Record<string, string> }`)
- React with Tailwind CSS for UI components
- The `idb` IndexedDB wrapper library

Several other local-first BYOK static web apps are being developed that need the same encrypted credential storage. Extracting the vault into a reusable SDK will serve all of them while improving the vault's architecture through clean interface boundaries.

## Goals / Non-Goals

**Goals:**
- Extract framework-agnostic core (`crypto`, `session cache`, `storage interface`, `vault lifecycle`) into `packages/encrypted-vault/src/core/`
- Provide a built-in IndexedDB storage plugin using `idb` (same as current app)
- Provide optional React bindings (hooks + generic components) using Tailwind CSS
- Refactor `src/infrastructure/vault/` into a thin adapter that wraps the SDK and keeps app-specific types
- Remove `EncryptedVaultRecord` type and encryptedVault store setup from `src/infrastructure/db.ts` (SDK manages its own store)
- Preserve all existing behavior: no regression in vault creation, unlock, lock, session TTL, export, import, change passphrase, auto-unlock
- All existing tests continue to pass (adapted to SDK API)

**Non-Goals:**
- Not extracting the vault to a separate repo or publishing to npm (yet) — monorepo package first
- Not changing the encryption algorithm (PBKDF2 + AES-256-GCM remains)
- Not adding new storage backends beyond IndexedDB (OPFS, Chrome extension, etc. deferred)
- Not removing the `idb` dependency (noted as open point for future)
- Not removing Tailwind from React components (noted as open point for future)
- Not changing the session credentials integration pattern

## Decisions

### Decision: Class-based Vault API over bare functions
The current vault exports bare async functions operating on module-level state. The SDK will use a `Vault<TPayload>` class with a factory function `createVault(options)`. This allows:
- Multiple vault instances (theoretically, though single-instance is the common case)
- Clean generic typing of the payload shape
- Explicit dependency injection (storage plugin, initial payload)
- Better testability (fresh instances without module state reset hacks)

**Alternatives considered:** Bare functions with global state (current approach — works but hard to test and impossible to instantiate); singleton pattern (same issues).

### Decision: Generic `VaultStorage` interface with payload-agnostic `EncryptedRecord`
The storage layer stores only the encrypted blob and metadata — it knows nothing about the payload structure. The `EncryptedRecord` contains `salt`, `iv`, `verifyHash`, `data` as `Uint8Array`, plus `version`, `createdAt`, `updatedAt`. The payload type `TPayload` is only known to the vault orchestrator.

This means the storage plugin is completely reusable across any vault configuration.

### Decision: IndexedDB store key as a configuration option
The current vault hardcodes the store key as `'vault'`. The SDK will accept `storeKey` in `IndexedDbStorageOptions`, defaulting to `'vault'`. This allows multiple vaults or different naming conventions in different apps.

### Decision: SDK manages its own IDB store creation
Instead of requiring the host app to define the `encryptedVault` store in its database schema, the SDK's IndexedDB storage plugin will create its own database or its own object store within a named database. This completely decouples the vault storage from the app's database schema.

The app provides `dbName` and `storeName`; the SDK opens/creates the database and store independently using `idb`.

**Trade-off:** The app's database and the vault's database are separate connections. This is acceptable — the vault is a single-record store with no cross-object relationships.

### Decision: Vault<T> class exposes `getPayload()` returning a mutable reference
For convenience, the vault class returns a direct reference to the internal payload object. Callers (like `sessionCredentials`) can mutate it directly (e.g., `vault.getPayload()!.apiKeys[providerId] = key`) and then call `persistPayload()` to re-encrypt. This matches the current pattern.

**Safety:** `lock()` sets the internal reference to `null`, so any stale references held by callers will naturally fail fast on next access.

### Decision: React components receive Tailwind classes via `className` props
Rather than hardcoding Tailwind in the SDK (which forces all consumers to have Tailwind), the SDK components will accept optional `className` overrides for each major element (modal wrapper, title, input, button, etc.). The default classes will be minimal utility classes.

**Alternative considered:** Bundling Tailwind in the SDK (would force Tailwind on all consumers). Rejected for now with an open point to explore CSS-vanilla default styling.

### Decision: One package, three entry points (`core`, `storage`, `react`)
The SDK has three distinct import paths:

```
import { createVault } from 'local-encrypted-vault/core'
import { createIndexedDbStorage } from 'local-encrypted-vault/storage/indexeddb'
import { useVault } from 'local-encrypted-vault/react'
```

This keeps the React bundle optional (tree-shakeable) and keeps the core pure.

## Architecture

```
packages/encrypted-vault/src/
├── index.ts                    # Re-exports everything
├── core/
│   ├── types.ts                # VaultPayloadBase, VaultSDKOptions<T>, EncryptedRecord, TTLMinutes, ExportableVault
│   ├── errors.ts               # VaultError, WrongPassphraseError, VaultNotFoundError, VaultLockedError
│   ├── crypto.ts               # generateSalt, generateIv, deriveKey, deriveVerifyHash, encrypt, decrypt, isWebCryptoAvailable
│   ├── session.ts              # Session cache + TTL (getTTLConfig, setTTLConfig, storeSessionPassphrase, tryGetSessionPassphrase, clearSessionCache)
│   ├── storage.ts              # VaultStorage interface
│   └── vault.ts                # Vault<TPayload> class + createVault() factory
├── storage/
│   ├── indexeddb.ts            # createIndexedDbStorage(options) → VaultStorage
│   └── memory.ts               # createMemoryStorage() → VaultStorage (for testing)
└── react/
    ├── index.ts
    ├── useVault.ts             # React hook
    ├── VaultGate.tsx
    ├── VaultCreateModal.tsx
    ├── VaultUnlockModal.tsx
    └── VaultSettings.tsx       # Generic settings panel
```

### Data flow

```
App code
  │
  ▼
Vault<TPayload> class (orchestrator)
  │  - holds cryptoKey + payload in memory
  │  - typed generically with TPayload
  │  - serializes/deserializes payload to/from JSON
  │
  ├──► VaultCrypto (pure Web Crypto operations)
  │     - deriveKey, encrypt, decrypt, deriveVerifyHash
  │     - no state, no I/O
  │
  ├──► SessionCache (sessionStorage + TTL)
  │     - store/retrieve/clear passphrase
  │
  └──► VaultStorage (interface)
        - load/save/remove/exists
        ▲
        │
   ┌────┴──────────┐
   │               │
IndexedDbPlugin  MemoryPlugin
   │               │
   ▼               ▼
  IDB             Map<string, any> (tests)
```

### Vault lifecycle state machine

```
         ┌─────────┐
         │  init   │
         └────┬────┘
              │
    ┌─────────┼─────────┐
    ▼         ▼         ▼
 ┌──────┐ ┌────────┐ ┌──────┐
 │no-vault│ │ locked │ │unavail│
 └──┬───┘ └───┬────┘ └──────┘
    │         │
    │ create  │ unlock / tryAutoUnlock
    ▼         ▼
 ┌──────────────┐
 │   unlocked   │
 │ (key+payload)│
 └──────┬───────┘
        │
    lock / delete / page reload
        │
        ▼
     ┌──────┐
     │locked│
     └──────┘
```

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| **Separate IDB connection** for vault creates two DB connections instead of one | Acceptable — vault is a single-record store with minimal traffic. The `idb` library manages connections efficiently. |
| **Duplicate `idb` dependency** if both app and SDK bundle it | pnpm workspace deduplicates via hoisting. When published as npm package, `idb` is a regular dependency (not peer) so it's self-contained. |
| **React components in SDK** force a React peer dependency | Keep React as a peer dependency (not bundled). Apps using vanilla JS won't install the react/ entry point. |
| **Tailwind coupling** in SDK React components | `className` props for customization. Open point to explore CSS-vanilla defaults in the future. |
| **Breaking change** for existing app imports | The adapter layer in `src/infrastructure/vault/` preserves backward-compatible exports for a migration window. |

## Open Questions

- **Tailwind default styling**: Should the React components ship with no default classes (fully controlled via `className` props) or minimal inline styles that look decent out of the box? → Decision: minimal className defaults that assume a typical Tailwind project, overridable via props.
- **`idb` dependency**: Can we eventually replace `idb` with native IndexedDB API to reduce the SDK's dependency footprint? → Deferred, noted as open point.
- **CSS-vanilla React components**: Should we eventually provide CSS-vanilla versions of the React components (no Tailwind dependency)? → Deferred, noted as open point.
- **ExportableVault format**: The exported JSON uses plain arrays for binary data (`Array.from(Uint8Array)`). Should we switch to base64 for smaller file size? → Keep plain arrays for simplicity; format matches current behavior.