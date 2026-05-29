## MODIFIED Requirements

### Requirement: Prompt domain type
The system SHALL define a `Prompt` TypeScript type inferred from a Zod schema as the single source of truth for the prompt data shape. The schema SHALL include the following fields:
- `id`: UUIDv4 string — required, non-empty
- `title`: string — required, non-empty, max 200 characters
- `content`: string — required (the Markdown body, excluding frontmatter)
- `description`: string — optional
- `tags`: array of strings — optional, defaults to `[]`
- `model`: string — optional (AI model hint, e.g. `gpt-4o`)
- `temperature`: number — optional, between 0 and 2 inclusive
- `isFavorite`: boolean — optional, defaults to `false`
- `createdAt`: ISO 8601 date string — required
- `updatedAt`: ISO 8601 date string — required

#### Scenario: Newly created prompt is not a favorite by default
- **WHEN** a prompt is created without specifying `isFavorite`
- **THEN** it has `isFavorite: false`
