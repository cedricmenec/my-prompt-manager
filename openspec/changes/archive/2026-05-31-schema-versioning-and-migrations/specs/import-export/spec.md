## MODIFIED Requirements

### Requirement: Import result types
The system SHALL export the following TypeScript types from `importExport.ts`:
- `ImportParseResult`: `{ valid: Prompt[]; errors: ImportValidationError[]; migrationWarning?: string }`
- `ImportValidationError`: `{ index: number; reason: string }`
- `ImportFormatError`: typed `Error` subclass with `name: "ImportFormatError"`

#### Scenario: Import result types are exported
- **WHEN** `importExport.ts` is imported
- **THEN** `ImportParseResult`, `ImportValidationError`, and `ImportFormatError` are available as named exports

### Requirement: Export prompts to JSON file
The system SHALL provide an `exportPromptsToJson(prompts: Prompt[]): void` function that:
- Serialises all prompts into a JSON object with the envelope `{ exportedAt, appVersion, schemaVersion, promptCount, prompts }`
- Sets `exportedAt` to the current ISO 8601 timestamp
- Sets `appVersion` to `import.meta.env.VITE_APP_VERSION` (semver string)
- Sets `schemaVersion` to `DATA_SCHEMA_VERSION` (integer)
- Triggers a browser file download named `byo-prompts-YYYY-MM-DD.json` (date taken from `exportedAt`)
- Does not send any data to an external server

#### Scenario: Export downloads a valid JSON file with version fields
- **WHEN** `exportPromptsToJson` is called with a non-empty array of prompts
- **THEN** a JSON file is downloaded whose `schemaVersion` is a positive integer, `appVersion` is a semver string, and whose `prompts` array matches the input

#### Scenario: Export with empty library produces valid envelope
- **WHEN** `exportPromptsToJson` is called with an empty array
- **THEN** the downloaded file contains `{ schemaVersion: <number>, appVersion: <string>, promptCount: 0, prompts: [] }`

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
- Retourne `{ valid: Prompt[], errors: ImportValidationError[], migrationWarning?: string }` où `migrationWarning` est défini si une migration à la volée a eu lieu
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

#### Scenario: Malformed JSON rejects with ImportFormatError
- **WHEN** `parseImportFile` is called with a file containing invalid JSON
- **THEN** the promise rejects with an `ImportFormatError`

---

## ADDED Requirements

### Requirement: Import transformers registry
The system SHALL define in `src/infrastructure/importExport.ts` a `importTransformers` record mapping schema version numbers to transformer functions `(prompts: unknown[]) => unknown[]`. Each transformer converts data from the previous version to the target version. The registry MAY be empty if no transformations are defined yet.

#### Scenario: Empty registry causes no transformation
- **WHEN** `importTransformers` is empty and `parseImportFile` receives a file at `schemaVersion: 1` with current `DATA_SCHEMA_VERSION: 1`
- **THEN** no transformation is applied

### Requirement: ImportParseResult includes migrationWarning
The system SHALL export an updated `ImportParseResult` type:
`{ valid: Prompt[]; errors: ImportValidationError[]; migrationWarning?: string }`

#### Scenario: migrationWarning is undefined when no migration occurred
- **WHEN** the imported file has the same `schemaVersion` as `DATA_SCHEMA_VERSION`
- **THEN** `result.migrationWarning` is `undefined`
