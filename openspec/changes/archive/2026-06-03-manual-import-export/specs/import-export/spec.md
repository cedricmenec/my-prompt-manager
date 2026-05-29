## ADDED Requirements

### Requirement: Export prompts to JSON file
The system SHALL provide an `exportPromptsToJson(prompts: Prompt[]): void` function that:
- Serialises all prompts into a JSON object with the envelope `{ exportedAt, schema, promptCount, prompts }`
- Sets `exportedAt` to the current ISO 8601 timestamp
- Sets `schema` to `"v1"`
- Triggers a browser file download named `byo-prompts-YYYY-MM-DD.json` (date taken from `exportedAt`)
- Does not send any data to an external server

#### Scenario: Export downloads a valid JSON file
- **WHEN** `exportPromptsToJson` is called with a non-empty array of prompts
- **THEN** a JSON file is downloaded whose `schema` is `"v1"` and whose `prompts` array matches the input

#### Scenario: Export with empty library produces valid envelope
- **WHEN** `exportPromptsToJson` is called with an empty array
- **THEN** the downloaded file contains `{ schema: "v1", promptCount: 0, prompts: [] }`

---

### Requirement: Parse and validate an import JSON file
The system SHALL provide a `parseImportFile(file: File): Promise<ImportParseResult>` function that:
- Reads the file as text and parses it as JSON
- Rejects immediately with a typed `ImportFormatError` if the JSON is malformed or the `schema` field is not `"v1"`
- Validates each entry in `prompts` individually against `PromptSchema` using `safeParse`
- Returns `{ valid: Prompt[], errors: ImportValidationError[] }` where `errors` contains `{ index, reason }` for each invalid entry
- Never throws for individual prompt validation failures; those accumulate in `errors`

#### Scenario: File with all valid prompts returns empty errors array
- **WHEN** `parseImportFile` is called with a well-formed JSON file where every prompt passes schema validation
- **THEN** the result has `errors` of length 0 and `valid` containing all prompts

#### Scenario: File with mixed valid and invalid prompts returns both
- **WHEN** `parseImportFile` is called with a file containing 3 valid prompts and 2 invalid ones
- **THEN** `valid` has length 3 and `errors` has length 2 with `index` values identifying the invalid entries

#### Scenario: Malformed JSON rejects with ImportFormatError
- **WHEN** `parseImportFile` is called with a file containing invalid JSON
- **THEN** the promise rejects with an `ImportFormatError`

#### Scenario: Unknown schema version rejects with ImportFormatError
- **WHEN** `parseImportFile` is called with a JSON file whose `schema` field is not `"v1"`
- **THEN** the promise rejects with an `ImportFormatError`

---

### Requirement: Import result types
The system SHALL export the following TypeScript types from `importExport.ts`:
- `ImportParseResult`: `{ valid: Prompt[]; errors: ImportValidationError[] }`
- `ImportValidationError`: `{ index: number; reason: string }`
- `ImportFormatError`: typed `Error` subclass with `name: "ImportFormatError"`
