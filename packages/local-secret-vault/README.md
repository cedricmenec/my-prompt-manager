# @activarium/local-secret-vault

Local-first encrypted vault SDK for browser-based applications. Encrypts and stores secrets on the device with PBKDF2 + AES-256-GCM, with a session cache, pluggable storage, and optional React bindings.

## Features

- **Framework-agnostic core** — pure TypeScript, no UI framework dependency.
- **AES-256-GCM encryption** — key derived via PBKDF2-SHA256 (600k iterations) with fast-path passphrase verification.
- **Session cache with TTL** — configurable auto-unlock (Disabled, 15 min, 1 hour, 4 hours, Session).
- **Pluggable storage** — built-in IndexedDB and in-memory plugins; implement `VaultStorage` for custom backends.
- **Optional React bindings** — `useVault` hook, `VaultGate`, `VaultCreateModal`, `VaultUnlockModal`, `VaultSettings`.
- **No server required** — all encryption happens client-side.

## Installation

```bash
pnpm add @activarium/local-secret-vault
```

Or with npm:

```bash
npm install @activarium/local-secret-vault
```

## Quickstart

```ts
import { createVault } from '@activarium/local-secret-vault/core'
import { createMemoryStorage } from '@activarium/local-secret-vault/storage/memory'
import type { VaultPayloadBase } from '@activarium/local-secret-vault/core'

interface MyPayload extends VaultPayloadBase {
  version: 1
  apiKeys: Record<string, string>
}

const vault = createVault<MyPayload>({
  storage: createMemoryStorage(),
  initialPayload: { version: 1, apiKeys: {} },
})

await vault.create('my-secure-passphrase')

const payload = vault.getPayload()
payload.apiKeys['openrouter'] = 'sk-...'
await vault.persistPayload()

vault.lock()
```

## Documentation

- [Quickstart](docs/quickstart.md) — get a first result in minutes.
- [Concepts](docs/concepts.md) — understand how encryption, sessions, and storage work.
- [How-to guides](docs/how-to/README.md) — recipes for common tasks.
- [API reference](docs/api-reference.md) — every function, type, and option.

## License

MIT