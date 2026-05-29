# Prompt Detail Panel

## Purpose

Defines the read-only side panel that displays full prompt content when a prompt is selected, along with edit, delete, and copy actions.

## Requirements

### Requirement: Detail panel shows selected prompt content
The system SHALL render a side panel (sliding in from the right or occupying the right column) when a prompt is selected. The panel SHALL display:
- `title` as a heading
- `tags` as badge chips
- `description` (if present) as a subtitle
- `content` rendered as Markdown (using a lightweight renderer — raw HTML is acceptable in MVP)
- `model` and `temperature` as metadata rows if present
- `createdAt` and `updatedAt` formatted as human-readable dates

#### Scenario: Panel opens with selected prompt data
- **WHEN** the user selects a prompt from the list
- **THEN** the detail panel becomes visible and shows the correct title and content

#### Scenario: Panel shows Markdown rendered as HTML
- **WHEN** the prompt `content` contains Markdown (headers, bold, code blocks)
- **THEN** the panel renders formatted HTML, not raw Markdown syntax

#### Scenario: Panel is hidden when no prompt is selected
- **WHEN** no prompt is selected (initial state or after deselect)
- **THEN** the detail panel is not visible (hidden or unmounted)

---

### Requirement: Edit action from detail panel
The detail panel SHALL include an "Edit" button. Clicking it SHALL open the prompt editor pre-filled with the selected prompt's current values.

#### Scenario: Edit button opens pre-filled editor
- **WHEN** the user clicks "Edit" in the detail panel
- **THEN** the prompt editor opens in edit mode with all fields pre-filled with the current prompt data

---

### Requirement: Delete action from detail panel
The detail panel SHALL include a "Delete" button. Clicking it SHALL open a confirmation modal before performing the deletion. On confirmation, the prompt SHALL be removed from the repository and the detail panel SHALL close.

#### Scenario: Delete requires confirmation
- **WHEN** the user clicks "Delete" in the detail panel
- **THEN** a confirmation modal appears asking the user to confirm

#### Scenario: Confirmed delete removes the prompt
- **WHEN** the user confirms the delete action
- **THEN** the prompt is removed from the list, the detail panel closes, and no prompt is selected

#### Scenario: Cancelled delete leaves prompt unchanged
- **WHEN** the user dismisses the confirmation modal without confirming
- **THEN** the prompt remains in the list and the detail panel stays open

---

### Requirement: Copy content to clipboard
The detail panel SHALL include a "Copy" button that copies the prompt `content` (raw Markdown, not rendered HTML) to the system clipboard.

#### Scenario: Copy button writes content to clipboard
- **WHEN** the user clicks the "Copy" button
- **THEN** the raw Markdown content is written to the clipboard and a brief success toast is shown
