# Change the passphrase and export/import

This guide covers rotating the passphrase and moving a vault between devices with export and import.

## When to use this

- **Change passphrase** — when the current passphrase may be compromised, or as a routine rotation.
- **Export/import** — to back up a vault or move it to another device or browser.

## Change the passphrase

`changePassphrase` verifies the current passphrase, re-encrypts the payload with a new key, and persists the result.

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

await vault.create('old-passphrase')

// Rotate to a new passphrase.
await vault.changePassphrase('old-passphrase', 'new-passphrase')
```

The vault stays unlocked after the change. The new passphrase takes effect immediately.

## Export a vault

`export` returns the encrypted record as a plain JSON-serialisable object. It does not contain the plaintext payload.

```ts
const exported = await vault.export()

// Trigger a file download in a browser.
if (exported) {
  const blob = new Blob([JSON.stringify(exported, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'vault-backup.json'
  a.click()
  URL.revokeObjectURL(url)
}
```

`export` returns `null` when no vault exists in storage.

## Import a vault

`import` reads an exported object, verifies the passphrase, replaces any existing vault, and auto-unlocks on success.

```ts
import { createVault } from '@activarium/local-secret-vault/core'
import { createMemoryStorage } from '@activarium/local-secret-vault/storage/memory'
import type { ExportableVault, VaultPayloadBase } from '@activarium/local-secret-vault/core'

interface MyPayload extends VaultPayloadBase {
  version: 1
  apiKeys: Record<string, string>
}

const vault = createVault<MyPayload>({
  storage: createMemoryStorage(),
  initialPayload: { version: 1, apiKeys: {} },
})

// Parse the exported JSON from a file.
const exported: ExportableVault = JSON.parse(backupJsonString)

// Import with the passphrase that was used to export.
await vault.import(exported, 'my-secure-passphrase')
```

## Notes

- Export and import work across devices because the record is self-contained.
- You must know the passphrase to import. The passphrase is verified against the imported record.
- Importing replaces any existing vault in the target storage.