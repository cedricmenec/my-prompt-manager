import 'fake-indexeddb/auto'
import { IDBFactory } from 'fake-indexeddb'
import { beforeEach, describe, expect, it } from 'vitest'
import { createIndexedDbStorage } from '../storage/indexeddb'
import { generateSalt, generateIv } from '../core/crypto'
import type { EncryptedRecord } from '../core/types'

describe('indexeddb-storage', () => {
  let storage: ReturnType<typeof createIndexedDbStorage>

  beforeEach(() => {
    globalThis.indexedDB = new IDBFactory()
    storage = createIndexedDbStorage({
      dbName: 'test-db',
      storeName: 'vaultStore',
    })
  })

  it('load returns null when no record exists', async () => {
    expect(await storage.load()).toBeNull()
  })

  it('exists returns false when no record', async () => {
    expect(await storage.exists()).toBe(false)
  })

  it('save and load round-trip', async () => {
    const record = makeRecord()
    await storage.save(record)

    const loaded = await storage.load()
    expect(loaded).not.toBeNull()
    expect(loaded!.key).toBe('vault')
    expect(loaded!.version).toBe(1)
  })

  it('exists returns true after save', async () => {
    await storage.save(makeRecord())
    expect(await storage.exists()).toBe(true)
  })

  it('remove clears the record', async () => {
    await storage.save(makeRecord())
    await storage.remove()
    expect(await storage.load()).toBeNull()
    expect(await storage.exists()).toBe(false)
  })

  it('remove is safe when no record exists', async () => {
    await expect(storage.remove()).resolves.toBeUndefined()
  })

  it('save overwrites existing record', async () => {
    const record1 = makeRecord({ version: 1 })
    const record2 = makeRecord({ version: 2 })
    await storage.save(record1)
    await storage.save(record2)
    const loaded = await storage.load()
    expect(loaded!.version).toBe(2)
  })

  it('preserves binary data through round-trip', async () => {
    const record = makeRecord()
    await storage.save(record)
    const loaded = await storage.load()

    expect(Array.from(loaded!.salt)).toEqual(Array.from(record.salt))
    expect(Array.from(loaded!.iv)).toEqual(Array.from(record.iv))
    expect(Array.from(loaded!.verifyHash)).toEqual(Array.from(record.verifyHash))
    expect(Array.from(loaded!.data)).toEqual(Array.from(record.data))
  })

  it('uses default store key when not provided', async () => {
    const defaultStorage = createIndexedDbStorage({
      dbName: 'test-default',
      storeName: 'defaultStore',
    })

    const record = makeRecord()
    await defaultStorage.save(record)
    expect(await defaultStorage.load()).not.toBeNull()
  })

  it('stores are isolated between databases', async () => {
    const storageA = createIndexedDbStorage({ dbName: 'db-a', storeName: 'store' })
    const storageB = createIndexedDbStorage({ dbName: 'db-b', storeName: 'store' })

    await storageA.save(makeRecord({ version: 1 }))
    expect(await storageA.exists()).toBe(true)
    expect(await storageB.exists()).toBe(false)
  })

  it('auto-creates object store on first access', async () => {
    const freshStorage = createIndexedDbStorage({
      dbName: 'fresh-db',
      storeName: 'freshStore',
    })
    await freshStorage.save(makeRecord())
    expect(await freshStorage.exists()).toBe(true)
  })
})

function makeRecord(overrides?: Partial<EncryptedRecord>): EncryptedRecord {
  return {
    key: 'vault',
    version: 1,
    salt: generateSalt(),
    iv: generateIv(),
    verifyHash: new Uint8Array(32),
    data: new Uint8Array([1, 2, 3, 4]),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }
}