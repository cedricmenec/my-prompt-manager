# @byo-prompt/encrypted-vault

Local-first encrypted vault SDK for browser-based applications. Provides PBKDF2 + AES-256-GCM vault lifecycle, session cache with configurable TTL, IndexedDB storage plugin, and optional React bindings.

## Features

- **Framework-agnostic core** — pure TypeScript, no UI framework dependency
- **AES-256-GCM encryption** — key derived via PBKDF2-SHA256 (600k iterations) with fast-path passphrase verification (1k iterations)
- **Session cache with TTL** — configurable auto-unlock (Disabled, 15 min, 1 hour, 4 hours, Session)
- **Pluggable storage** — built-in IndexedDB and in-memory plugins; implement `VaultStorage` for custom backends
- **Optional React bindings** — `useVault` hook, `VaultGate`, `VaultCreateModal`, `VaultUnlockModal`, `VaultSettings`
- **No server required** — all encryption happens client-side

## Installation

```bash
pnpm add @byo-prompt/encrypted-vault
```

## Usage

### Core (framework-agnostic)

```ts
import { createVault } from '@byo-prompt/encrypted-vault/core'
import { createIndexedDbStorage } from '@byo-prompt/encrypted-vault/storage/indexeddb'
import type { VaultPayloadBase } from '@byo-prompt/encrypted-vault/core'

interface MyPayload extends VaultPayloadBase {
  version: 1
  apiKeys: Record<string, string>
}

const storage = createIndexedDbStorage({
  dbName: 'my-app',
  storeName: 'vault',
})

const vault = createVault<MyPayload>({
  storage,
  initialPayload: { version: 1, apiKeys: {} },
})

// Create
await vault.create('my-secure-passphrase')

// Auto-unlock (session cache)
const unlocked = await vault.tryAutoUnlock()

// Access payload
const payload = vault.getPayload()
payload.apiKeys['openrouter'] = 'sk-...'
await vault.persistPayload()

// Lock / unlock
vault.lock()
await vault.unlock('my-secure-passphrase')

// Export / Import
const exported = await vault.export() // JSON-serialisable
await vault.import(exported, 'my-secure-passphrase')

// Change passphrase
await vault.changePassphrase('old-passphrase', 'new-passphrase')
```

### In-memory storage (for testing)

```ts
import { createVault } from '@byo-prompt/encrypted-vault/core'
import { createMemoryStorage } from '@byo-prompt/encrypted-vault/storage/memory'

const vault = createVault({
  storage: createMemoryStorage(),
  initialPayload: { version: 1, apiKeys: {} },
})
```

### React bindings

```tsx
import { VaultGate, VaultSettings } from '@byo-prompt/encrypted-vault/react'

function App() {
  return (
    <VaultGate vault={vault}>
      <main>
        <h1>My App</h1>
        <VaultSettings vault={vault} />
      </main>
    </VaultGate>
  )
}
```

## Entry points

| Import path | Contents |
|-------------|----------|
| `@byo-prompt/encrypted-vault/core` | Core: `Vault`, `createVault`, types, errors, crypto, session |
| `@byo-prompt/encrypted-vault/storage/indexeddb` | IndexedDB storage plugin |
| `@byo-prompt/encrypted-vault/storage/memory` | In-memory storage plugin (for testing) |
| `@byo-prompt/encrypted-vault/react` | React hooks and components |
| `@byo-prompt/encrypted-vault` | Re-exports everything |

## API

### `Vault<TPayload>`

| Method | Description |
|--------|-------------|
| `create(passphrase)` | Create a new vault with passphrase (min 8 chars) |
| `unlock(passphrase)` | Unlock an existing vault |
| `lock()` | Clear in-memory key and payload |
| `delete()` | Remove vault from storage |
| `isAvailable()` | Check if vault exists in storage |
| `isUnlocked()` | Check if vault is unlocked |
| `getPayload()` | Get decrypted payload (or null) |
| `persistPayload()` | Re-encrypt and persist current payload |
| `export()` | Export vault as JSON-serialisable object |
| `import(data, passphrase)` | Import vault from exported data |
| `changePassphrase(current, new)` | Change vault passphrase |
| `tryAutoUnlock()` | Auto-unlock from session cache |
| `getSessionTTL()` | Get current TTL config |
| `setSessionTTL(ttl)` | Set session TTL |

### Error types

- `VaultError` (base)
- `WrongPassphraseError` — incorrect passphrase
- `VaultNotFoundError` — no vault in storage
- `VaultLockedError` — operation requires unlocked vault
- `CryptoUnavailableError` — Web Crypto API not available

## React Components

All components accept optional `classNames` prop for Tailwind customization.

| Component | Description |
|-----------|-------------|
| `VaultGate` | Guard component with loading/create/unlock/unavailable states |
| `VaultCreateModal` | Create vault form with passphrase validation |
| `VaultUnlockModal` | Unlock vault form with error handling |
| `VaultSettings` | Comprehensive vault management panel |
| `useVault(vault)` | Hook tracking vault state |

## License

MIT

## Open Points

- **`idb` dependency**: Currently required for IndexedDB storage. Future versions could use the native IndexedDB API directly to reduce dependencies.
- **Tailwind-free React components**: React components currently use Tailwind CSS class names. Future versions could provide CSS-vanilla defaults.
- **OPFS storage**: Future work could add an OPFS (Origin Private File System) storage backend for environments where IndexedDB is restricted.