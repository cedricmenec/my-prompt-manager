## ADDED Requirements

### Requirement: Prompt editor form fields
The system SHALL provide an editor form (rendered in a modal or a dedicated panel) with the following fields:
- `title`: text input — required
- `content`: multi-line textarea — required; SHALL have a minimum visible height of 8 lines
- `description`: text input — optional
- `tags`: tokenized tag input that accepts comma-separated or Enter-delimited strings, stored as `string[]`
- `model`: text input — optional
- `temperature`: numeric input — optional, accepts values 0–2 with step 0.1

#### Scenario: All fields are rendered in the form
- **WHEN** the editor form is opened (create or edit mode)
- **THEN** all six fields (`title`, `content`, `description`, `tags`, `model`, `temperature`) are visible and interactive

#### Scenario: Tags input accepts comma-separated values
- **WHEN** the user types `react, typescript` and presses Enter or Tab
- **THEN** two tag chips (`react`, `typescript`) are added to the tags field

---

### Requirement: Create mode saves a new prompt
The system SHALL open the editor in create mode when no existing prompt is provided. On form submit, the system SHALL call `promptRepository.create()` and dispatch the new prompt into the `PromptsContext` state.

#### Scenario: Valid form submission creates a prompt
- **WHEN** the user fills in at least `title` and `content` and clicks "Save"
- **THEN** a new prompt is persisted in IndexedDB and appears in the prompt list

#### Scenario: Submitting with empty title shows a validation error
- **WHEN** the user leaves `title` blank and clicks "Save"
- **THEN** the form shows an inline validation error on the title field and does NOT submit

#### Scenario: Submitting with empty content shows a validation error
- **WHEN** the user leaves `content` blank and clicks "Save"
- **THEN** the form shows an inline validation error on the content field and does NOT submit

---

### Requirement: Edit mode updates an existing prompt
The system SHALL open the editor pre-filled with an existing prompt's data when provided a prompt id. On submit, the system SHALL call `promptRepository.update()` and refresh the prompt in context state.

#### Scenario: Edited prompt is updated in the list
- **WHEN** the user changes the title in edit mode and saves
- **THEN** the list card and detail panel reflect the new title immediately

#### Scenario: Cancelling edit mode discards changes
- **WHEN** the user clicks "Cancel" or closes the editor without saving
- **THEN** the original prompt data is unchanged in the repository and UI

---

### Requirement: Editor form cancel/close
The system SHALL provide a "Cancel" button and a close affordance (e.g., ×). Activating either SHALL dismiss the form without persisting any changes.

#### Scenario: Cancel button closes the form
- **WHEN** the user clicks "Cancel"
- **THEN** the editor form is dismissed and the user is returned to their previous view
