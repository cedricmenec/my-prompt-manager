# Write a custom storage backend

The vault stores its encrypted record through a small interface called `VaultStorage`. You can implement this interface to persist the vault anywhere you like.

## When to use this

Use a custom backend when the built-in options do not fit:

- IndexedDB is not available in your environment.
- You want to store the record on a server, in a file, or in another database.
- You need a backend tailored to your app's storage model.

## The interface

A `VaultStorage` implementation must provide four methods:

```ts
interface VaultStorage {
  load(): Promise<EncryptedRecord | null>
  save(record: EncryptedRecord): Promise<void>
  remove(): Promise<void>
  exists(): Promise<boolean>
}
```

- `load` returns the stored record, or `null` if none exists.
- `save` stores (or replaces) a record.
- `remove` deletes the record.
- `exists` reports whether a record is present.

The `EncryptedRecord` type is opaque to you. Treat it as an opaque blob: store it, return it, and never inspect or modify its fields.

## Steps

1. Implement the four methods against your storage.
2. Pass your implementation to `createVault` as the `storage` option.

## Example

This example stores the record in a `Map`. It is the same idea as the built-in memory backend.

```ts
import { createVault } from '@activarium/local-secret-vault/core'
import type { VaultStorage, EncryptedRecord, VaultPayloadBase } from '@activarium/local-secret-vault/core'

function createMapStorage(): VaultStorage {
  const store = new Map<string, EncryptedRecord>()

  return {
    async load() {
      return store.get('vault') ?? null
    },
    async save(record) {
      store.set('vault', record)
    },
    async remove() {
      store.delete('vault')
    },
    async exists() {
      return store.has('vault')
    },
  }
}

interface MyPayload extends VaultPayloadBase {
  version: 1
  apiKeys: Record<string, string>
}

const vault = createVault<MyPayload>({
  storage: createMapStorage(),
  initialPayload: { version: 1, apiKeys: {} },
})

await vault.create('my-secure-passphrase')
```

## Notes

- The record is already encrypted before it reaches your backend. You never handle plaintext in a storage backend.
- The built-in `createMemoryStorage` is exactly this pattern. Use it as a reference.
- For a server-backed backend, `save` would send the record to your API and `load` would fetch it.