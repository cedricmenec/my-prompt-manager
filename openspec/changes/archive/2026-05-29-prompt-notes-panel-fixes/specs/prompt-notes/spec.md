## ADDED Requirements

### Requirement: Notes field on prompt
The system SHALL provide a `notes` field of type `string` (optional, no default) on the `Prompt` type and Zod schema. The field SHALL be stored in YAML frontmatter and preserved through all read/write cycles.

#### Scenario: Prompt with notes passes schema validation
- **WHEN** a prompt object with a non-empty `notes` string is parsed by `PromptSchema`
- **THEN** `schema.parse()` succeeds and the returned object includes the `notes` value unchanged

#### Scenario: Prompt without notes is valid
- **WHEN** a prompt object without a `notes` field is parsed
- **THEN** `schema.parse()` succeeds and `notes` is `undefined` on the result

#### Scenario: Notes round-trips through Markdown serialization
- **WHEN** a `Prompt` with a multi-line `notes` value is serialized with `serializeMarkdown` and then parsed back with `parseMarkdown`
- **THEN** the `notes` value is identical to the original (including newlines)
