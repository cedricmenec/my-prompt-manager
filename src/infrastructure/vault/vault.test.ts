import 'fake-indexeddb/auto'
import { IDBFactory } from 'fake-indexeddb'
import { beforeEach, describe, expect, it } from 'vitest'
import { resetDb } from '../db'
import {
  createVault,
  unlockVault,
  lockVault,
  isUnlocked,
  isVaultAvailable,
  getDecryptedPayload,
  persistPayload,
  exportVault,
  importVault,
  changePassphrase,
  deleteVault,
  tryAutoUnlock,
} from './vault'
import {
  getTTLConfig,
  setTTLConfig,
  tryGetSessionPassphrase,
} from './vaultSession'

function cloneForTest<T>(value: T): T {
  return value
}

beforeEach(async () => {
  globalThis.indexedDB = new IDBFactory()
  globalThis.structuredClone = cloneForTest
  resetDb()
  sessionStorage.clear()
  localStorage.clear()
  await deleteVault()
  lockVault()
})

describe('vault façade', () => {
  const PASSPHRASE = 'my-secure-passphrase'

  describe('createVault', () => {
    it('creates a vault and unlocks it', async () => {
      await createVault(PASSPHRASE)

      expect(isUnlocked()).toBe(true)
      expect(await isVaultAvailable()).toBe(true)

      const payload = getDecryptedPayload()
      expect(payload).not.toBeNull()
      expect(payload!.version).toBe(1)
      expect(payload!.apiKeys).toEqual({})
    })
  })

  describe('unlockVault', () => {
    it('unlocks an existing vault with the correct passphrase', async () => {
      await createVault(PASSPHRASE)
      lockVault()
      expect(isUnlocked()).toBe(false)

      await unlockVault(PASSPHRASE)
      expect(isUnlocked()).toBe(true)

      const payload = getDecryptedPayload()
      expect(payload).not.toBeNull()
      expect(payload!.version).toBe(1)
    })

    it('throws "Wrong password" with incorrect passphrase', async () => {
      await createVault(PASSPHRASE)
      lockVault()

      await expect(unlockVault('wrong-passphrase')).rejects.toThrow('Wrong password')
      expect(isUnlocked()).toBe(false)
    })

    it('throws when no vault exists', async () => {
      await expect(unlockVault(PASSPHRASE)).rejects.toThrow('No vault found')
    })
  })

  describe('lockVault', () => {
    it('clears in-memory state', async () => {
      await createVault(PASSPHRASE)
      expect(isUnlocked()).toBe(true)

      lockVault()
      expect(isUnlocked()).toBe(false)
      expect(getDecryptedPayload()).toBeNull()
    })

    it('vault record persists in IDB after lock', async () => {
      await createVault(PASSPHRASE)
      lockVault()

      expect(await isVaultAvailable()).toBe(true)
    })
  })

  describe('isVaultAvailable', () => {
    it('returns false when no vault exists', async () => {
      expect(await isVaultAvailable()).toBe(false)
    })

    it('returns true after vault creation', async () => {
      await createVault(PASSPHRASE)
      expect(await isVaultAvailable()).toBe(true)
    })
  })

  describe('exportVault', () => {
    it('returns null when no vault exists', async () => {
      expect(await exportVault()).toBeNull()
    })

    it('exports the encrypted vault as a JSON-serialisable object', async () => {
      await createVault(PASSPHRASE)
      const exported = await exportVault()

      expect(exported).not.toBeNull()
      expect(exported!.key).toBe('vault')
      expect(exported!.version).toBe(1)
      expect(Array.isArray(exported!.salt)).toBe(true)
      expect(Array.isArray(exported!.iv)).toBe(true)
      expect(Array.isArray(exported!.data)).toBe(true)
      expect(typeof exported!.createdAt).toBe('string')
    })
  })

  describe('importVault', () => {
    it('imports and auto-unlocks a vault', async () => {
      await createVault(PASSPHRASE)
      const exported = (await exportVault()) as Record<string, unknown>

      // Delete current vault and lock
      await deleteVault()
      lockVault()
      expect(await isVaultAvailable()).toBe(false)

      // Import
      await importVault(exported, PASSPHRASE)
      expect(isUnlocked()).toBe(true)
      expect(await isVaultAvailable()).toBe(true)

      const payload = getDecryptedPayload()
      expect(payload!.version).toBe(1)
    })

    it('throws "Wrong password" with incorrect passphrase on import', async () => {
      await createVault(PASSPHRASE)
      const exported = (await exportVault()) as Record<string, unknown>

      await deleteVault()
      lockVault()

      await expect(importVault(exported, 'wrong')).rejects.toThrow('Wrong password')
    })

    it('replaces existing vault on import', async () => {
      await createVault(PASSPHRASE)

      // Create a second vault with different passphrase
      const secondPassphrase = 'second-passphrase'
      await createVault(secondPassphrase)
      const exported = (await exportVault()) as Record<string, unknown>

      // Re-create the first vault
      await createVault(PASSPHRASE)
      lockVault()

      // Import the second vault
      await importVault(exported, secondPassphrase)
      expect(isUnlocked()).toBe(true)

      // Verify we can unlock with the second passphrase
      lockVault()
      await unlockVault(secondPassphrase)
      expect(isUnlocked()).toBe(true)
    })
  })

  describe('changePassphrase', () => {
    it('changes the passphrase and re-encrypts', async () => {
      await createVault(PASSPHRASE)
      const newPassphrase = 'new-secure-passphrase'

      await changePassphrase(PASSPHRASE, newPassphrase)
      expect(isUnlocked()).toBe(true)

      // Lock and try unlocking with old passphrase
      lockVault()
      await expect(unlockVault(PASSPHRASE)).rejects.toThrow('Wrong password')

      // Unlock with new passphrase
      await unlockVault(newPassphrase)
      expect(isUnlocked()).toBe(true)
    })

    it('throws "Wrong password" with incorrect current passphrase', async () => {
      await createVault(PASSPHRASE)

      await expect(
        changePassphrase('wrong', 'new-passphrase'),
      ).rejects.toThrow('Wrong password')
    })

    it('throws when no vault exists', async () => {
      await expect(
        changePassphrase(PASSPHRASE, 'new'),
      ).rejects.toThrow('No vault found')
    })
  })

  describe('deleteVault', () => {
    it('removes the vault from IDB and clears memory', async () => {
      await createVault(PASSPHRASE)
      expect(isUnlocked()).toBe(true)

      await deleteVault()
      expect(isUnlocked()).toBe(false)
      expect(getDecryptedPayload()).toBeNull()
      expect(await isVaultAvailable()).toBe(false)
    })

    it('is safe to call when no vault exists', async () => {
      await deleteVault()
      expect(await isVaultAvailable()).toBe(false)
    })
  })

  describe('API key round-trip through vault payload', () => {
    it('persists and restores apiKeys through create/persist/export/import', async () => {
      // Create vault
      await createVault(PASSPHRASE)

      // Mutate the in-memory payload (simulating sessionCredentials integration)
      const payload = getDecryptedPayload()!
      payload.apiKeys.openrouter = 'sk-or-test-key-12345'

      // Re-encrypt and persist
      await persistPayload()

      // Lock and unlock — payload should be restored from IDB
      lockVault()
      expect(isUnlocked()).toBe(false)

      await unlockVault(PASSPHRASE)
      expect(isUnlocked()).toBe(true)

      const restored = getDecryptedPayload()!
      expect(restored.apiKeys.openrouter).toBe('sk-or-test-key-12345')
    })

    it('persistPayload throws when vault is not unlocked', async () => {
      await expect(persistPayload()).rejects.toThrow('Vault is not unlocked')
    })
  })

  describe('session cache integration', () => {
    it('creates a vault and caches passphrase in sessionStorage', async () => {
      await createVault(PASSPHRASE)

      const cached = tryGetSessionPassphrase()
      expect(cached).toBe(PASSPHRASE)
    })

    it('unlocks a vault and caches passphrase in sessionStorage', async () => {
      await createVault(PASSPHRASE)
      lockVault()

      expect(tryGetSessionPassphrase()).toBeNull()

      await unlockVault(PASSPHRASE)

      const cached = tryGetSessionPassphrase()
      expect(cached).toBe(PASSPHRASE)
    })

    it('lockVault clears the session cache', async () => {
      await createVault(PASSPHRASE)
      expect(tryGetSessionPassphrase()).toBe(PASSPHRASE)

      lockVault()
      expect(tryGetSessionPassphrase()).toBeNull()
    })

    it('deleteVault clears the session cache', async () => {
      await createVault(PASSPHRASE)
      expect(tryGetSessionPassphrase()).toBe(PASSPHRASE)

      await deleteVault()
      expect(tryGetSessionPassphrase()).toBeNull()
    })

    it('importVault caches the new passphrase after import', async () => {
      await createVault(PASSPHRASE)
      const exported = (await exportVault()) as Record<string, unknown>

      await deleteVault()
      lockVault()

      expect(tryGetSessionPassphrase()).toBeNull()

      await importVault(exported, PASSPHRASE)

      const cached = tryGetSessionPassphrase()
      expect(cached).toBe(PASSPHRASE)
    })

    it('importVault clears old cache when importing different vault', async () => {
      await createVault(PASSPHRASE)

      const secondPass = 'second-passphrase'
      const exported = (await exportVault()) as Record<string, unknown>

      // Create vault with second passphrase, then lock
      await createVault(secondPass)
      lockVault()
      // ImportVault should clear cache and re-cache with import passphrase
      await importVault(exported, PASSPHRASE)

      // After lock, cache should be cleared
      lockVault()
      expect(tryGetSessionPassphrase()).toBeNull()
    })
  })

  describe('tryAutoUnlock', () => {
    it('returns false when no session cache exists', async () => {
      await createVault(PASSPHRASE)
      lockVault()

      const result = await tryAutoUnlock()
      expect(result).toBe(false)
      expect(isUnlocked()).toBe(false)
    })

    it('returns true and unlocks when valid cache exists', async () => {
      setTTLConfig(60)
      await createVault(PASSPHRASE)
      lockVault()

      // Manually populate the cache
      sessionStorage.setItem(
        'vault-session-cache',
        JSON.stringify({ passphrase: PASSPHRASE, unlockedAt: Date.now() }),
      )

      const result = await tryAutoUnlock()
      expect(result).toBe(true)
      expect(isUnlocked()).toBe(true)
    })

    it('returns false and clears cache when cached passphrase is wrong', async () => {
      setTTLConfig(60)
      await createVault(PASSPHRASE)
      lockVault()

      // Cache a wrong passphrase
      sessionStorage.setItem(
        'vault-session-cache',
        JSON.stringify({ passphrase: 'wrong-passphrase', unlockedAt: Date.now() }),
      )

      const result = await tryAutoUnlock()
      expect(result).toBe(false)
      expect(isUnlocked()).toBe(false)
      // Cache should be cleared after failed auto-unlock
      expect(tryGetSessionPassphrase()).toBeNull()
    })

    it('returns false when TTL is Disabled', async () => {
      setTTLConfig(0)
      await createVault(PASSPHRASE)
      lockVault()

      // Cache passphrase (but TTL is Disabled)
      sessionStorage.setItem(
        'vault-session-cache',
        JSON.stringify({ passphrase: PASSPHRASE, unlockedAt: Date.now() }),
      )

      const result = await tryAutoUnlock()
      expect(result).toBe(false)
      expect(isUnlocked()).toBe(false)
    })

    it('returns false when TTL has expired', async () => {
      setTTLConfig(15)
      await createVault(PASSPHRASE)
      lockVault()

      // Cache passphrase but with an old timestamp
      sessionStorage.setItem(
        'vault-session-cache',
        JSON.stringify({ passphrase: PASSPHRASE, unlockedAt: Date.now() - 20 * 60 * 1000 }),
      )

      const result = await tryAutoUnlock()
      expect(result).toBe(false)
      expect(isUnlocked()).toBe(false)
    })
  })
})
