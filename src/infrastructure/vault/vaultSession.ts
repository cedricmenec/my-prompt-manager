/**
 * Session-based passphrase cache for the encrypted vault.
 *
 * Stores the passphrase in `sessionStorage` (per-tab, cleared on tab close)
 * with an `unlockedAt` timestamp. On page load, checks a configurable TTL
 * before auto-unlocking the vault.
 *
 * TTL config is persisted in `localStorage` (survives page reloads) under
 * the key `vault-session-ttl`. Passphrase cache is in `sessionStorage`.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** TTL preset values in minutes. `0` = Disabled, `-1` = Session (no expiry). */
export type TTLMinutes = 0 | 15 | 60 | 240 | -1

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'vault-session-cache'
const CONFIG_KEY = 'vault-session-ttl'
const DEFAULT_TTL: TTLMinutes = 60
const VALID_TTLS: readonly TTLMinutes[] = [0, 15, 60, 240, -1]

// ---------------------------------------------------------------------------
// Internal shape stored in sessionStorage
// ---------------------------------------------------------------------------

interface SessionCache {
  passphrase: string
  unlockedAt: number // Date.now()
}

// ---------------------------------------------------------------------------
// TTL config (localStorage)
// ---------------------------------------------------------------------------

/**
 * Read the configured TTL from `localStorage`.
 * Returns the default (60 minutes) when no config exists or the value is invalid.
 */
export function getTTLConfig(): TTLMinutes {
  try {
    const raw = localStorage.getItem(CONFIG_KEY)
    if (raw === null) return DEFAULT_TTL

    const parsed = Number(raw)
    if ((VALID_TTLS as readonly number[]).includes(parsed)) {
      return parsed as TTLMinutes
    }
    return DEFAULT_TTL
  } catch {
    return DEFAULT_TTL
  }
}

/**
 * Persist the TTL configuration to `localStorage`.
 * When the TTL is set to `0` (Disabled), the session cache is cleared immediately.
 */
export function setTTLConfig(ttl: TTLMinutes): void {
  try {
    localStorage.setItem(CONFIG_KEY, String(ttl))
  } catch {
    // localStorage unavailable — ignore
  }

  if (ttl === 0) {
    clearSessionCache()
  }
}

// ---------------------------------------------------------------------------
// Session cache (sessionStorage)
// ---------------------------------------------------------------------------

/**
 * Store the passphrase and current timestamp in `sessionStorage`.
 * Called after a successful manual unlock.
 */
export function storeSessionPassphrase(passphrase: string): void {
  try {
    const cache: SessionCache = {
      passphrase,
      unlockedAt: Date.now(),
    }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(cache))
  } catch {
    // sessionStorage unavailable — ignore
  }
}

/**
 * Attempt to retrieve the cached passphrase from `sessionStorage`.
 *
 * Returns the passphrase **only** if:
 * 1. A cache entry exists
 * 2. The TTL config is not Disabled (0)
 * 3. The cache has not expired (based on TTL and `unlockedAt` timestamp)
 *    OR the TTL is Session (-1, no time-based expiry)
 *
 * Returns `null` when no valid cached passphrase is available.
 * Clears expired cache entries automatically.
 */
export function tryGetSessionPassphrase(): string | null {
  const ttl = getTTLConfig()

  // Disabled — never auto-unlock
  if (ttl === 0) {
    clearSessionCache()
    return null
  }

  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null

    const cache: SessionCache = JSON.parse(raw)

    // Session mode (-1) — cache is valid until tab close (no time check)
    if (ttl === -1) {
      return cache.passphrase ?? null
    }

    // TTL check: is the cache still fresh?
    const elapsed = Date.now() - cache.unlockedAt
    const ttlMs = ttl * 60 * 1000

    if (elapsed < ttlMs) {
      return cache.passphrase ?? null
    }

    // Expired — clear it
    clearSessionCache()
    return null
  } catch {
    return null
  }
}

/**
 * Clear the session cache from `sessionStorage`.
 * Called on manual lock, vault deletion, and vault import.
 */
export function clearSessionCache(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // sessionStorage unavailable — ignore
  }
}
