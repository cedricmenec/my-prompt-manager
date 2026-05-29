## MODIFIED Requirements

### Requirement: Prompt list renders all stored prompts
The system SHALL render prompts in the main content canvas in either grid or list layout depending on the active view mode. In grid mode, the layout SHALL use 1 column on small screens, 2 columns on medium screens, and 3 columns on large screens. In list mode, prompts SHALL be rendered as rows constrained to a maximum width of `48rem` (`max-w-3xl`) and centred horizontally. Both layouts SHALL be sorted by `updatedAt` descending. The displayed set SHALL reflect any active search filter.

#### Scenario: List shows all stored prompts in grid mode
- **WHEN** the app loads in grid mode and prompts exist in the repository
- **THEN** a card is rendered for each stored prompt, showing its title

#### Scenario: List shows all stored prompts in list mode
- **WHEN** the app is in list mode and prompts exist
- **THEN** a row is rendered for each stored prompt, showing its title, and the list is constrained to a maximum width of 48rem and centred

#### Scenario: Empty state is shown when no prompts exist
- **WHEN** the repository is empty
- **THEN** an empty-state message is displayed (e.g., "No prompts yet. Create your first one.")

#### Scenario: Prompts are ordered newest first
- **WHEN** multiple prompts exist with different `updatedAt` timestamps
- **THEN** the most recently updated prompt appears at the top of the list or grid

#### Scenario: Grid is responsive
- **WHEN** the viewport is wide (≥1024px) and grid mode is active
- **THEN** the grid shows 3 columns of cards

#### Scenario: List rows do not stretch beyond max width on wide screens
- **WHEN** the viewport is wider than 48rem and list mode is active
- **THEN** the list container is no wider than 48rem and is centred in the available space
