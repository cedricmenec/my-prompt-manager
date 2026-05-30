# Delta Spec: Prompt Model (imageUrl)

## Requirements

### Requirement: Optional imageUrl field
The `Prompt` schema SHALL include an optional `imageUrl` field.

- `imageUrl`: string — optional, must be a valid URL if provided.

#### Scenario: Prompt with imageUrl is valid
- **WHEN** a prompt object includes a valid `imageUrl` string
- **THEN** validation succeeds.

#### Scenario: Prompt without imageUrl is valid
- **WHEN** a prompt object omits `imageUrl`
- **THEN** validation succeeds and the field is `undefined`.
