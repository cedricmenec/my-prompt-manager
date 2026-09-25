# Quickstart

This guide gets you from a fresh project to a working encrypted vault in a few minutes. By the end, you will have created a vault, unlocked it, read and written a payload, and locked it again.

## Prerequisites

- A browser that supports the [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API) (all modern browsers).
- A JavaScript or TypeScript project with a package manager.

## Install

```bash
pnpm add @activarium/local-secret-vault
```

Or with npm:

```bash
npm install @activarium/local-secret-vault
```

## Create a vault

The core API is framework-agnostic. It works in any JavaScript environment that has `window.crypto`.

```ts
import { createVault } from '@activarium/local-secret-vault/core'
import { createMemoryStorage } from '@activarium/local-secret-vault/storage/memory'
import type { VaultPayloadBase } from '@activarium/local-secret-vault/core'

// Your payload must extend VaultPayloadBase and include a version field.
interface MyPayload extends VaultPayloadBase {
  version: 1
  apiKeys: Record<string, string>
}

const vault = createVault<MyPayload>({
  storage: createMemoryStorage(),
  initialPayload: { version: 1, apiKeys: {} },
})

// Create the vault with a passphrase (at least 8 characters).
await vault.create('my-secure-passphrase')
```

The `create` call encrypts the initial payload and stores it. The encryption key stays in memory only.

## Unlock the vault

On a later page load, the vault already exists. Unlock it with the same passphrase.

```ts
// Check whether a vault exists.
const available = await vault.isAvailable()

// Unlock it.
await vault.unlock('my-secure-passphrase')
```

If you configured a session TTL, you can try to auto-unlock without asking for the passphrase again.

```ts
const unlocked = await vault.tryAutoUnlock()
```

## Read and write the payload

The decrypted payload is available in memory while the vault is unlocked.

```ts
// Read the payload.
const payload = vault.getPayload()
payload.apiKeys['openrouter'] = 'sk-...'

// Persist changes back to storage (re-encrypts and saves).
await vault.persistPayload()
```

## Lock the vault

Locking clears the key and payload from memory. The encrypted record stays in storage.

```ts
vault.lock()
```

## Next steps

- [Concepts](concepts.md) — understand how encryption, sessions, and storage work.
- [How-to guides](how-to/README.md) — recipes for common tasks.
- [API reference](api-reference.md) — every function, type, and option.