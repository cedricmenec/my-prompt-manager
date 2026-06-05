# Delta Spec: Prompt Repository (image asset storage)

## MODIFIED Requirements

### Requirement: IndexedDB stores optimized prompt image assets
The IndexedDB database SHALL include an object store named `promptImageAssets` for optimized local reference image assets. The store SHALL use `id` as its key path and SHALL support lookup by prompt ID.

The database version SHALL be bumped to create this store without deleting existing `prompts` or `_meta` data.

#### Scenario: Upgrade creates promptImageAssets store
- **WHEN** the app opens an existing database from the previous version
- **THEN** the `promptImageAssets` store is created
- **AND** existing prompt records remain available

#### Scenario: First-time initialization creates image asset store
- **WHEN** the app opens with no existing IndexedDB data
- **THEN** the database contains `prompts`, `_meta`, and `promptImageAssets`

---

### Requirement: Repository persists and retrieves image assets as Blobs
The repository layer SHALL expose typed operations to create, retrieve, list by prompt, and delete prompt image assets. Asset binary data SHALL be stored and returned as a `Blob`.

#### Scenario: Created asset is retrievable
- **WHEN** an optimized WebP image asset is stored
- **THEN** retrieving it by ID returns its metadata and `Blob`

#### Scenario: Assets can be listed by prompt
- **WHEN** a prompt has one or more stored image asset records
- **THEN** listing assets for the prompt ID returns those records

#### Scenario: Missing asset returns undefined
- **WHEN** the repository is asked for an unknown image asset ID
- **THEN** it resolves with `undefined`

---

### Requirement: Repository prevents stale image assets from accumulating
When a prompt's local image asset is replaced or removed, the repository SHALL delete the previously referenced asset if it is no longer referenced. When a prompt is deleted, local image assets owned by that prompt SHALL be deleted as part of the same logical operation.

#### Scenario: Replacing asset deletes old unreferenced asset
- **WHEN** a prompt with an existing `imageAssetId` is updated to reference a different local asset
- **THEN** the old asset is removed if no prompt references it

#### Scenario: Removing local image deletes old asset
- **WHEN** a prompt's `imageAssetId` is cleared
- **THEN** the previously referenced local asset is removed if no prompt references it

#### Scenario: Deleting prompt deletes owned image assets
- **WHEN** a prompt with local image assets is deleted
- **THEN** its associated local image asset records are also deleted
