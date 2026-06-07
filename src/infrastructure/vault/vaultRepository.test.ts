import 'fake-indexeddb/auto'
import { IDBFactory } from 'fake-indexeddb'
import { beforeEach, describe, expect, it } from 'vitest'
import { resetDb, type EncryptedVaultRecord } from '../db'
import { load, save, remove, exists } from './vaultRepository'

function makeRecord(overrides?: Partial<EncryptedVaultRecord>): EncryptedVaultRecord {
  return {
    key: 'vault',
    version: 1,
    salt: new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16]),
    iv: new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]),
    verifyHash: new Uint8Array(32).fill(0xab),
    data: new Uint8Array([100, 101, 102]),
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory()
  globalThis.structuredClone = <T>(value: T) => value
  resetDb()
})

describe('vaultRepository', () => {
  describe('load', () => {
    it('returns null when no vault exists', async () => {
      const result = await load()
      expect(result).toBeNull()
    })

    it('returns the saved vault record', async () => {
      const record = makeRecord()
      await save(record)

      const loaded = await load()
      expect(loaded).not.toBeNull()
      expect(loaded!.key).toBe('vault')
      expect(loaded!.version).toBe(1)
      expect(loaded!.createdAt).toBe('2026-01-01T00:00:00.000Z')
    })
  })

  describe('save', () => {
    it('persists a vault record that can be loaded back', async () => {
      const record = makeRecord()
      record.createdAt = '2026-06-07T10:00:00.000Z'
      record.updatedAt = '2026-06-07T10:00:00.000Z'
      await save(record)

      const loaded = await load()
      expect(loaded!.createdAt).toBe('2026-06-07T10:00:00.000Z')
    })

    it('overwrites an existing record when saved again', async () => {
      const record1 = makeRecord()
      record1.updatedAt = '2026-06-01T00:00:00.000Z'
      await save(record1)

      const record2 = makeRecord()
      record2.updatedAt = '2026-06-07T00:00:00.000Z'
      await save(record2)

      const loaded = await load()
      expect(loaded!.updatedAt).toBe('2026-06-07T00:00:00.000Z')
    })
  })

  describe('remove', () => {
    it('deletes an existing vault record', async () => {
      await save(makeRecord())
      expect(await exists()).toBe(true)

      await remove()
      expect(await exists()).toBe(false)
      expect(await load()).toBeNull()
    })

    it('is safe to call when no vault exists', async () => {
      await remove() // should not throw
      expect(await load()).toBeNull()
    })
  })

  describe('exists', () => {
    it('returns false when no vault exists', async () => {
      expect(await exists()).toBe(false)
    })

    it('returns true after saving a vault', async () => {
      await save(makeRecord())
      expect(await exists()).toBe(true)
    })

    it('returns false after removing the vault', async () => {
      await save(makeRecord())
      await remove()
      expect(await exists()).toBe(false)
    })
  })
})
