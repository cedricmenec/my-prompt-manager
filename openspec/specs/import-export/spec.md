# Import/Export

## Purpose

Provides JSON-based manual import and export of the prompt library — enabling backup, restore, and cross-device migration without a backend.
## Requirements
### Requirement: Export prompts to JSON file
The system SHALL provide an `exportPromptsToJson(prompts: Prompt[]): Promise<void>` function that:
- Serialises all prompts into a JSON object with the envelope `{ exportedAt, appVersion, schemaVersion, promptCount, prompts, imageAssets? }`
- Sets `exportedAt` to the current ISO 8601 timestamp
- Sets `appVersion` to `import.meta.env.VITE_APP_VERSION` (semver string)
- Sets `schemaVersion` to `DATA_SCHEMA_VERSION` (integer)
- Includes local image asset records separately from the `prompts` array when prompts reference local assets
- Keeps prompt records free of inline image binary data or base64 payloads
- Triggers a browser file download named `byo-prompts-YYYY-MM-DD.json` (date taken from `exportedAt`)
- Does not send any data to an external server

#### Scenario: Export downloads a valid JSON file with version fields
- **WHEN** `exportPromptsToJson` is called with a non-empty array of prompts
- **THEN** a JSON file is downloaded whose `schemaVersion` is a positive integer, `appVersion` is a semver string, and whose `prompts` array matches the input

#### Scenario: Export with empty library produces valid envelope
- **WHEN** `exportPromptsToJson` is called with an empty array
- **THEN** the downloaded file contains `{ schemaVersion: <number>, appVersion: <string>, promptCount: 0, prompts: [] }`

#### Scenario: Export separates prompts and image assets
- **WHEN** prompts with local image assets are exported to JSON
- **THEN** prompt records contain `imageAssetId`
- **AND** the image asset payloads are present in a top-level image assets section
- **AND** prompt objects do not contain inline base64 image data

#### Scenario: Export without local assets remains valid
- **WHEN** prompts with only `imageUrl` references are exported
- **THEN** the export remains valid without requiring image asset payloads

---

### Requirement: Parse and validate an import JSON file
The system SHALL provide a `parseImportFile(file: File): Promise<ImportParseResult>` function that:
- Reads the file as text and parses it as JSON
- Rejects immediately with a typed `ImportFormatError` if the JSON is malformed
- Rejects with `ImportFormatError` if `schemaVersion` is absent AND `schema` field is also absent
- Rejects with `ImportFormatError` if the file's `schemaVersion` is greater than `DATA_SCHEMA_VERSION` (fichier trop récent)
- Considère `schemaVersion: 1` si le fichier contient `schema: "v1"` sans `schemaVersion` explicite (compatibilité ascendante)
- Si le `schemaVersion` du fichier est inférieur au courant, applique la chaîne de transformateurs `importTransformers` pour migrer les données à la volée
- Valide chaque entrée dans `prompts` individuellement contre `PromptSchema` en utilisant `safeParse`
- Restores valid exported local image asset payloads into `Blob` records represented in the parse result
- Retourne `{ valid: Prompt[], imageAssets: PromptImageAsset[], errors: ImportValidationError[], migrationWarning?: string }` où `migrationWarning` est défini si une migration à la volée a eu lieu
- Ne lance jamais d'exception pour les échecs de validation individuels ; ceux-ci s'accumulent dans `errors`

#### Scenario: File with matching schemaVersion imports without warning
- **WHEN** `parseImportFile` is called with a file whose `schemaVersion` equals `DATA_SCHEMA_VERSION`
- **THEN** the result has `migrationWarning` undefined and `errors` of length 0 (if all prompts valid)

#### Scenario: File with older schemaVersion triggers migration warning
- **WHEN** `parseImportFile` is called with a file whose `schemaVersion` is less than `DATA_SCHEMA_VERSION`
- **THEN** the result has `migrationWarning` set to a non-empty string describing the migration

#### Scenario: File with schemaVersion greater than current rejects
- **WHEN** `parseImportFile` is called with a file whose `schemaVersion` exceeds `DATA_SCHEMA_VERSION`
- **THEN** the promise rejects with an `ImportFormatError`

#### Scenario: Legacy file with schema "v1" is treated as schemaVersion 1
- **WHEN** `parseImportFile` is called with a file containing `schema: "v1"` and no `schemaVersion` field
- **THEN** the file is accepted and treated as `schemaVersion: 1`

#### Scenario: File with all valid prompts returns empty errors array
- **WHEN** `parseImportFile` is called with a well-formed JSON file where every prompt passes schema validation
- **THEN** the result has `errors` of length 0 and `valid` containing all prompts

#### Scenario: File with mixed valid and invalid prompts returns both
- **WHEN** `parseImportFile` is called with a file containing 3 valid prompts and 2 invalid ones
- **THEN** `valid` has length 3 and `errors` has length 2 with `index` values identifying the invalid entries

#### Scenario: Import restores local asset Blob
- **WHEN** an export containing image asset payloads is imported
- **THEN** each valid payload is restored as a `Blob` in the image asset result set
- **AND** prompts reference the restored asset IDs

#### Scenario: Legacy imageUrl-only import remains supported
- **WHEN** an imported file contains prompts with `imageUrl` and no local image asset payloads
- **THEN** those prompts import successfully as before

#### Scenario: Invalid asset payload is reported without rejecting valid prompts
- **WHEN** an imported file contains valid prompts and an invalid image asset payload
- **THEN** valid prompts are still returned for import
- **AND** the invalid asset is reported in import errors or warnings

#### Scenario: Malformed JSON rejects with ImportFormatError
- **WHEN** `parseImportFile` is called with a file containing invalid JSON
- **THEN** the promise rejects with an `ImportFormatError`

---

### Requirement: Import result types
The system SHALL export the following TypeScript types from `importExport.ts`:
- `ImportParseResult`: `{ valid: Prompt[]; imageAssets: PromptImageAsset[]; errors: ImportValidationError[]; migrationWarning?: string }`
- `ImportValidationError`: `{ index: number; reason: string }`
- `ImportFormatError`: typed `Error` subclass with `name: "ImportFormatError"`

#### Scenario: Import result types are exported
- **WHEN** `importExport.ts` is imported
- **THEN** `ImportParseResult`, `ImportValidationError`, and `ImportFormatError` are available as named exports

### Requirement: Import transformers registry
The system SHALL define in `src/infrastructure/importExport.ts` a `importTransformers` record mapping schema version numbers to transformer functions `(prompts: unknown[]) => unknown[]`. Each transformer converts data from the previous version to the target version. The registry MAY be empty if no transformations are defined yet.

#### Scenario: Empty registry causes no transformation
- **WHEN** `importTransformers` is empty and `parseImportFile` receives a file at `schemaVersion: 1` with current `DATA_SCHEMA_VERSION: 1`
- **THEN** no transformation is applied

### Requirement: ImportParseResult includes migrationWarning
The system SHALL export an updated `ImportParseResult` type:
`{ valid: Prompt[]; imageAssets: PromptImageAsset[]; errors: ImportValidationError[]; migrationWarning?: string }`

#### Scenario: migrationWarning is undefined when no migration occurred
- **WHEN** the imported file has the same `schemaVersion` as `DATA_SCHEMA_VERSION`
- **THEN** `result.migrationWarning` is `undefined`

### Requirement: Markdown/frontmatter compatibility keeps imageUrl behavior
Markdown/frontmatter import and export SHALL continue to support the existing `imageUrl` field. Markdown/frontmatter export SHALL NOT inline local image binary data into YAML frontmatter.

#### Scenario: Markdown export preserves imageUrl
- **WHEN** a prompt with `imageUrl` is exported to Markdown
- **THEN** the frontmatter includes `imageUrl` as before

#### Scenario: Markdown export omits binary local image data
- **WHEN** a prompt with a local image asset is exported to Markdown
- **THEN** no binary image payload or base64 image data is written into frontmatter

---

### Requirement: Export prompts to configured Google Drive folder
The system SHALL allow the user to export the current prompt library JSON to the configured
visible Google Drive folder when Google Drive is connected and folder access has been configured.
This SHALL preserve the existing local JSON export behavior.

#### Scenario: Drive export succeeds
- **WHEN** the user chooses to export prompts to Google Drive while connected and the configured folder is accessible
- **THEN** the system uploads a valid prompt export JSON file to the configured Drive folder

#### Scenario: Drive export requires connection
- **WHEN** the user chooses to export prompts to Google Drive while disconnected
- **THEN** the system prompts the user to connect Google Drive and does not upload a file

#### Scenario: Local export remains available
- **WHEN** the user chooses the existing local JSON export action
- **THEN** the system downloads the export file locally without requiring Google Drive

---

### Requirement: Import prompts from configured Google Drive folder
The system SHALL allow the user to import a prompt JSON file from the configured visible Google
Drive folder when Google Drive is connected and folder access has been configured. Drive imports
SHALL use the same parse, validation, confirmation, and replacement behavior as local JSON imports.

#### Scenario: Drive import shows confirmation
- **WHEN** the user selects a valid prompt export JSON file from the configured Drive folder
- **THEN** the system parses the file and shows the same replacement confirmation used for local imports

#### Scenario: Drive import with invalid file shows error
- **WHEN** the selected Drive file is malformed or has an unsupported schema version
- **THEN** the system shows an error and does not modify local prompt data

#### Scenario: Drive import preserves local import behavior
- **WHEN** the user chooses the existing local JSON import action
- **THEN** the system continues to support local file selection and validation without requiring Google Drive

---

### Requirement: Export payload excludes sensitive configuration
The system SHALL ensure that local JSON exports, Google Drive exports, and Google Drive snapshots
exclude sensitive configuration. Sensitive configuration includes AI API keys, OAuth access tokens,
OAuth refresh tokens, client secrets, passphrases, and connector secrets.

#### Scenario: Export excludes API keys
- **WHEN** an AI API key exists in the current session or local configuration
- **THEN** exported prompt JSON and Drive snapshot payloads do not include the API key

#### Scenario: Export excludes OAuth tokens
- **WHEN** a Google Drive OAuth token exists in the current browser session
- **THEN** exported prompt JSON and Drive snapshot payloads do not include the token

#### Scenario: Export includes prompt data
- **WHEN** the prompt library contains prompts and local image assets
- **THEN** exported prompt JSON and Drive snapshot payloads include exportable prompt records and valid local image asset payloads
