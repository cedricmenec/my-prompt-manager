# API reference

This page is the exhaustive source of truth for the public API. Every signature is verified against the current source code.

## Entry points

The package exposes several import paths. Import only what you need to keep your bundle small.

| Import path | Contents |
|-------------|----------|
| `@activarium/local-secret-vault` | Re-exports everything (core + storage). |
| `@activarium/local-secret-vault/core` | Core: `Vault`, `createVault`, types, errors, crypto, session. No React dependency. |
| `@activarium/local-secret-vault/storage/indexeddb` | IndexedDB storage plugin. |
| `@activarium/local-secret-vault/storage/memory` | In-memory storage plugin (for testing). |
| `@activarium/local-secret-vault/react` | React hooks and components. |

## `Vault<TPayload>`

The vault lifecycle class. `TPayload` must extend `VaultPayloadBase`.

### Constructor

```ts
new Vault<TPayload>(storage: VaultStorage, initialPayload: TPayload)
```

You normally do not construct a `Vault` directly. Use `createVault` instead.

### Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `create` | `create(passphrase: string): Promise<void>` | Create a new vault. Throws `VaultError` if the passphrase is shorter than 8 characters, or `CryptoUnavailableError` if Web Crypto is unavailable. |
| `unlock` | `unlock(passphrase: string): Promise<void>` | Unlock an existing vault. Throws `WrongPassphraseError` or `VaultNotFoundError`. |
| `lock` | `lock(): void` | Clear the key and payload from memory. The record stays in storage. |
| `delete` | `delete(): Promise<void>` | Remove the vault from storage and clear memory. |
| `isAvailable` | `isAvailable(): Promise<boolean>` | Whether a vault record exists in storage. Does not check unlock state. |
| `isUnlocked` | `isUnlocked(): boolean` | Whether the vault is unlocked (key and payload in memory). |
| `getPayload` | `getPayload(): TPayload \| null` | The decrypted payload, or `null` if locked. |
| `persistPayload` | `persistPayload(): Promise<void>` | Re-encrypt and persist the current payload. Throws `VaultLockedError` if locked, or `VaultNotFoundError` if no record exists. |
| `export` | `export(): Promise<ExportableVault \| null>` | Export the record as a JSON-serialisable object, or `null` if none exists. |
| `import` | `import(jsonData: ExportableVault, passphrase: string): Promise<void>` | Import a record and auto-unlock. Throws `WrongPassphraseError` if verification fails. |
| `changePassphrase` | `changePassphrase(currentPassphrase: string, newPassphrase: string): Promise<void>` | Rotate the passphrase. Throws `WrongPassphraseError` or `VaultNotFoundError`. |
| `tryAutoUnlock` | `tryAutoUnlock(): Promise<boolean>` | Auto-unlock from the session cache. Returns `false` if no valid cache exists. |
| `getSessionTTL` | `getSessionTTL(): TTLMinutes` | Read the current session TTL config. |
| `setSessionTTL` | `setSessionTTL(ttl: TTLMinutes): void` | Set the session TTL config. |

## `createVault`

The factory function for creating a `Vault` instance.

```ts
function createVault<TPayload extends VaultPayloadBase>(
  options: { storage: VaultStorage; initialPayload: TPayload },
): Vault<TPayload>
```

## Types

### `VaultPayloadBase`

The base interface every payload must extend. Requires a `version` field.

```ts
interface VaultPayloadBase {
  version: number
}
```

### `VaultSDKOptions<TPayload>`

The options passed to `createVault`.

```ts
interface VaultSDKOptions<TPayload extends VaultPayloadBase> {
  storage: VaultStorage
  initialPayload: TPayload
}
```

### `EncryptedRecord`

The encrypted record persisted by storage backends. Treat it as opaque.

```ts
interface EncryptedRecord {
  key: string
  version: number
  salt: Uint8Array
  iv: Uint8Array
  verifyHash: Uint8Array
  data: Uint8Array
  createdAt: string
  updatedAt: string
}
```

### `ExportableVault`

The JSON-serialisable form of an `EncryptedRecord`, returned by `export` and accepted by `import`. Byte arrays are plain `number[]`.

```ts
interface ExportableVault {
  key: string
  version: number
  salt: number[]
  iv: number[]
  verifyHash: number[]
  data: number[]
  createdAt: string
  updatedAt: string
}
```

### `TTLMinutes`

The valid session TTL values in minutes. `0` = Disabled, `-1` = Session (no expiry).

```ts
type TTLMinutes = 0 | 15 | 60 | 240 | -1
```

### `VaultStorage`

The storage backend interface.

```ts
interface VaultStorage {
  load(): Promise<EncryptedRecord | null>
  save(record: EncryptedRecord): Promise<void>
  remove(): Promise<void>
  exists(): Promise<boolean>
}
```

## Errors

All errors extend `VaultError`, which extends the built-in `Error`.

| Error | Default message | When it is thrown |
|-------|-----------------|-------------------|
| `VaultError` | — | Base class. Also thrown for invalid input (e.g. passphrase shorter than 8 characters). |
| `WrongPassphraseError` | `Wrong password` | The passphrase is incorrect. |
| `VaultNotFoundError` | `No vault found` | No vault exists in storage, but an operation requires one. |
| `VaultLockedError` | `Vault is not unlocked` | An operation requires an unlocked vault, but the vault is locked. |
| `CryptoUnavailableError` | `Web Crypto API is not available` | The Web Crypto API is unavailable. |

## Crypto primitives

Low-level helpers, exported from `core`. Most consumers do not need these.

| Function | Signature | Description |
|----------|-----------|-------------|
| `isWebCryptoAvailable` | `isWebCryptoAvailable(): boolean` | Whether `window.crypto.subtle` is accessible. |
| `generateSalt` | `generateSalt(): Uint8Array` | Generate a random 16-byte salt. |
| `generateIv` | `generateIv(): Uint8Array` | Generate a random 12-byte IV. |
| `deriveKey` | `deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey>` | Derive the AES-256-GCM key (600k PBKDF2 iterations). |
| `deriveVerifyHash` | `deriveVerifyHash(passphrase: string, salt: Uint8Array): Promise<Uint8Array>` | Derive a lightweight verify hash (1k iterations). |
| `encrypt` | `encrypt(key: CryptoKey, iv: Uint8Array, plaintext: string): Promise<Uint8Array>` | Encrypt a string with AES-256-GCM. |
| `decrypt` | `decrypt(key: CryptoKey, iv: Uint8Array, ciphertext: Uint8Array): Promise<string>` | Decrypt a ciphertext with AES-256-GCM. |
| `arraysEqual` | `arraysEqual(a: Uint8Array, b: Uint8Array): boolean` | Constant-time comparison of two byte arrays. |

## Session helpers

Exported from `core`. These manage the passphrase cache directly.

| Function | Signature | Description |
|----------|-----------|-------------|
| `getTTLConfig` | `getTTLConfig(): TTLMinutes` | Read the TTL config from `localStorage`. |
| `setTTLConfig` | `setTTLConfig(ttl: TTLMinutes): void` | Persist the TTL config. Clears the cache when set to `0`. |
| `storeSessionPassphrase` | `storeSessionPassphrase(passphrase: string): void` | Store the passphrase in `sessionStorage`. |
| `tryGetSessionPassphrase` | `tryGetSessionPassphrase(): string \| null` | Get a valid cached passphrase, or `null`. |
| `clearSessionCache` | `clearSessionCache(): void` | Clear the session cache. |

## Storage plugins

### `createIndexedDbStorage`

```ts
function createIndexedDbStorage(options: IndexedDbStorageOptions): VaultStorage
```

Creates an IndexedDB-backed storage plugin. It manages its own database and object store.

```ts
interface IndexedDbStorageOptions {
  dbName: string
  storeName: string
  storeKey?: string // default: 'vault'
}
```

### `createMemoryStorage`

```ts
function createMemoryStorage(): VaultStorage
```

Creates an in-memory storage plugin backed by a `Map`. Does not persist across page reloads. Useful for testing.

## React bindings

Import from `@activarium/local-secret-vault/react`. These require React as a peer dependency.

### `useVault`

```ts
function useVault<TPayload extends VaultPayloadBase>(
  vault: Vault<TPayload>,
): UseVaultResult<TPayload>
```

A hook that tracks vault state and exposes convenience methods.

```ts
type VaultState = 'loading' | 'no-vault' | 'locked' | 'unlocked' | 'crypto-unavailable'

interface UseVaultResult<TPayload extends VaultPayloadBase> {
  state: VaultState
  error: string | null
  vault: Vault<TPayload>
  create: (passphrase: string) => Promise<void>
  unlock: (passphrase: string) => Promise<void>
  lock: () => void
  skip: () => void
}
```

### `VaultGate`

```ts
function VaultGate<TPayload extends VaultPayloadBase>(
  props: VaultGateProps<TPayload>,
): ReactNode
```

A guard component that renders its children only when the vault is unlocked. Shows create/unlock modals otherwise, and a banner when Web Crypto is unavailable.

```ts
interface VaultGateProps<TPayload extends VaultPayloadBase> {
  vault: Vault<TPayload>
  children: ReactNode
  classNames?: VaultGateClassNames
}
```

### `VaultCreateModal`

```ts
function VaultCreateModal(props: VaultCreateModalProps): ReactNode
```

A modal form for creating a new vault. Validates passphrase length and confirmation match.

```ts
interface VaultCreateModalProps {
  onCreate: (passphrase: string) => void | Promise<void>
  onSkip: () => void
  error: string | null
  classNames?: VaultCreateModalClassNames
}
```

### `VaultUnlockModal`

```ts
function VaultUnlockModal(props: VaultUnlockModalProps): ReactNode
```

A modal form for unlocking an existing vault.

```ts
interface VaultUnlockModalProps {
  onUnlock: (passphrase: string) => void | Promise<void>
  error: string | null
  classNames?: VaultUnlockModalClassNames
}
```

### `VaultSettings`

```ts
function VaultSettings<TPayload extends VaultPayloadBase>(
  props: VaultSettingsProps<TPayload>,
): ReactNode
```

A comprehensive vault management panel. Provides status display, export/import, change passphrase, delete vault, and session TTL configuration.

```ts
interface VaultSettingsProps<TPayload extends VaultPayloadBase> {
  vault: Vault<TPayload>
  classNames?: VaultSettingsClassNames
}
```

### Class name props

All React components accept an optional `classNames` prop for styling. Each component has its own class name shape (`VaultGateClassNames`, `VaultCreateModalClassNames`, `VaultUnlockModalClassNames`, `VaultSettingsClassNames`). Every field is optional and maps to a specific element (e.g. `wrapper`, `modal`, `title`, `button`).