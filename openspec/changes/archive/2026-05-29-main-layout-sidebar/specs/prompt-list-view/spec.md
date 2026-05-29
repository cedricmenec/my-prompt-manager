## MODIFIED Requirements

### Requirement: Prompt list renders all stored prompts
The system SHALL render a responsive grid of prompt cards in the main content canvas. Each card SHALL display: the prompt `title`, `description` (truncated to two lines if present), and `tags` as badge chips. The grid SHALL be sorted by `updatedAt` descending (most recently modified first). The grid SHALL use 1 column on small screens, 2 columns on medium screens, and 3 columns on large screens.

#### Scenario: List shows all stored prompts
- **WHEN** the app loads and prompts exist in the repository
- **THEN** a card is rendered for each stored prompt, showing its title

#### Scenario: Empty state is shown when no prompts exist
- **WHEN** the repository is empty
- **THEN** an empty-state message is displayed (e.g., "No prompts yet. Create your first one.")

#### Scenario: Prompts are ordered newest first
- **WHEN** multiple prompts exist with different `updatedAt` timestamps
- **THEN** the most recently updated prompt appears at the top of the grid

#### Scenario: Grid is responsive
- **WHEN** the viewport is wide (≥1024px)
- **THEN** the grid shows 3 columns of cards

---

## REMOVED Requirements

### Requirement: Create new prompt button
**Reason**: The "New Prompt" button has moved to the sidebar CTA (`SidebarNav`). `PromptListView` no longer owns this entry point.
**Migration**: The "New Prompt" action is now triggered from `SidebarNav`'s CTA button, which dispatches `OPEN_CREATE` via `PromptsContext`.
