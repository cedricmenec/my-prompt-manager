import 'fake-indexeddb/auto'
import { IDBFactory } from 'fake-indexeddb'
import { beforeEach, describe, expect, it } from 'vitest'
import { resetDb } from './db'
import { sessionCredentials } from './sessionCredentials'
import { createVault, lockVault, unlockVault, deleteVault, getDecryptedPayload, persistPayload } from './vault'

function cloneForTest<T>(value: T): T {
  return value
}

const PASSPHRASE = 'test-passphrase-123'

beforeEach(async () => {
  globalThis.indexedDB = new IDBFactory()
  globalThis.structuredClone = cloneForTest
  resetDb()
  await deleteVault()
  lockVault()
  sessionCredentials.clearAll()
})

describe('sessionCredentials', () => {
  it('keeps API keys in memory for the current session', () => {
    sessionCredentials.setApiKey('openrouter', ' sk-or-session ')

    expect(sessionCredentials.getApiKey('openrouter')).toBe('sk-or-session')
  })

  it('does not write API keys to localStorage', () => {
    sessionCredentials.setApiKey('openrouter', 'sk-or-session')

    expect(JSON.stringify(localStorage)).not.toContain('sk-or-session')
  })

  it('clears empty or deleted provider keys', () => {
    sessionCredentials.setApiKey('openrouter', 'sk-or-session')
    sessionCredentials.setApiKey('openrouter', ' ')

    expect(sessionCredentials.getApiKey('openrouter')).toBeUndefined()
  })

  describe('vault integration', () => {
    it('set persists to vault when unlocked', async () => {
      await createVault(PASSPHRASE)
      sessionCredentials.setApiKey('openrouter', 'sk-or-persist-test')

      // Give fire-and-forget persistPayload a tick
      await new Promise((r) => setTimeout(r, 50))

      const payload = getDecryptedPayload()
      expect(payload!.apiKeys.openrouter).toBe('sk-or-persist-test')
    })

    it('get restores from vault payload when not in cache', async () => {
      await createVault(PASSPHRASE)

      // Directly write into vault payload (simulating a previous session)
      const payload = getDecryptedPayload()!
      payload.apiKeys.openrouter = 'sk-or-restored'

      // Persist the mutated payload to IDB before locking
      await persistPayload()

      lockVault()
      sessionCredentials.clearAll()

      await unlockVault(PASSPHRASE)

      // getApiKey should fall back to vault payload
      expect(sessionCredentials.getApiKey('openrouter')).toBe('sk-or-restored')
    })

    it('clearAll clears cache but not vault', async () => {
      await createVault(PASSPHRASE)
      sessionCredentials.setApiKey('openrouter', 'sk-or-test')
      await new Promise((r) => setTimeout(r, 50))

      sessionCredentials.clearAll()

      // Vault payload still has the key — getApiKey falls back to it
      const payload = getDecryptedPayload()
      expect(payload!.apiKeys.openrouter).toBe('sk-or-test')

      // And getApiKey can restore from vault
      expect(sessionCredentials.getApiKey('openrouter')).toBe('sk-or-test')

      // But deleting the vault removes the fallback
      await deleteVault()
      lockVault()
      sessionCredentials.clearAll()
      expect(sessionCredentials.getApiKey('openrouter')).toBeUndefined()
    })

    it('removes key from vault payload when set with empty string', async () => {
      await createVault(PASSPHRASE)
      sessionCredentials.setApiKey('openrouter', 'sk-or-test')
      await new Promise((r) => setTimeout(r, 50))

      sessionCredentials.setApiKey('openrouter', ' ')
      await new Promise((r) => setTimeout(r, 50))

      const payload = getDecryptedPayload()
      expect(payload!.apiKeys.openrouter).toBeUndefined()
    })

    it('falls back to session-only when vault is not unlocked', () => {
      // No vault created — no vault fallback
      sessionCredentials.setApiKey('openrouter', 'sk-or-session-only')
      expect(sessionCredentials.getApiKey('openrouter')).toBe('sk-or-session-only')
    })
  })
})