## ADDED Requirements

### Requirement: Prompt list renders all stored prompts
The system SHALL render a scrollable list of prompt cards on the main dashboard. Each card SHALL display: the prompt `title`, `description` (truncated to one line if present), and `tags` as badge chips. The list SHALL be sorted by `updatedAt` descending (most recently modified first).

#### Scenario: List shows all stored prompts
- **WHEN** the app loads and prompts exist in the repository
- **THEN** a card is rendered for each stored prompt, showing its title

#### Scenario: Empty state is shown when no prompts exist
- **WHEN** the repository is empty
- **THEN** an empty-state message is displayed (e.g., "No prompts yet. Create your first one.")

#### Scenario: Prompts are ordered newest first
- **WHEN** multiple prompts exist with different `updatedAt` timestamps
- **THEN** the most recently updated prompt appears at the top of the list

---

### Requirement: Prompt card displays metadata
Each prompt card SHALL show `title` (bold), `description` (one line, truncated with ellipsis), and each tag rendered as a `Badge` component. Cards with no description SHALL omit the description row rather than showing a blank line.

#### Scenario: Card with all fields renders completely
- **WHEN** a prompt with title, description, and three tags is rendered
- **THEN** the title, description, and all three tag badges are visible

#### Scenario: Card without description omits description row
- **WHEN** a prompt has no `description` field
- **THEN** the card renders only title and tags with no empty space

---

### Requirement: Selecting a prompt opens the detail panel
The system SHALL track a `selectedPromptId` in the `PromptsContext`. Clicking a prompt card SHALL set that id as selected. The selected card SHALL receive a visual selection indicator (highlighted border or background).

#### Scenario: Clicking a card selects it
- **WHEN** the user clicks a prompt card
- **THEN** the card becomes visually selected and the detail panel opens showing that prompt

#### Scenario: Only one card can be selected at a time
- **WHEN** the user clicks a second card after one is already selected
- **THEN** the first card is deselected and the second becomes selected

---

### Requirement: Create new prompt button
The system SHALL display a prominent "New Prompt" button (or FAB) above or alongside the list. Clicking it SHALL open the prompt editor form in create mode with all fields empty.

#### Scenario: New Prompt button opens empty editor
- **WHEN** the user clicks the "New Prompt" button
- **THEN** the prompt editor form opens with blank fields and no pre-filled content
