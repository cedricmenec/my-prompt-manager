import { beforeEach, describe, expect, it, afterEach } from 'vitest'
import {
  storeSessionPassphrase,
  tryGetSessionPassphrase,
  clearSessionCache,
  getTTLConfig,
  setTTLConfig,
} from './vaultSession'

const STORAGE_KEY = 'vault-session-cache'
const CONFIG_KEY = 'vault-session-ttl'

beforeEach(() => {
  sessionStorage.clear()
  localStorage.clear()
})

afterEach(() => {
  sessionStorage.clear()
  localStorage.clear()
})

describe('vaultSession', () => {
  // ---------------------------------------------------------------------------
  // TTL config (localStorage)
  // ---------------------------------------------------------------------------

  describe('getTTLConfig', () => {
    it('returns 60 (default) when no config exists', () => {
      expect(getTTLConfig()).toBe(60)
    })

    it('returns stored valid TTL', () => {
      localStorage.setItem(CONFIG_KEY, '15')
      expect(getTTLConfig()).toBe(15)
    })

    it('returns 60 for invalid stored value', () => {
      localStorage.setItem(CONFIG_KEY, '999')
      expect(getTTLConfig()).toBe(60)
    })

    it('returns 60 for non-numeric stored value', () => {
      localStorage.setItem(CONFIG_KEY, 'abc')
      expect(getTTLConfig()).toBe(60)
    })
  })

  describe('setTTLConfig', () => {
    it('persists the TTL to localStorage', () => {
      setTTLConfig(15)
      expect(localStorage.getItem(CONFIG_KEY)).toBe('15')
    })

    it('persists Session (-1)', () => {
      setTTLConfig(-1)
      expect(localStorage.getItem(CONFIG_KEY)).toBe('-1')
    })

    it('persists Disabled (0)', () => {
      setTTLConfig(0)
      expect(localStorage.getItem(CONFIG_KEY)).toBe('0')
    })

    it('clears session cache when TTL is set to Disabled (0)', () => {
      storeSessionPassphrase('test-passphrase')
      expect(tryGetSessionPassphrase()).toBe('test-passphrase')

      setTTLConfig(0)
      expect(tryGetSessionPassphrase()).toBeNull()
      expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull()
    })

    it('does NOT clear session cache when TTL is set to non-zero', () => {
      storeSessionPassphrase('test-passphrase')

      setTTLConfig(15)
      expect(tryGetSessionPassphrase()).toBe('test-passphrase')
    })
  })

  // ---------------------------------------------------------------------------
  // Session cache (sessionStorage)
  // ---------------------------------------------------------------------------

  describe('storeSessionPassphrase', () => {
    it('stores passphrase with unlockedAt timestamp', () => {
      const before = Date.now()
      storeSessionPassphrase('my-pass')
      const after = Date.now()

      const raw = sessionStorage.getItem(STORAGE_KEY)
      expect(raw).not.toBeNull()

      const parsed = JSON.parse(raw!)
      expect(parsed.passphrase).toBe('my-pass')
      expect(parsed.unlockedAt).toBeGreaterThanOrEqual(before)
      expect(parsed.unlockedAt).toBeLessThanOrEqual(after)
    })

    it('overwrites previous cache entry', () => {
      storeSessionPassphrase('first')
      storeSessionPassphrase('second')

      const parsed = JSON.parse(sessionStorage.getItem(STORAGE_KEY)!)
      expect(parsed.passphrase).toBe('second')
    })
  })

  describe('tryGetSessionPassphrase', () => {
    it('returns null when no cache exists', () => {
      expect(tryGetSessionPassphrase()).toBeNull()
    })

    it('returns passphrase when cache exists and TTL is valid', () => {
      localStorage.setItem(CONFIG_KEY, '60')
      storeSessionPassphrase('cached-pass')

      expect(tryGetSessionPassphrase()).toBe('cached-pass')
    })

    it('returns null when TTL is Disabled (0)', () => {
      localStorage.setItem(CONFIG_KEY, '0')
      storeSessionPassphrase('cached-pass')

      expect(tryGetSessionPassphrase()).toBeNull()
      // Disabled mode also clears the cache
      expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull()
    })

    it('returns passphrase when TTL is Session (-1) regardless of time', () => {
      localStorage.setItem(CONFIG_KEY, '-1')
      storeSessionPassphrase('cached-pass')

      expect(tryGetSessionPassphrase()).toBe('cached-pass')
    })

    it('returns null when TTL has expired', () => {
      localStorage.setItem(CONFIG_KEY, '15')
      storeSessionPassphrase('cached-pass')

      // Manipulate timestamp to be 16 minutes ago
      const cache = JSON.parse(sessionStorage.getItem(STORAGE_KEY)!)
      cache.unlockedAt = Date.now() - 16 * 60 * 1000
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(cache))

      expect(tryGetSessionPassphrase()).toBeNull()
      // Expired entry is cleared
      expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull()
    })

    it('returns passphrase when still within TTL window', () => {
      localStorage.setItem(CONFIG_KEY, '15')
      storeSessionPassphrase('cached-pass')

      // Manipulate timestamp to be 10 minutes ago
      const cache = JSON.parse(sessionStorage.getItem(STORAGE_KEY)!)
      cache.unlockedAt = Date.now() - 10 * 60 * 1000
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(cache))

      expect(tryGetSessionPassphrase()).toBe('cached-pass')
    })

    it('returns null when sessionStorage has malformed JSON', () => {
      localStorage.setItem(CONFIG_KEY, '60')
      sessionStorage.setItem(STORAGE_KEY, 'not-json')

      expect(tryGetSessionPassphrase()).toBeNull()
    })

    it('returns null when cache entry has no passphrase field', () => {
      localStorage.setItem(CONFIG_KEY, '60')
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ unlockedAt: Date.now() }))

      expect(tryGetSessionPassphrase()).toBeNull()
    })
  })

  describe('clearSessionCache', () => {
    it('removes the cache from sessionStorage', () => {
      storeSessionPassphrase('cached-pass')
      expect(sessionStorage.getItem(STORAGE_KEY)).not.toBeNull()

      clearSessionCache()
      expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull()
    })

    it('is safe to call when no cache exists', () => {
      clearSessionCache() // should not throw
      expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull()
    })
  })
})
