import 'fake-indexeddb/auto'
import { IDBFactory } from 'fake-indexeddb'
import { beforeEach, describe, expect, it } from 'vitest'
import { Vault, createVault } from '../core/vault'
import { createMemoryStorage } from '../storage/memory'
import { setTTLConfig, tryGetSessionPassphrase } from '../core/session'
import type { VaultPayloadBase } from '../core/types'
import {
  WrongPassphraseError,
  VaultNotFoundError,
  VaultLockedError,
} from '../core/errors'

interface TestPayload extends VaultPayloadBase {
  version: 1
  apiKeys: Record<string, string>
}

const INITIAL_PAYLOAD: TestPayload = { version: 1, apiKeys: {} }
const PASSPHRASE = 'my-secure-passphrase'

function createTestVault(): Vault<TestPayload> {
  return createVault({
    storage: createMemoryStorage(),
    initialPayload: INITIAL_PAYLOAD,
  })
}

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory()
  sessionStorage.clear()
  localStorage.clear()
})

describe('Vault lifecycle', () => {
  describe('create', () => {
    it('creates a vault and unlocks it', async () => {
      const vault = createTestVault()
      await vault.create(PASSPHRASE)

      expect(vault.isUnlocked()).toBe(true)
      expect(await vault.isAvailable()).toBe(true)

      const payload = vault.getPayload()
      expect(payload).not.toBeNull()
      expect(payload!.version).toBe(1)
      expect(payload!.apiKeys).toEqual({})
    })

    it('throws for short passphrase', async () => {
      const vault = createTestVault()
      await expect(vault.create('short')).rejects.toThrow(
        'Passphrase must be at least 8 characters',
      )
      expect(vault.isUnlocked()).toBe(false)
    })
  })

  describe('unlock', () => {
    it('unlocks an existing vault with the correct passphrase', async () => {
      const vault = createTestVault()
      await vault.create(PASSPHRASE)
      vault.lock()
      expect(vault.isUnlocked()).toBe(false)

      await vault.unlock(PASSPHRASE)
      expect(vault.isUnlocked()).toBe(true)

      const payload = vault.getPayload()
      expect(payload).not.toBeNull()
      expect(payload!.version).toBe(1)
    })

    it('throws WrongPassphraseError with incorrect passphrase', async () => {
      const vault = createTestVault()
      await vault.create(PASSPHRASE)
      vault.lock()

      await expect(vault.unlock('wrong-passphrase')).rejects.toThrow(WrongPassphraseError)
      expect(vault.isUnlocked()).toBe(false)
    })

    it('throws VaultNotFoundError when no vault exists', async () => {
      const vault = createTestVault()
      await expect(vault.unlock(PASSPHRASE)).rejects.toThrow(VaultNotFoundError)
    })
  })

  describe('lock', () => {
    it('clears in-memory state', async () => {
      const vault = createTestVault()
      await vault.create(PASSPHRASE)
      expect(vault.isUnlocked()).toBe(true)

      vault.lock()
      expect(vault.isUnlocked()).toBe(false)
      expect(vault.getPayload()).toBeNull()
    })

    it('vault record persists in storage after lock', async () => {
      const vault = createTestVault()
      await vault.create(PASSPHRASE)
      vault.lock()

      expect(await vault.isAvailable()).toBe(true)
    })
  })

  describe('isAvailable', () => {
    it('returns false when no vault exists', async () => {
      const vault = createTestVault()
      expect(await vault.isAvailable()).toBe(false)
    })

    it('returns true after vault creation', async () => {
      const vault = createTestVault()
      await vault.create(PASSPHRASE)
      expect(await vault.isAvailable()).toBe(true)
    })
  })

  describe('export / import', () => {
    it('export returns null when no vault exists', async () => {
      const vault = createTestVault()
      expect(await vault.export()).toBeNull()
    })

    it('exports the encrypted vault as a JSON-serialisable object', async () => {
      const vault = createTestVault()
      await vault.create(PASSPHRASE)
      const exported = await vault.export()

      expect(exported).not.toBeNull()
      expect(exported!.key).toBe('vault')
      expect(exported!.version).toBe(1)
      expect(Array.isArray(exported!.salt)).toBe(true)
      expect(Array.isArray(exported!.iv)).toBe(true)
      expect(Array.isArray(exported!.data)).toBe(true)
      expect(typeof exported!.createdAt).toBe('string')
    })

    it('imports and auto-unlocks a vault', async () => {
      const vault = createTestVault()
      await vault.create(PASSPHRASE)
      const exported = (await vault.export())!

      // Delete current vault and lock
      await vault.delete()
      vault.lock()
      expect(await vault.isAvailable()).toBe(false)

      // Import
      await vault.import(exported, PASSPHRASE)
      expect(vault.isUnlocked()).toBe(true)
      expect(await vault.isAvailable()).toBe(true)

      const payload = vault.getPayload()
      expect(payload!.version).toBe(1)
    })

    it('throws WrongPassphraseError with incorrect passphrase on import', async () => {
      const vault = createTestVault()
      await vault.create(PASSPHRASE)
      const exported = (await vault.export())!

      await vault.delete()
      vault.lock()

      await expect(vault.import(exported, 'wrong')).rejects.toThrow(WrongPassphraseError)
    })

    it('replaces existing vault on import', async () => {
      const vault = createTestVault()
      await vault.create(PASSPHRASE)

      // Create a second vault with different passphrase
      const secondPassphrase = 'second-passphrase'
      await vault.create(secondPassphrase)
      const exported = (await vault.export())!

      // Re-create the first vault
      await vault.create(PASSPHRASE)
      vault.lock()

      // Import the second vault
      await vault.import(exported, secondPassphrase)
      expect(vault.isUnlocked()).toBe(true)

      // Verify we can unlock with the second passphrase
      vault.lock()
      await vault.unlock(secondPassphrase)
      expect(vault.isUnlocked()).toBe(true)
    })
  })

  describe('changePassphrase', () => {
    it('changes the passphrase and re-encrypts', async () => {
      const vault = createTestVault()
      await vault.create(PASSPHRASE)
      const newPassphrase = 'new-secure-passphrase'

      await vault.changePassphrase(PASSPHRASE, newPassphrase)
      expect(vault.isUnlocked()).toBe(true)

      // Lock and try unlocking with old passphrase
      vault.lock()
      await expect(vault.unlock(PASSPHRASE)).rejects.toThrow(WrongPassphraseError)

      // Unlock with new passphrase
      await vault.unlock(newPassphrase)
      expect(vault.isUnlocked()).toBe(true)
    })

    it('throws WrongPassphraseError with incorrect current passphrase', async () => {
      const vault = createTestVault()
      await vault.create(PASSPHRASE)

      await expect(
        vault.changePassphrase('wrong', 'new-passphrase'),
      ).rejects.toThrow(WrongPassphraseError)
    })

    it('throws VaultNotFoundError when no vault exists', async () => {
      const vault = createTestVault()
      await expect(
        vault.changePassphrase(PASSPHRASE, 'new'),
      ).rejects.toThrow(VaultNotFoundError)
    })
  })

  describe('delete', () => {
    it('removes the vault from storage and clears memory', async () => {
      const vault = createTestVault()
      await vault.create(PASSPHRASE)
      expect(vault.isUnlocked()).toBe(true)

      await vault.delete()
      expect(vault.isUnlocked()).toBe(false)
      expect(vault.getPayload()).toBeNull()
      expect(await vault.isAvailable()).toBe(false)
    })

    it('is safe to call when no vault exists', async () => {
      const vault = createTestVault()
      await vault.delete()
      expect(await vault.isAvailable()).toBe(false)
    })
  })

  describe('API key round-trip through vault payload', () => {
    it('persists and restores apiKeys through create/persist/export/import', async () => {
      const vault = createTestVault()
      await vault.create(PASSPHRASE)

      // Mutate the in-memory payload
      const payload = vault.getPayload()!
      payload.apiKeys.openrouter = 'sk-or-test-key-12345'

      // Re-encrypt and persist
      await vault.persistPayload()

      // Lock and unlock — payload should be restored from storage
      vault.lock()
      expect(vault.isUnlocked()).toBe(false)

      await vault.unlock(PASSPHRASE)
      expect(vault.isUnlocked()).toBe(true)

      const restored = vault.getPayload()!
      expect(restored.apiKeys.openrouter).toBe('sk-or-test-key-12345')
    })

    it('persistPayload throws VaultLockedError when vault is not unlocked', async () => {
      const vault = createTestVault()
      await expect(vault.persistPayload()).rejects.toThrow(VaultLockedError)
    })
  })

  describe('session cache integration', () => {
    it('creates a vault and caches passphrase in sessionStorage', async () => {
      const vault = createTestVault()
      await vault.create(PASSPHRASE)

      const cached = tryGetSessionPassphrase()
      expect(cached).toBe(PASSPHRASE)
    })

    it('unlocks a vault and caches passphrase', async () => {
      const vault = createTestVault()
      await vault.create(PASSPHRASE)
      vault.lock()

      expect(tryGetSessionPassphrase()).toBeNull()

      await vault.unlock(PASSPHRASE)
      expect(tryGetSessionPassphrase()).toBe(PASSPHRASE)
    })

    it('lock clears the session cache', async () => {
      const vault = createTestVault()
      await vault.create(PASSPHRASE)
      expect(tryGetSessionPassphrase()).toBe(PASSPHRASE)

      vault.lock()
      expect(tryGetSessionPassphrase()).toBeNull()
    })

    it('delete clears the session cache', async () => {
      const vault = createTestVault()
      await vault.create(PASSPHRASE)
      expect(tryGetSessionPassphrase()).toBe(PASSPHRASE)

      await vault.delete()
      expect(tryGetSessionPassphrase()).toBeNull()
    })

    it('import caches the new passphrase after import', async () => {
      const vault = createTestVault()
      await vault.create(PASSPHRASE)
      const exported = (await vault.export())!

      await vault.delete()
      vault.lock()

      expect(tryGetSessionPassphrase()).toBeNull()

      await vault.import(exported, PASSPHRASE)
      expect(tryGetSessionPassphrase()).toBe(PASSPHRASE)
    })
  })

  describe('tryAutoUnlock', () => {
    it('returns false when no session cache exists', async () => {
      const vault = createTestVault()
      await vault.create(PASSPHRASE)
      vault.lock()

      const result = await vault.tryAutoUnlock()
      expect(result).toBe(false)
      expect(vault.isUnlocked()).toBe(false)
    })

    it('returns true and unlocks when valid cache exists', async () => {
      setTTLConfig(60)
      const vault = createTestVault()
      await vault.create(PASSPHRASE)
      vault.lock()

      // Manually populate the cache
      sessionStorage.setItem(
        'vault-session-cache',
        JSON.stringify({ passphrase: PASSPHRASE, unlockedAt: Date.now() }),
      )

      const result = await vault.tryAutoUnlock()
      expect(result).toBe(true)
      expect(vault.isUnlocked()).toBe(true)
    })

    it('returns false and clears cache when cached passphrase is wrong', async () => {
      setTTLConfig(60)
      const vault = createTestVault()
      await vault.create(PASSPHRASE)
      vault.lock()

      sessionStorage.setItem(
        'vault-session-cache',
        JSON.stringify({ passphrase: 'wrong-passphrase', unlockedAt: Date.now() }),
      )

      const result = await vault.tryAutoUnlock()
      expect(result).toBe(false)
      expect(vault.isUnlocked()).toBe(false)
      expect(tryGetSessionPassphrase()).toBeNull()
    })

    it('returns false when TTL is Disabled', async () => {
      setTTLConfig(0)
      const vault = createTestVault()
      await vault.create(PASSPHRASE)
      vault.lock()

      sessionStorage.setItem(
        'vault-session-cache',
        JSON.stringify({ passphrase: PASSPHRASE, unlockedAt: Date.now() }),
      )

      const result = await vault.tryAutoUnlock()
      expect(result).toBe(false)
      expect(vault.isUnlocked()).toBe(false)
    })

    it('returns false when TTL has expired', async () => {
      setTTLConfig(15)
      const vault = createTestVault()
      await vault.create(PASSPHRASE)
      vault.lock()

      sessionStorage.setItem(
        'vault-session-cache',
        JSON.stringify({ passphrase: PASSPHRASE, unlockedAt: Date.now() - 20 * 60 * 1000 }),
      )

      const result = await vault.tryAutoUnlock()
      expect(result).toBe(false)
      expect(vault.isUnlocked()).toBe(false)
    })
  })

  describe('multiple vault instances isolation', () => {
    it('two vault instances operate independently', async () => {
      const vaultA = createTestVault()
      const vaultB = createVault({
        storage: createMemoryStorage(),
        initialPayload: INITIAL_PAYLOAD,
      })

      await vaultA.create('passphrase-a')
      expect(vaultA.isUnlocked()).toBe(true)
      expect(vaultB.isUnlocked()).toBe(false)

      vaultA.lock()
      expect(vaultA.isUnlocked()).toBe(false)

      await vaultB.create('passphrase-b')
      expect(vaultB.isUnlocked()).toBe(true)
      expect(vaultA.isUnlocked()).toBe(false)
    })
  })

  describe('session TTL convenience', () => {
    it('getSessionTTL returns current TTL', () => {
      const vault = createTestVault()
      expect(vault.getSessionTTL()).toBe(60)
    })

    it('setSessionTTL updates TTL', () => {
      const vault = createTestVault()
      vault.setSessionTTL(15)
      expect(vault.getSessionTTL()).toBe(15)
    })
  })
})