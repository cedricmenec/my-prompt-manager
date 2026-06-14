## Context

The app uses an encrypted vault (Web Crypto PBKDF2 + AES-256-GCM) to store API keys at rest in IndexedDB. The vault locks on every page reload because the derived `CryptoKey` and decrypted `VaultPayload` are held in module-level JS variables — lost when the page unloads.

Current flow:
```
Page load → vault exists in IDB? → yes → key in memory? → no → show unlock modal → user enters passphrase → key derived → vault unlocked
```

The friction is the unlock modal appearing on every F5 / tab wake-up.

## Goals / Non-Goals

**Goals:**
- Reduce unlock prompts during normal usage (F5, tab wake-up) without removing encryption at rest
- Keep the vault locked on new tab / browser restart
- Allow users to opt out entirely (Disabled = current behavior)
- Configurable TTL with sensible presets
- Cache invalidation on manual lock, vault deletion, and vault import
- Graceful fallback: if auto-unlock fails, show the prompt as before

**Non-Goals:**
- Persistent "remember me" across browser restarts (that would require storing the passphrase in IndexedDB or localStorage — bypassing encryption entirely)
- Device-bound key derivation (WebAuthn/PRF) — overkill for API keys
- Per-provider granularity
- Idle-time auto-lock mid-session (only applies on page reload)

## Decisions

### D1: `sessionStorage` as the cache layer

**Choice**: Store `{ passphrase, unlockedAt }` in `sessionStorage`.

**Alternatives considered:**
- `localStorage`: Survives browser restart — too persistent, effectively bypasses the vault for anyone with device access.
- `IndexedDB`: Same persistence concern as `localStorage`.
- `SharedWorker`: Would survive page reloads within the same origin, but doesn't help with tab suspension, adds significant complexity, and has poor mobile support.
- Cookie with `Max-Age`: Requires HTTPS `Secure` flag, adds cookie consent complexity, sent on every HTTP request (though there are none in this SPA).

**Rationale**: `sessionStorage` is the right semantic fit:
- Survives page reloads (F5) ✅
- Cleared on tab close ✅
- Per-tab isolated (tab A's unlock doesn't leak to tab B) ✅
- Cleared on browser restart ✅
- Zero overhead, native API ✅

### D2: TTL presets with `localStorage` persistence

**Choice**: Store TTL config in `localStorage` under key `vault-session-ttl`. Preset values: `0` (Disabled), `15`, `60` (default), `240`, `-1` (Session).

**Why `localStorage` for config but `sessionStorage` for passphrase:**
- Config must survive F5 (otherwise user loses their preference on reload)
- Config is NOT sensitive (just a number), so `localStorage` is fine
- Passphrase IS sensitive, so `sessionStorage` (cleared on tab close) is appropriate

**Why presets, not a free-form number input:**
- Reduces decision fatigue
- Each preset has a clear semantic label
- Avoids validation edge cases (0, negative, extremely large values)
- `-1` as sentinel for "Session" (no expiry) is cleanly distinct from `0` (Disabled)

### D3: TTL check at page load, not mid-session

**Choice**: The TTL is checked only when `VaultGate` mounts (page load). Once the vault is unlocked, it stays unlocked for the duration of the page session.

**Rationale**: Mid-session auto-lock would be disruptive (user typing a prompt, vault locks, loses context). The vault already locks on page unload because the `CryptoKey` is in JS memory. Adding a `setTimeout`-based auto-lock adds complexity for marginal security gain — if an attacker has access to the running page, they already have the decrypted keys.

### D4: Cache invalidation triggers

The session cache MUST be cleared in these scenarios:

| Trigger | Reason |
|---------|--------|
| `lockVault()` (manual) | User explicitly locked — cache would defeat the purpose |
| `deleteVault()` | Vault gone — stale passphrase is useless and confusing |
| `importVault()` | Imported vault may have different passphrase — stale cache causes auto-unlock failure |

The cache is NOT cleared on:
- `changePassphrase()` — the old passphrase in cache will fail on next auto-unlock, falling back gracefully to the prompt. The user enters the new passphrase, which gets cached.
- TTL config change — the new TTL takes effect on the next page load. Changing config should not be punitive.

### D5: Auto-unlock fallback is transparent

**Choice**: `tryAutoUnlock(passphrase)` returns a boolean. On `false`, `VaultGate` proceeds to show `VaultUnlockModal` as it does today. No error toast, no "auto-unlock failed" message — the user just sees the familiar prompt.

**Rationale**: Don't draw attention to the mechanism. The fallback is exactly the current behavior. If auto-unlock fails because of a wrong cached passphrase (e.g., after passphrase change), the user naturally enters the correct one.

### D6: `VaultSettingsSection` enrichment, not a new page

**Choice**: Add a "Session timeout" subsection to the existing `VaultSettingsSection` component, rather than creating a separate vault settings page.

**Rationale**: The Vault tab in Settings already serves as the dedicated vault configuration page. Adding a subsection keeps all vault-related settings co-located and discoverable. The Settings panel already has tab-based navigation.

### D7: Radio buttons for TTL selection

**Choice**: Radio buttons with descriptive labels, not a dropdown.

```
○ Disabled — Prompt every time (most secure)
● 1 hour — Balanced (recommended)
○ 15 minutes — Higher security
○ 4 hours — Extended convenience
○ Session — No auto-lock (until tab closed)
```

**Rationale**: Radio buttons make all options visible at a glance, allow descriptive labels, and avoid the "hidden options" problem of dropdowns. The security tradeoff of each option is explicit.
