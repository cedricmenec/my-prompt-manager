import { describe, it, expect, beforeEach } from 'vitest'
import 'fake-indexeddb/auto'
import { IDBFactory } from 'fake-indexeddb'
import { runDataMigrations, DATA_SCHEMA_VERSION, dataMigrations, type DataMigration } from './dataMigrations'
import { initDb, resetDb } from './db'

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory()
  resetDb()
})

describe('runDataMigrations', () => {
  it('writes schemaVersion = DATA_SCHEMA_VERSION on a fresh DB', async () => {
    const db = await initDb()
    const entry = await db.get('_meta', 'schemaVersion')
    expect(entry?.value).toBe(DATA_SCHEMA_VERSION)
  })

  it('does nothing when schemaVersion is already current', async () => {
    const db = await initDb()
    // Run again — should not throw and schemaVersion stays the same
    await runDataMigrations(db)
    const entry = await db.get('_meta', 'schemaVersion')
    expect(entry?.value).toBe(DATA_SCHEMA_VERSION)
  })

  it('applies pending migrations in ascending version order', async () => {
    const db = await initDb()

    const order: number[] = []
    const migration1: DataMigration = {
      version: DATA_SCHEMA_VERSION + 1,
      description: 'test migration 1',
      migrate: async () => { order.push(1) },
    }
    const migration2: DataMigration = {
      version: DATA_SCHEMA_VERSION + 2,
      description: 'test migration 2',
      migrate: async () => { order.push(2) },
    }

    // Temporarily inject migrations
    dataMigrations.push(migration2, migration1) // intentionally out of order
    try {
      await runDataMigrations(db)
    } finally {
      dataMigrations.splice(dataMigrations.indexOf(migration1), 1)
      dataMigrations.splice(dataMigrations.indexOf(migration2), 1)
    }

    expect(order).toEqual([1, 2])
  })

  it('initialises schemaVersion when _meta has no schemaVersion entry', async () => {
    const db = await initDb()
    // Remove schemaVersion to simulate fresh state
    await db.delete('_meta', 'schemaVersion')
    await runDataMigrations(db)
    const entry = await db.get('_meta', 'schemaVersion')
    expect(entry?.value).toBe(DATA_SCHEMA_VERSION)
  })
})
