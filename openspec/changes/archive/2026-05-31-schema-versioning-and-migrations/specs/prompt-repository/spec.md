## MODIFIED Requirements

### Requirement: bulkImport prompts
The system SHALL provide a `promptRepository.bulkImport(prompts: Prompt[]): Promise<void>` method that writes all given prompts in a single IndexedDB transaction, using `put` semantics (overwrite on id conflict).

#### Scenario: All prompts are stored after bulk import
- **WHEN** `bulkImport` is called with 5 valid prompts
- **THEN** `getAll` returns at least those 5 prompts

### Requirement: IndexedDB database initialisation
The system SHALL open (or create) an IndexedDB database named `byo-prompt-manager` at version `3` using the `idb` library. The database SHALL contain:
- An object store named `prompts` with `id` as the key path and indexes:
  - `by-updatedAt` on the `updatedAt` field
  - `by-tags` on the `tags` field with `multiEntry: true`
  - `by-favorite` on the `isFavorite` field
- An object store named `_meta` with `key` as the key path, storing entries `{ key: string, value: string | number }`

The database SHALL no longer export `getDb()` directly as the primary initialisation entry point. Instead, consumers SHALL use `initDb()` from `db.ts` which orchestrates both structural migration (via `openDB`) and data migration (via `runDataMigrations`).

#### Scenario: First-time initialisation creates both stores
- **WHEN** the app is opened in a browser with no existing IndexedDB data
- **THEN** both the `prompts` and `_meta` object stores are created with the correct structure and no errors are thrown

#### Scenario: Upgrade from version 2 creates _meta store
- **WHEN** the app is opened with an existing DB at version 2
- **THEN** the `_meta` store is added without loss of existing `prompts` data

#### Scenario: Subsequent opens reuse the existing database
- **WHEN** the app is reopened after data has been stored
- **THEN** existing prompts are accessible and no `onupgradeneeded` migration runs
