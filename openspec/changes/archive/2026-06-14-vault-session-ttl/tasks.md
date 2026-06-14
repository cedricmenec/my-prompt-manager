## 1. Session Cache Module

- [x] 1.1 Create `src/infrastructure/vault/vaultSession.ts` with:
  - `TTLMinutes` type: `0 | 15 | 60 | 240 | -1`
  - `storeSessionPassphrase(passphrase: string): void` — writes `{ passphrase, unlockedAt }` to `sessionStorage`
  - `tryGetSessionPassphrase(): string | null` — reads from `sessionStorage`, checks TTL from config, returns `null` if expired/missing/disabled, clears expired entries
  - `clearSessionCache(): void` — removes the cache entry from `sessionStorage`
  - `getTTLConfig(): TTLMinutes` — reads from `localStorage` key `vault-session-ttl`, defaults to `60`
  - `setTTLConfig(ttl: TTLMinutes): void` — writes to `localStorage`, clears `sessionStorage` cache if TTL is `0` (Disabled)
- [x] 1.2 Create unit tests for `vaultSession.ts` covering: store/retrieve round-trip, TTL expiry, Disabled (0) returns null, Session (-1) never expires, `clearSessionCache()`, `setTTLConfig` with Disabled clears cache, default TTL when no config exists

## 2. Vault Façade Integration

- [x] 2.1 Modify `src/infrastructure/vault/vault.ts` — import `vaultSession` module:
  - `createVault()`: after successful creation, call `storeSessionPassphrase(passphrase)`
  - `unlockVault()`: after successful unlock, call `storeSessionPassphrase(passphrase)`
  - `lockVault()`: before clearing memory, call `clearSessionCache()`
  - `deleteVault()`: after removal, call `clearSessionCache()`
  - `importVault()`: after successful import + unlock, call `storeSessionPassphrase(passphrase)` (the NEW passphrase)
- [x] 2.2 Export `tryAutoUnlock` helper from `vault.ts` that:
  - Calls `tryGetSessionPassphrase()` from `vaultSession`
  - If a passphrase is returned, calls `unlockVault(passphrase)` (bypasses the mutex for initialization path or uses it)
  - Returns `true` on success, `false` on failure (catches "Wrong password" and clears cache on failure)
- [x] 2.3 Update existing `vault.test.ts` to cover: auto-unlock success, auto-unlock with wrong cached passphrase, cache cleared on lock/delete/import

## 3. VaultGate Integration

- [x] 3.1 Modify `src/features/vault/VaultGate.tsx`:
  - After checking vault availability, call `tryAutoUnlock()` BEFORE showing the unlock modal
  - If `tryAutoUnlock()` returns `true`, set state to `'unlocked'`
  - If `tryAutoUnlock()` returns `false`, proceed to `'locked'` state (shows unlock modal)
  - The auto-unlock attempt should be silent — no loading indicator or error message
- [ ] 3.2 Update `vaultComponents.test.tsx` to cover: auto-unlock success path, auto-unlock failure fallback to modal

## 4. Vault Settings UI

- [ ] 4.1 Modify `src/features/settings/VaultSettingsSection.tsx`:
  - Add a "Session timeout" subsection, rendered only when `status.available` is true
  - Import `getTTLConfig` and `setTTLConfig` from `vaultSession`
  - Add radio buttons for the five presets: Disabled, 15 min, 1 hour (default), 4 hours, Session
  - Each radio option has a descriptive label explaining the security tradeoff
  - The currently active TTL is visually selected
  - On change, call `setTTLConfig(newTTL)` — do NOT lock the vault
- [ ] 4.2 Update `VaultSettingsSection` tests (or `SettingsPanel` tests) to cover: section visibility when vault exists, section hidden when no vault, TTL selection persists, Disabled option clears cache

## 5. Final Validation

- [ ] 5.1 Run full test suite (`rtk vitest run`) and verify all new and existing tests pass
- [ ] 5.2 Manual smoke test matrix:

  | Scenario | Expected |
  |----------|----------|
  | Create vault → F5 | Auto-unlock (TTL 60min default) |
  | Unlock vault → wait >1h → F5 | Prompt (TTL expired) |
  | Set TTL to Disabled → unlock → F5 | Prompt (cache disabled) |
  | Set TTL to Session → unlock → F5 → F5 | Auto-unlock every time |
  | Unlock → lock manually in Settings → F5 | Prompt (cache cleared) |
  | Unlock → change passphrase → F5 | Auto-unlock fails → falls back to prompt → enter new passphrase → works |
  | Unlock → delete vault → F5 | No vault, create prompt |
  | Unlock in Tab A → open Tab B | Tab B shows unlock prompt (isolated cache) |
  | Set TTL to 15min → unlock → F5 within 15min | Auto-unlock |
  | Set TTL to 15min → unlock → F5 after 15min | Prompt |
