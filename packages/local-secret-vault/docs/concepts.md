# Concepts

This page explains the mental model behind the vault. Read it once, then refer back to it when other pages mention these ideas.

## Local-first model

The vault is **local-first**. All encryption and decryption happens in the browser, on the user's device. There is no server, no account, and no network request.

The encrypted vault record lives in a storage backend on the device. The decryption key and the plaintext payload exist **only in memory** while the vault is unlocked. They are cleared when you lock the vault, which also happens automatically on page reload.

This means:

- Your data never leaves the device.
- If the device's storage is lost, the data is gone. There is no server-side backup.
- The passphrase is the only secret. Anyone who has both the stored record and the passphrase can decrypt it.

## Encryption

The vault uses two standard cryptographic primitives from the Web Crypto API:

- **PBKDF2-SHA256** to derive an encryption key from the passphrase.
- **AES-256-GCM** to encrypt and authenticate the payload.

### Key derivation

A passphrase alone is not a strong key. The vault runs the passphrase through PBKDF2 with a random **salt** to produce a 256-bit AES key.

- The full key derivation uses **600,000 iterations**. This is slow on purpose: it makes brute-forcing the passphrase expensive.
- A lightweight **verify hash** uses only **1,000 iterations**. The vault uses it to check a passphrase quickly before doing the expensive full derivation.

### Authenticated encryption

AES-256-GCM encrypts the payload and also produces an authentication tag. If the ciphertext is tampered with, decryption fails. This prevents an attacker from modifying the stored data without detection.

Each encryption uses a fresh random **IV** (initialization vector). Re-encrypting the same payload produces different ciphertext, so an observer cannot tell whether the payload changed.

## Session cache and TTL

After a successful unlock, the vault can cache the passphrase in `sessionStorage` so the user does not have to type it again on every page load.

The **TTL** (time-to-live) controls how long this cache is valid. It is stored in `localStorage` and survives page reloads.

| TTL value | Meaning |
|-----------|---------|
| `0` | **Disabled** — never auto-unlock. Prompt every time. |
| `15` | 15 minutes |
| `60` | 1 hour |
| `240` | 4 hours |
| `-1` | **Session** — no time-based expiry. Valid until the tab closes. |

The trade-off is between security and convenience:

- A short TTL (or Disabled) is more secure: the vault locks sooner and asks for the passphrase more often.
- A long TTL (or Session) is more convenient: the user stays unlocked longer, but a stolen open tab exposes the data for longer.

## Pluggable storage

The vault does not care where the encrypted record is stored. It talks to a **storage backend** through a small interface called `VaultStorage`.

The package ships two backends:

- `createIndexedDbStorage` — persists to IndexedDB. Survives page reloads. This is the default choice for a real app.
- `createMemoryStorage` — keeps records in memory only. Useful for testing and for examples.

You can write your own backend by implementing the `VaultStorage` interface. See [How to write a custom storage backend](how-to/custom-storage-backend.md).

## Error taxonomy

All errors thrown by the vault extend a base `VaultError` class. You can catch the base class to handle any vault error, or catch a specific subtype.

| Error | When it is thrown |
|-------|-------------------|
| `VaultError` | Base class. Also thrown for invalid input, such as a passphrase shorter than 8 characters. |
| `WrongPassphraseError` | The passphrase is incorrect. |
| `VaultNotFoundError` | No vault exists in storage, but an operation requires one. |
| `VaultLockedError` | An operation requires an unlocked vault, but the vault is locked. |
| `CryptoUnavailableError` | The Web Crypto API is not available in the current environment. |

## Next steps

- [Quickstart](quickstart.md) — get a first result in minutes.
- [How-to guides](how-to/README.md) — recipes for common tasks.
- [API reference](api-reference.md) — every function, type, and option.