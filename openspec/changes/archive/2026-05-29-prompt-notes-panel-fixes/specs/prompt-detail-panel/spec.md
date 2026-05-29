## ADDED Requirements

### Requirement: Close button dismisses the detail panel
The detail panel header SHALL include a close button (×). Clicking it SHALL deselect the current prompt and hide the panel.

#### Scenario: Close button hides the panel
- **WHEN** a prompt is selected and the detail panel is visible
- **AND** the user clicks the close (×) button in the panel header
- **THEN** no prompt is selected and the detail panel is no longer visible

### Requirement: Notes section in detail panel
When the selected prompt has a non-empty `notes` field, the detail panel SHALL display it in a dedicated "Notes" section below the prompt content. The notes SHALL be rendered as plain text (no Markdown processing). The section SHALL be hidden when `notes` is absent or empty.

#### Scenario: Notes section is shown when notes exist
- **WHEN** the selected prompt has a non-empty `notes` value
- **THEN** a "Notes" section is visible in the detail panel containing the notes text

#### Scenario: Notes section is hidden when notes are absent
- **WHEN** the selected prompt has no `notes` field or an empty string
- **THEN** no "Notes" section is rendered in the detail panel

## MODIFIED Requirements

### Requirement: Detail panel shows selected prompt content
The system SHALL render a side panel (sliding in from the right or occupying the right column) when a prompt is selected. The panel SHALL display:
- `title` as a heading
- `tags` as badge chips
- `description` (if present) as a subtitle
- `content` rendered as Markdown (using a lightweight renderer — raw HTML is acceptable in MVP)
- `notes` (if present) as plain text in a dedicated "Notes" section
- `model` and `temperature` as metadata rows if present
- `createdAt` and `updatedAt` formatted as human-readable dates

#### Scenario: Panel opens with selected prompt data
- **WHEN** the user selects a prompt from the list
- **THEN** the detail panel becomes visible and shows the correct title and content

#### Scenario: Panel shows Markdown rendered as HTML
- **WHEN** the prompt `content` contains Markdown (headers, bold, code blocks)
- **THEN** the panel renders formatted HTML, not raw Markdown syntax

#### Scenario: Panel is hidden when no prompt is selected
- **WHEN** no prompt is selected (initial state or after close/deselect)
- **THEN** the detail panel is not visible (hidden or unmounted)
