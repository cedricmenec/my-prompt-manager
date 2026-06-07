## MODIFIED Requirements

### Requirement: Model search and selection
The system SHALL show a searchable model list for the selected provider and SHALL allow selecting multiple models as enabled models. The system SHALL provide a toggle to filter the displayed list to show only enabled models. The toggle SHALL be cumulative with the text search filter. The toggle SHALL be ephemeral (not persisted across sessions).

#### Scenario: User searches models
- **WHEN** the user types in the model search field
- **THEN** the displayed model list is filtered by model name

#### Scenario: User selects multiple models
- **WHEN** the user selects more than one model from the model list
- **THEN** the system persists each selected model as enabled for use elsewhere in the app

#### Scenario: User deselects a model
- **WHEN** the user deselects an enabled model
- **THEN** the model is no longer included in the enabled model set

#### Scenario: Cost column is reserved
- **WHEN** the model list is displayed
- **THEN** the table includes columns for model name, origin provider, and future token cost information

#### Scenario: User toggles enabled-only filter on
- **WHEN** the user checks the "Only enabled" toggle
- **THEN** the model table displays only models whose checkbox is checked (enabled)

#### Scenario: User toggles enabled-only filter off
- **WHEN** the user unchecks the "Only enabled" toggle
- **THEN** the model table displays all models again (subject to text search if active)

#### Scenario: Enabled-only filter combines with text search
- **WHEN** the "Only enabled" toggle is on AND the user types in the search field
- **THEN** the model table displays only enabled models whose name matches the search query

#### Scenario: Enabled-only toggle is ephemeral
- **WHEN** the settings panel is closed and reopened
- **THEN** the "Only enabled" toggle resets to unchecked (all models shown)
