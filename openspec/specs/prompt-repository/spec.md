# Prompt Repository

## Purpose

Defines the IndexedDB-backed persistence layer for prompts: database initialisation, and the full CRUD + bulk-import API.
## Requirements
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

### Requirement: getAll prompts
The system SHALL provide a `promptRepository.getAll(): Promise<Prompt[]>` method that returns all stored prompts sorted by `updatedAt` descending.

#### Scenario: Empty store returns empty array
- **WHEN** `getAll` is called on an empty database
- **THEN** it resolves with `[]`

#### Scenario: Multiple prompts are returned sorted by updatedAt desc
- **WHEN** three prompts with different `updatedAt` values exist in the store
- **THEN** `getAll` resolves with all three, newest first

---

### Requirement: getById prompt
The system SHALL provide a `promptRepository.getById(id: string): Promise<Prompt | undefined>` method.

#### Scenario: Existing prompt is returned
- **WHEN** `getById` is called with the id of a stored prompt
- **THEN** it resolves with the matching `Prompt` object

#### Scenario: Non-existent id returns undefined
- **WHEN** `getById` is called with an id not in the store
- **THEN** it resolves with `undefined`

---

### Requirement: create prompt
The system SHALL provide a `promptRepository.create(data: Omit<Prompt, 'id' | 'createdAt' | 'updatedAt'>): Promise<Prompt>` method that:
- Generates a UUIDv4 for `id`
- Sets `createdAt` and `updatedAt` to the current ISO timestamp
- Stores the full `Prompt` object in IndexedDB
- Returns the stored `Prompt`

#### Scenario: Created prompt is retrievable
- **WHEN** `create` is called with valid data
- **THEN** the returned prompt has a valid UUID `id`, and `getById(id)` returns the same prompt

---

### Requirement: update prompt
The system SHALL provide a `promptRepository.update(id: string, data: Partial<Omit<Prompt, 'id' | 'createdAt'>>): Promise<Prompt>` method that:
- Merges the partial data into the existing prompt
- Updates `updatedAt` to the current ISO timestamp
- Persists the result and returns the updated `Prompt`
- Throws a typed `PromptNotFoundError` if no prompt with that id exists

#### Scenario: Field update is persisted
- **WHEN** `update` is called with a new `title`
- **THEN** `getById` returns the prompt with the new title and a refreshed `updatedAt`

#### Scenario: Updating non-existent prompt throws
- **WHEN** `update` is called with an unknown id
- **THEN** it rejects with `PromptNotFoundError`

#### Scenario: Updating favorite status is persisted
- **WHEN** `update` is called with `isFavorite: true`
- **THEN** `getById` returns the prompt with `isFavorite: true`

---

### Requirement: delete prompt
The system SHALL provide a `promptRepository.delete(id: string): Promise<void>` method that removes the prompt from the store. If the id does not exist, the method SHALL resolve without error (idempotent).

#### Scenario: Deleted prompt is no longer retrievable
- **WHEN** `delete` is called with an existing prompt id
- **THEN** `getById(id)` returns `undefined` afterwards

#### Scenario: Deleting unknown id is a no-op
- **WHEN** `delete` is called with an id not in the store
- **THEN** the promise resolves without throwing

---

### Requirement: bulkImport prompts
The system SHALL provide a `promptRepository.bulkImport(prompts: Prompt[]): Promise<void>` method that writes all given prompts in a single IndexedDB transaction, using `put` semantics (overwrite on id conflict).

#### Scenario: All prompts are stored after bulk import
- **WHEN** `bulkImport` is called with 5 valid prompts
- **THEN** `getAll` returns at least those 5 prompts

### Requirement: deleteAll prompts
The system SHALL provide a `promptRepository.deleteAll(): Promise<void>` method that removes all prompts from the `prompts` object store in a single IndexedDB transaction.

#### Scenario: All prompts are removed after deleteAll
- **WHEN** `deleteAll` is called on a store containing prompts
- **THEN** `getAll` returns `[]` immediately after

#### Scenario: deleteAll on empty store is a no-op
- **WHEN** `deleteAll` is called on an empty store
- **THEN** the promise resolves without throwing

#### Scenario: All prompts are stored after bulk import
- **WHEN** `bulkImport` is called with 5 valid prompts
- **THEN** `getAll` returns at least those 5 prompts

