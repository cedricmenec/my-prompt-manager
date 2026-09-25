# Configure the session TTL

The session TTL controls how long the vault stays unlocked without asking for the passphrase again. This guide explains the options and how to set them.

## When to use this

Use this guide when you want to:

- Change how often the user must enter the passphrase.
- Balance security against convenience for your app.
- Disable auto-unlock entirely.

## The TTL values

| Value | Meaning |
|-------|---------|
| `0` | **Disabled** — never auto-unlock. Prompt every time. |
| `15` | 15 minutes |
| `60` | 1 hour |
| `240` | 4 hours |
| `-1` | **Session** — no time-based expiry. Valid until the tab closes. |

The default is `60` (1 hour).

## Read the current TTL

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

const ttl = vault.getSessionTTL()
console.log(ttl) // 60 by default
```

## Set the TTL

```ts
// Disable auto-unlock (most secure).
vault.setSessionTTL(0)

// Keep the vault unlocked for 4 hours.
vault.setSessionTTL(240)

// Keep the vault unlocked until the tab closes.
vault.setSessionTTL(-1)
```

Setting the TTL to `0` clears the session cache immediately. The user must enter the passphrase on the next unlock.

## Trade-offs

- **Short TTL or Disabled** — more secure. The vault locks sooner and asks for the passphrase more often. Choose this for sensitive data or shared devices.
- **Long TTL or Session** — more convenient. The user stays unlocked longer. Choose this for a trusted, private device where frequent prompts would be annoying.

## Notes

- The TTL config is stored in `localStorage` and survives page reloads.
- The cached passphrase itself lives in `sessionStorage`, which is cleared when the tab closes.
- `tryAutoUnlock` only succeeds when a valid, unexpired cache exists. See [Concepts](../concepts.md) for how the cache works.