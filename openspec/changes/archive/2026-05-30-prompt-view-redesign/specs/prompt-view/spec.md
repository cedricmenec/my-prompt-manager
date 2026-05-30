# Prompt View

## Purpose

Defines the full-screen prompt reading and editing experience. Replaces the fixed-width `PromptDetailPanel` side column and the `PromptEditor` modal overlay with a single in-page view that supports two modes: **read** and **edit**.

## ADDED Requirements

### Requirement: PromptView replaces list and occupies full content area
When a prompt is selected, the system SHALL replace the `PromptListView` with `PromptView`, which SHALL occupy the full content area (excluding the sidebar). The `TopAppBar` SHALL be hidden during this state.

#### Scenario: Selecting a prompt shows PromptView full-screen
- **WHEN** the user clicks a prompt card in the list
- **THEN** the list view is replaced by `PromptView` occupying the full content area

#### Scenario: TopAppBar is hidden in PromptView
- **WHEN** `PromptView` is active
- **THEN** the `TopAppBar` is not rendered

---

### Requirement: PromptView read mode displays prompt content
In read mode, `PromptView` SHALL display the prompt fields in order:
1. `title` as an `h1` heading
2. `tags` as badge chips (if any)
3. `description` as a subtitle/lead paragraph (if present)
4. `content` rendered as Markdown inside a terminal/code-block style enclosure
5. `notes` as plain free-text below the content block (if present), in a visually distinct "Notes" section

#### Scenario: Read mode renders all populated fields
- **WHEN** `PromptView` is in read mode for a prompt with title, tags, description, content, and notes
- **THEN** all five sections are visible in the order listed above

#### Scenario: Optional sections are hidden when absent
- **WHEN** the prompt has no `tags`, `description`, or `notes`
- **THEN** those sections are not rendered

#### Scenario: Content is rendered as Markdown inside a code-block enclosure
- **WHEN** the prompt `content` contains Markdown (headers, bold, code blocks)
- **THEN** the rendered HTML appears inside a visually distinct terminal/code-block style container

---

### Requirement: Copy CTA button appears above and below the content block
`PromptView` read mode SHALL render a prominent "Copy" CTA button both immediately above and immediately below the content block. Clicking either SHALL copy the raw `content` (not rendered HTML) to the clipboard and show a brief success toast.

#### Scenario: Copy above block writes content to clipboard
- **WHEN** the user clicks the "Copy" button above the content block
- **THEN** the raw Markdown content is written to the clipboard and a toast confirms success

#### Scenario: Copy below block writes content to clipboard
- **WHEN** the user clicks the "Copy" button below the content block
- **THEN** the raw Markdown content is written to the clipboard and a toast confirms success

---

### Requirement: PromptView action bar
`PromptView` SHALL include a contextual action bar at the top containing:
- `← Back` button — returns to the list view and deselects the prompt
- Favorite toggle button (★) — toggles `isFavorite`
- Edit button (✎) — switches to edit mode
- Overflow menu (`⋯`) containing: Delete (with confirmation)

#### Scenario: Back button returns to list
- **WHEN** the user clicks `← Back`
- **THEN** the prompt is deselected and the list view is restored

#### Scenario: Esc key returns to list
- **WHEN** `PromptView` is active and the user presses `Esc` (and is not in edit mode)
- **THEN** the prompt is deselected and the list view is restored

#### Scenario: Favorite toggle updates isFavorite
- **WHEN** the user clicks the favorite (★) button
- **THEN** `isFavorite` is toggled, persisted, and the button reflects the new state

#### Scenario: Delete in overflow menu requires confirmation
- **WHEN** the user opens the overflow menu and clicks "Delete"
- **THEN** a confirmation modal appears before deletion

#### Scenario: Confirmed delete returns to list
- **WHEN** the user confirms deletion
- **THEN** the prompt is removed, `PromptView` closes, and the list view is shown

---

### Requirement: PromptView edit mode provides an inline form
When the user clicks "Edit", `PromptView` SHALL switch to edit mode in place. Edit mode SHALL render editable fields for all prompt properties using the same field set as the retired `PromptEditor`: `title`, `content`, `description`, `tags`, `notes`, `model`, `temperature`. The action bar SHALL show "Save" and "Cancel" in place of the default actions.

#### Scenario: Edit mode shows all form fields
- **WHEN** the user clicks "Edit"
- **THEN** all seven fields are rendered as interactive inputs pre-filled with current values

#### Scenario: Save persists changes and returns to read mode
- **WHEN** the user submits the edit form with valid data
- **THEN** the prompt is updated in the repository and `PromptView` switches back to read mode showing updated content

#### Scenario: Cancel discards changes and returns to read mode
- **WHEN** the user clicks "Cancel" in edit mode
- **THEN** no changes are persisted and `PromptView` switches back to read mode

#### Scenario: Validation error prevents save
- **WHEN** the user clears the required `title` or `content` field and clicks "Save"
- **THEN** an inline validation error is shown and the form is not submitted

---

### Requirement: Creating a new prompt navigates to PromptView in edit mode
When the user triggers "New Prompt" (from sidebar or top bar), the system SHALL navigate directly to `PromptView` in edit mode with all fields empty, rather than opening a modal.

#### Scenario: New Prompt opens PromptView in edit mode
- **WHEN** the user clicks "New Prompt"
- **THEN** `PromptView` is shown in edit mode with all fields empty

#### Scenario: Cancelling new prompt creation returns to list
- **WHEN** the user clicks "Cancel" on a new (unsaved) prompt
- **THEN** no prompt is created and the list view is restored
