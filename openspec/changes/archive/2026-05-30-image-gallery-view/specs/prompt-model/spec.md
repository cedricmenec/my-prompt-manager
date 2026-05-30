## MODIFIED Requirements

### Requirement: Prompt domain type
The system SHALL define a `Prompt` TypeScript type inferred from a Zod schema as the single source of truth for the prompt data shape. The schema SHALL include the following fields:
- `id`: UUIDv4 string — required, non-empty
- `title`: string — required, non-empty, max 200 characters
- `content`: string — required (the Markdown body, excluding frontmatter)
- `description`: string — optional
- `tags`: array of strings — optional, defaults to `[]`
- `isFavorite`: boolean — optional, defaults to `false`
- `type`: `'text' | 'image'` — optional, defaults to `'text'`
- `notes`: string — optional (free-text author notes; not part of the prompt body)
- `model`: string — optional (AI model hint, e.g. `gpt-4o`)
- `temperature`: number — optional, between 0 and 2 inclusive
- `imageUrl`: string — optional, must be a valid URL if provided
- `createdAt`: ISO 8601 date string — required
- `updatedAt`: ISO 8601 date string — required

#### Scenario: Valid prompt passes schema validation
- **WHEN** a plain object with all required fields and valid values is parsed with the Zod schema
- **THEN** `schema.parse()` returns a typed `Prompt` object with no errors

#### Scenario: Missing required field fails validation
- **WHEN** an object missing `title` is parsed with the Zod schema
- **THEN** `schema.safeParse()` returns `success: false` with a ZodError identifying the `title` field

#### Scenario: Invalid temperature value fails validation
- **WHEN** an object with `temperature: 3` is parsed
- **THEN** `schema.safeParse()` returns `success: false` with a ZodError on `temperature`

#### Scenario: Newly created prompt is not a favorite by default
- **WHEN** a prompt is created without specifying `isFavorite`
- **THEN** it has `isFavorite: false`

#### Scenario: Prompt without notes field is valid
- **WHEN** a prompt object without a `notes` field is parsed
- **THEN** `schema.parse()` succeeds and `notes` is `undefined` on the result

#### Scenario: Prompt without type field defaults to text
- **WHEN** a prompt object without a `type` field is parsed
- **THEN** `schema.parse()` succeeds and `type` is `'text'` on the result

#### Scenario: Invalid type value fails validation
- **WHEN** an object with `type: 'video'` is parsed
- **THEN** `schema.safeParse()` returns `success: false` with a ZodError on `type`
