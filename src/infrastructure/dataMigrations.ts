import type { IDBPDatabase } from 'idb'
import type { PromptDB } from './db'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DataMigration = {
  version: number
  description: string
  migrate: (db: IDBPDatabase<PromptDB>) => Promise<void>
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Current data schema version. Increment when adding a new data migration. */
export const DATA_SCHEMA_VERSION = 2

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

/** All data migrations, ordered by version ascending. */
export const dataMigrations: DataMigration[] = [
  {
    version: 2,
    description: 'Remove legacy prompt-level model metadata.',
    async migrate(db) {
      const tx = db.transaction('prompts', 'readwrite')
      const store = tx.objectStore('prompts')
      const prompts = await store.getAll()
      await Promise.all(
        prompts.map((prompt) => {
          const { model: _model, ...withoutModel } = prompt as typeof prompt & { model?: unknown }
          return store.put(withoutModel)
        }),
      )
      await tx.done
    },
  },
]

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------

export async function runDataMigrations(db: IDBPDatabase<PromptDB>): Promise<void> {
  const metaEntry = await db.get('_meta', 'schemaVersion')
  const currentVersion = typeof metaEntry?.value === 'number' ? metaEntry.value : 0

  const pending = dataMigrations
    .filter((m) => m.version > currentVersion)
    .sort((a, b) => a.version - b.version)

  for (const migration of pending) {
    await migration.migrate(db)
  }

  await db.put('_meta', { key: 'schemaVersion', value: DATA_SCHEMA_VERSION })
}
