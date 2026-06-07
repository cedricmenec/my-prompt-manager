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
- `temperature`: number — optional, between 0 and 2 inclusive
- `imageUrl`: string — optional, must be a valid URL if provided
- `imageAssetId`: string — optional, stable ID of an optimized local reference image asset stored in IndexedDB
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

#### Scenario: Prompt with imageAssetId is valid
- **WHEN** a prompt object includes a non-empty `imageAssetId` string
- **THEN** validation succeeds

#### Scenario: Prompt with legacy imageUrl remains valid
- **WHEN** a prompt object includes a valid `imageUrl` and no `imageAssetId`
- **THEN** validation succeeds
- **AND** the prompt remains renderable through the remote URL fallback

#### Scenario: Prompt without any image reference is valid
- **WHEN** an image-type prompt omits both `imageAssetId` and `imageUrl`
- **THEN** validation succeeds
- **AND** image views show their existing placeholder behavior

#### Scenario: Prompt can carry both local asset and imageUrl
- **WHEN** a prompt object includes both `imageAssetId` and a valid `imageUrl`
- **THEN** validation succeeds
- **AND** rendering prefers the local asset over the remote URL

#### Scenario: Prompt model field is stripped from legacy data
- **WHEN** a legacy prompt object includes a `model` field
- **THEN** schema parsing succeeds if all supported fields are valid
- **AND** the parsed `Prompt` result does not include `model`

---

### Requirement: YAML frontmatter serializer
The system SHALL provide a `serializeMarkdown(prompt: Prompt): string` function that:
- Serializes supported frontmatter fields (excluding `content`) to YAML
- Does not serialize legacy or unsupported fields such as `model`
- Wraps frontmatter in `---` delimiters
- Appends the `content` as the Markdown body

#### Scenario: Serialized then parsed prompt roundtrips correctly
- **WHEN** a `Prompt` is serialized with `serializeMarkdown` and the result is parsed with `parseMarkdown`
- **THEN** the parsed output is deeply equal to the original `Prompt`

#### Scenario: Serialized prompt omits model
- **WHEN** a prompt is serialized
- **THEN** the YAML frontmatter does not include a `model` field
