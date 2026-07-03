import { beforeEach, describe, expect, it, afterEach } from 'vitest'
import {
  storeSessionPassphrase,
  tryGetSessionPassphrase,
  clearSessionCache,
  getTTLConfig,
  setTTLConfig,
} from '../core/session'

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

describe('session', () => {
  // --------------------------------------------------------------------------
  // TTL config (localStorage)
  // --------------------------------------------------------------------------

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

    it('clears session cache when TTL is Disabled (0)', () => {
      storeSessionPassphrase('test-passphrase')
      expect(tryGetSessionPassphrase()).not.toBeNull()

      setTTLConfig(0)
      expect(tryGetSessionPassphrase()).toBeNull()
    })
  })

  // --------------------------------------------------------------------------
  // Session cache (sessionStorage)
  // --------------------------------------------------------------------------

  describe('storeSessionPassphrase / tryGetSessionPassphrase', () => {
    it('stores and retrieves a passphrase with default TTL', () => {
      storeSessionPassphrase('my-passphrase')
      const result = tryGetSessionPassphrase()
      expect(result).toBe('my-passphrase')
    })

    it('returns null when no cache exists', () => {
      expect(tryGetSessionPassphrase()).toBeNull()
    })

    it('returns null when TTL is Disabled (0) and clears cache', () => {
      setTTLConfig(0)
      storeSessionPassphrase('my-passphrase')
      expect(tryGetSessionPassphrase()).toBeNull()
    })

    it('returns null for expired cache', () => {
      setTTLConfig(15)
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ passphrase: 'old-passphrase', unlockedAt: Date.now() - 20 * 60 * 1000 }),
      )
      expect(tryGetSessionPassphrase()).toBeNull()
    })

    it('returns passphrase for Session mode (-1) regardless of age', () => {
      setTTLConfig(-1)
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ passphrase: 'session-passphrase', unlockedAt: Date.now() - 999 * 60 * 1000 }),
      )
      expect(tryGetSessionPassphrase()).toBe('session-passphrase')
    })

    it('clears expired cache entry', () => {
      setTTLConfig(15)
      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ passphrase: 'old-passphrase', unlockedAt: Date.now() - 20 * 60 * 1000 }),
      )
      tryGetSessionPassphrase()
      expect(sessionStorage.getItem(STORAGE_KEY)).toBeNull()
    })
  })

  describe('clearSessionCache', () => {
    it('removes the cached passphrase', () => {
      storeSessionPassphrase('test-passphrase')
      expect(tryGetSessionPassphrase()).not.toBeNull()

      clearSessionCache()
      expect(tryGetSessionPassphrase()).toBeNull()
    })
  })
})