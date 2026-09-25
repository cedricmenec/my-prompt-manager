# Use the core without React

The core API is framework-agnostic. Use it when you do not want a React dependency, or when you are not using React at all.

## When to use this

Use the core directly when:

- You are building with a different framework (or no framework).
- You want full control over the create, unlock, and lock flow.
- You only need the vault lifecycle and not the ready-made React components.

## Steps

1. Import from the `core` entry point.
2. Choose a storage backend.
3. Create the vault with `createVault`.
4. Drive the lifecycle with the vault methods.

## Example

```ts
import { createVault } from '@activarium/local-secret-vault/core'
import { createIndexedDbStorage } from '@activarium/local-secret-vault/storage/indexeddb'
import type { VaultPayloadBase } from '@activarium/local-secret-vault/core'

interface MyPayload extends VaultPayloadBase {
  version: 1
  tokens: Record<string, string>
}

const vault = createVault<MyPayload>({
  storage: createIndexedDbStorage({
    dbName: 'my-app',
    storeName: 'vault',
  }),
  initialPayload: { version: 1, tokens: {} },
})

// Create on first run.
if (!(await vault.isAvailable())) {
  await vault.create('my-secure-passphrase')
} else {
  // Auto-unlock if a session cache exists, otherwise prompt.
  const unlocked = await vault.tryAutoUnlock()
  if (!unlocked) {
    await vault.unlock('my-secure-passphrase')
  }
}

// Read and write the payload.
const payload = vault.getPayload()
payload.tokens['github'] = 'ghp_...'
await vault.persistPayload()

// Lock when done.
vault.lock()
```

## Notes

- The `core` entry point does not import React. It keeps your bundle smaller if you do not use the React bindings.
- The React bindings are optional. See [the API reference](../api-reference.md) for the full list of entry points.