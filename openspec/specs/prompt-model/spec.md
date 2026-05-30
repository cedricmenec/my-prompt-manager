# Prompt Model

## Purpose

Defines the `Prompt` domain type, its Zod validation schema, and the Markdown/frontmatter parser and serializer that act as the canonical data interchange format.

## Requirements

### Requirement: Prompt domain type
The system SHALL define a `Prompt` TypeScript type inferred from a Zod schema as the single source of truth for the prompt data shape. The schema SHALL include the following fields:
- `id`: UUIDv4 string — required, non-empty
- `title`: string — required, non-empty, max 200 characters
- `content`: string — required (the Markdown body, excluding frontmatter)
- `description`: string — optional
- `tags`: array of strings — optional, defaults to `[]`
- `isFavorite`: boolean — optional, defaults to `false`
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

---

### Requirement: YAML frontmatter parser
The system SHALL provide a `parseMarkdown(raw: string)` function in `src/domain/markdownParser.ts` that:
- Splits a raw Markdown string on `---` delimiters to extract YAML frontmatter and body
- Parses the frontmatter with `js-yaml`
- Validates the merged frontmatter+body object with the `PromptSchema`
- Returns `{ data: Prompt, error: null }` on success or `{ data: null, error: ZodError | YAMLError }` on failure

#### Scenario: Valid Markdown file with frontmatter is parsed
- **WHEN** `parseMarkdown` receives a string with valid `---` frontmatter and a Markdown body
- **THEN** it returns a `Prompt` object with `content` equal to the body text (trimmed)

#### Scenario: Markdown without frontmatter returns an error
- **WHEN** `parseMarkdown` receives a plain string with no `---` delimiters
- **THEN** it returns `{ data: null, error: ... }` with a descriptive message

#### Scenario: Frontmatter with unknown extra fields is accepted
- **WHEN** the frontmatter contains fields not in the schema (e.g., `custom_field: foo`)
- **THEN** the parser still succeeds, silently ignoring unknown fields (Zod `strip` mode)

---

### Requirement: YAML frontmatter serializer
The system SHALL provide a `serializeMarkdown(prompt: Prompt): string` function that:
- Serializes all frontmatter fields (excluding `content`) to YAML
- Wraps them in `---` delimiters
- Appends the `content` as the Markdown body

#### Scenario: Serialized then parsed prompt roundtrips correctly
- **WHEN** a `Prompt` is serialized with `serializeMarkdown` and the result is parsed with `parseMarkdown`
- **THEN** the parsed output is deeply equal to the original `Prompt`
