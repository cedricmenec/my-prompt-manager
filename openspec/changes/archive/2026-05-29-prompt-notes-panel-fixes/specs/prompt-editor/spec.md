## ADDED Requirements

### Requirement: Notes field in prompt editor
The editor form SHALL include a `notes` textarea field (optional). The field SHALL be pre-filled when editing an existing prompt that has notes. On save, the value SHALL be included in the create/update payload (omitted when empty).

#### Scenario: Notes textarea is visible in the editor
- **WHEN** the prompt editor is opened in create or edit mode
- **THEN** a "Notes" textarea field is visible below the other optional fields

#### Scenario: Notes are pre-filled in edit mode
- **WHEN** the editor is opened for an existing prompt with a non-empty `notes` value
- **THEN** the notes textarea is pre-filled with the existing notes text

#### Scenario: Empty notes field is not persisted
- **WHEN** the user submits the form with the notes textarea left empty
- **THEN** the saved prompt has `notes` as `undefined` (not an empty string)

## MODIFIED Requirements

### Requirement: Prompt editor form fields
The system SHALL provide an editor form (rendered in a modal or a dedicated panel) with the following fields:
- `title`: text input — required
- `content`: multi-line textarea — required; SHALL have a minimum visible height of 8 lines
- `description`: text input — optional
- `tags`: tokenized tag input that accepts comma-separated or Enter-delimited strings, stored as `string[]`
- `notes`: multi-line textarea — optional (free-text author notes)
- `model`: text input — optional
- `temperature`: numeric input — optional, accepts values 0–2 with step 0.1

#### Scenario: All fields are rendered in the form
- **WHEN** the editor form is opened (create or edit mode)
- **THEN** all seven fields (`title`, `content`, `description`, `tags`, `notes`, `model`, `temperature`) are visible and interactive

#### Scenario: Tags input accepts comma-separated values
- **WHEN** the user types `react, typescript` and presses Enter or Tab
- **THEN** two tag chips (`react`, `typescript`) are added to the tags field

#### Scenario: Removing a tag
- **WHEN** the user clicks the remove icon on a tag badge in the editor
- **THEN** the tag is removed from the prompt's tags array
