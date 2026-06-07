## Context

The app is a local-first BYOK static web app (no backend). API keys are currently stored in a `Map<string, string>` inside `sessionCredentials.ts` — lost on every page reload. The `ai-provider-model-settings` change established provider/model selection but explicitly deferred encrypted vault persistence for API keys until a secure mechanism existed.

The DB layer uses `idb` (IndexedDB wrapper), currently at schema version 8 with 7 stores. The settings panel has three tabs (`legacy`, `api-models`, `ai-features`). No encryption or crypto utilities exist in the codebase today.

## Goals / Non-Goals

**Goals:**
- Persist API keys and other sensitive data in an encrypted vault stored in IndexedDB
- Use a single user-supplied passphrase to derive an AES-256-GCM encryption key via PBKDF2
- Keep the derived encryption key and decrypted data in memory only — never write them to persistent storage
- Transparent integration: `sessionCredentials` API remains unchanged for all consumers
- Provide vault lifecycle: create, unlock, lock (on page reload), export, import, change passphrase, delete
- Opt-in migration: prompt existing users to create a vault or continue session-only

**Non-Goals:**
- Auto-lock on inactivity timer (only locks on page reload)
- Recovery mechanism if the passphrase is lost (no server, no key escrow)
- Encrypted cloud sync
- Multi-vault or per-provider passphrase support
- Password strength enforcement beyond basic validation (min length)

## Decisions

### D1: Web Crypto API (no external dependencies)

**Choice**: Use native `WebCrypto` (`crypto.subtle`) for PBKDF2 key derivation and AES-256-GCM encryption.

**Alternatives considered:**
- `@noble/ciphers` (XSalsa20+Poly1305): Simpler API, but adds a dependency for something the platform provides natively. Web Crypto is audited by browser vendors and hardware-accelerated.
- `crypto-js`: Deprecated, known security issues, large bundle.

**Rationale**: Web Crypto is the standard for browser-based cryptography. Zero bundle cost, hardware acceleration, no supply chain risk.

### D2: PBKDF2 with 600,000 iterations for key derivation

**Choice**: Derive the AES-GCM key from the passphrase using PBKDF2-SHA256 with 600,000 iterations and a 16-byte random salt.

**Rationale**: OWASP 2023 recommendation for PBKDF2-SHA256 is 600,000 iterations. This provides strong resistance against brute-force passphrase attacks while keeping derivation time under ~500ms on modern hardware.

### D3: Two-stage passphrase verification

**Choice**: Store a lightweight "verify hash" (PBKDF2 with 1,000 iterations) alongside the vault. On unlock, derive the verify hash first (~5ms). If it matches, proceed to derive the full AES key (~200-500ms). If not, show "Wrong password" immediately without attempting the expensive derivation.

**Rationale**: Avoids the UX penalty of a 500ms delay on every wrong passphrase attempt. The verify hash itself reveals nothing about the passphrase or the real key because the iteration counts and the full AES key derivation use different parameters.

### D4: Single vault blob, single passphrase

**Choice**: One vault record in IndexedDB (`key: "vault"`) containing all sensitive data as a single encrypted JSON payload. One passphrase protects everything.

**Alternatives considered:**
- Per-provider vaults: More granular but adds UI complexity and multiple passphrase prompts. Not justified for V1.
- Per-field encryption: More flexible but significantly more complex with no clear benefit.

**Rationale**: Simplicity. One unlock at startup, one passphrase to remember.

### D5: Vault payload schema (versioned)

**Choice**: The decrypted payload is a versioned JSON object:

```typescript
interface VaultPayload {
  version: 1
  apiKeys: Record<string, string>  // providerId → apiKey
  // Extensible for future sensitive data (OAuth tokens, etc.)
}
```

**Rationale**: The `version` field enables future schema migrations of the vault content without changing the encryption layer. The `apiKeys` map mirrors the existing `sessionCredentials` structure.

### D6: IndexedDB store for encrypted blob

**Choice**: A new `encryptedVault` store in the existing `byo-prompt-manager` database, with a single record:

```typescript
interface EncryptedVaultRecord {
  key: 'vault'
  version: 1
  salt: Uint8Array       // 16 bytes — PBKDF2 salt
  iv: Uint8Array         // 12 bytes — AES-GCM IV
  verifyHash: Uint8Array // 32 bytes — lightweight passphrase check
  data: Uint8Array       // encrypted VaultPayload
  createdAt: string      // ISO timestamp
  updatedAt: string      // ISO timestamp
}
```

**Rationale**: Reuses the existing IDB database, keeps schema bumps minimal (v8 → v9), and the `idb` wrapper already used in the project handles the migration.

### D7: Façade pattern — `vault.ts` as single entry point

**Choice**: Three-layer architecture:

```
vaultCrypto.ts  → Pure crypto functions (deriveKey, encrypt, decrypt)
vaultRepository.ts → IDB persistence (load, save, remove)
vault.ts  → Façade (createVault, unlockVault, lockVault, exportVault, importVault, getApiKey, setApiKey)
```

**Rationale**: Separation of concerns. `vaultCrypto` is easily unit-testable (no IDB). `vaultRepository` is easily mockable. `vault` orchestrates the flow and manages the in-memory `CryptoKey`.

### D8: `sessionCredentials` integration via delegation

**Choice**: Modify `sessionCredentials.ts` to delegate to `vault.ts` when the vault is unlocked. The in-memory `Map` remains as a fast cache. On `setApiKey`, the key is written to both the Map and the vault. On `getApiKey`, the Map is checked first; if empty and vault is unlocked, the vault is read and cached in the Map.

**Rationale**: Zero changes to any consumer. The Map cache avoids re-decrypting on every read.

### D9: UI modals at app startup

**Choice**: Two React modals managed by a `VaultGate` component at the top of the app tree:

- `VaultCreateModal`: Shown when no vault exists in IDB (first-time user or user who deleted their vault). Offers "Create vault" or "Skip — session only".
- `VaultUnlockModal`: Shown when a vault exists but isn't unlocked. Requires passphrase to proceed.

The app renders a loading state until the vault state is resolved (exists? unlocked?).

**Rationale**: Gate pattern ensures no component attempts to use API keys before the vault is ready. The "skip" option maintains backward compatibility for users who prefer session-only.

### D10: Export/import as JSON file

**Choice**: Export downloads the raw `EncryptedVaultRecord` as a `.json` file. Import reads a `.json` file, asks for the passphrase, attempts decryption, and replaces the current vault if successful.

**Rationale**: The exported file is the encrypted blob itself — it's useless without the passphrase. No additional encryption layer needed. Simple, verifiable.

## Risks / Trade-offs

- **Web Crypto unavailable** → Fallback to session-only mode. The `VaultGate` component detects `window.crypto?.subtle` at startup and renders a banner: "Encryption unavailable — keys are session-only."
- **PBKDF2 performance on low-end mobile** → 600k iterations may take ~500ms on older devices. Mitigation: this only runs once per page load. Acceptable trade-off for security.
- **Lost passphrase = lost keys** → By design (no server, no escrow). The Settings panel shows a clear warning: "If you lose your passphrase, your encrypted data cannot be recovered. Consider keeping a backup."
- **IDB storage limits** → The vault blob is tiny (~1KB even with many API keys). Not a concern.
- **Race conditions on concurrent vault access** → A simple `Mutex` (promise-based lock) serializes vault operations. Only one encrypt/decrypt can run at a time.
- **Vault blob tampering** → AES-GCM provides authenticated encryption. Tampering with the ciphertext produces a decryption error, which is surfaced as "Vault corrupted — data cannot be decrypted."
