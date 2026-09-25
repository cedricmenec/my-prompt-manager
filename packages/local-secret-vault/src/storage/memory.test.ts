import { describe, expect, it } from 'vitest'
import { createMemoryStorage } from '../storage/memory'
import { generateSalt, generateIv } from '../core/crypto'
import type { EncryptedRecord } from '../core/types'

describe('memory-storage', () => {
  let storage: ReturnType<typeof createMemoryStorage>

  beforeEach(() => {
    storage = createMemoryStorage()
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

    expect(loaded!.salt).toEqual(record.salt)
    expect(loaded!.iv).toEqual(record.iv)
    expect(loaded!.verifyHash).toEqual(record.verifyHash)
    expect(loaded!.data).toEqual(record.data)
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