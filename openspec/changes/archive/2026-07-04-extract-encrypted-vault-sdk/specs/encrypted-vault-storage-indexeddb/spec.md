# Encrypted Vault Storage — IndexedDB

## Purpose

Provides a built-in `VaultStorage` implementation for the local-encrypted-vault SDK using the `idb` library and the browser's IndexedDB API. The storage plugin manages its own database connection and object store, independent of the host application's database schema.

## ADDED Requirements

### Requirement: IndexedDB storage factory
The SDK SHALL export `createIndexedDbStorage(options: IndexedDbStorageOptions): VaultStorage` where `IndexedDbStorageOptions` includes `dbName: string` (database name), `storeName: string` (object store name), and optional `storeKey: string` (record key, default `'vault'`).

#### Scenario: Creates storage with custom database and store names
- **WHEN** a consumer calls `createIndexedDbStorage({ dbName: 'my-app', storeName: 'vaultStore' })`
- **THEN** a `VaultStorage` implementation is returned
- **AND** operations use the `my-app` database and `vaultStore` object store

#### Scenario: Default store key is 'vault'
- **WHEN** no `storeKey` is provided
- **THEN** the storage plugin uses `'vault'` as the record key

### Requirement: Storage creates its own object store
The storage plugin SHALL create the target object store if it does not exist during database open. The store SHALL use `keyPath: 'key'` as its primary key.

#### Scenario: Store is auto-created on first access
- **WHEN** the first `load()`, `save()`, `remove()`, or `exists()` call is made
- **THEN** the database is opened (or created)
- **AND** the object store is created if missing
- **AND** the operation proceeds normally

#### Scenario: Existing store is reused
- **WHEN** the object store already exists in the database
- **THEN** it is used as-is (no upgrade conflict)

### Requirement: EncryptedRecord with binary-safe fields
The storage plugin SHALL persist and retrieve `EncryptedRecord` objects where `salt`, `iv`, `verifyHash`, and `data` fields are `Uint8Array`. The `idb` library SHALL handle serialization of typed arrays transparently.

#### Scenario: Save and load preserves binary data
- **WHEN** an `EncryptedRecord` with `Uint8Array` fields is saved and then loaded
- **THEN** the loaded record has byte-identical `Uint8Array` fields

### Requirement: Storage operations
The storage plugin SHALL implement all four `VaultStorage` methods: `load()`, `save()`, `remove()`, `exists()`.

#### Scenario: Load returns null when no record
- **WHEN** `load()` is called and no record exists with the configured store key
- **THEN** it returns `null`

#### Scenario: Save overwrites existing record
- **WHEN** `save()` is called twice with different data
- **THEN** the second call overwrites the first record

#### Scenario: Remove succeeds even if no record exists
- **WHEN** `remove()` is called and no record exists
- **THEN** it does not throw

#### Scenario: Exists reflects current state
- **WHEN** a record has been saved
- **THEN** `exists()` returns `true`
- **AND** after `remove()`, `exists()` returns `false`

### Requirement: No cross-contamination between databases
Each storage instance SHALL operate on its own database connection. Two storage instances with different `dbName` values SHALL not interfere with each other.

#### Scenario: Separate databases are isolated
- **WHEN** two storage instances are created with different `dbName` values
- **THEN** saving to one does not affect the other
- **AND** each instance only sees its own records