## Why

The encrypted vault currently locks on every page reload (F5) and tab wake-up, requiring the user to re-enter their passphrase. This is the maximum-security stance the spec originally mandated: *"The system SHALL lock the vault on every page reload."*

In practice, the API keys stored in the vault are not ultra-critical — the user considers them sensitive enough to encrypt at rest in IndexedDB, but not so critical that they need to re-enter a passphrase 20+ times per day. The friction is high and degrades the BYOK experience.

The goal is to keep the vault's encryption-at-rest guarantee while reducing unlock prompts during normal usage sessions, using a configurable session-based cache.

## What Changes

- **New `vaultSession` module** (`src/infrastructure/vault/vaultSession.ts`): Stores the passphrase in `sessionStorage` with an `unlockedAt` timestamp. On page load, checks TTL before auto-unlocking. On manual lock, clears the cache.
- **Configurable TTL**: Four preset values stored in `localStorage` under `vault-session-ttl`:
  - `0` (Disabled) — no cache, prompt every time (current behavior, for max-security users)
  - `15` minutes — higher security
  - `60` minutes — balanced (default)
  - `240` minutes — extended convenience
  - `-1` (Session) — cache survives until tab close, no time-based expiry
- **`VaultGate` integration**: Calls `tryAutoUnlock()` before showing the unlock modal. Falls back gracefully to the prompt if auto-unlock fails (wrong passphrase in cache, TTL expired, no cache).
- **Cache invalidation**: `lockVault()`, `deleteVault()`, and `importVault()` clear the session cache so the next page load prompts for the passphrase.
- **Vault settings UI enrichment**: A "Session timeout" section in `VaultSettingsSection` with radio buttons for TTL presets. The section is only visible when a vault exists.

## Capabilities

### New Capabilities

- `vault-session-cache`: Session-based passphrase caching with configurable TTL, stored in `sessionStorage`, auto-unlock on page reload within TTL window.

### Modified Capabilities

- `encrypted-vault`: `lockVault()`, `deleteVault()`, and `importVault()` gain cache-clearing side-effects. `unlockVault()` gains cache-writing. The vault lifecycle spec is updated to reflect session caching behavior.
- `settings-panel`: `VaultSettingsSection` gains a "Session timeout" configuration subsection with TTL presets and status display.

## Impact

- **New files**: `src/infrastructure/vault/vaultSession.ts` (session cache logic) + tests
- **Modified files**: `vault.ts` (cache integration in lock/unlock/delete/import), `VaultGate.tsx` (auto-unlock attempt before prompt), `VaultSettingsSection.tsx` (TTL config UI)
- **Dependencies**: None — `sessionStorage` and `localStorage` are native browser APIs.
- **Risk**: The passphrase in `sessionStorage` is readable by any JS running on the same origin (XSS vector). Mitigation: XSS already allows intercepting the passphrase at input time; the TTL limits exposure window; `sessionStorage` is per-tab, not shared across origins.
- **No breaking changes**: All existing vault consumers work unchanged. Users who don't configure TTL get the default 1-hour behavior.
