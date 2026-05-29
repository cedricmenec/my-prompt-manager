## MODIFIED Requirements

### Requirement: Search combined with active filter
The system SHALL ensure that search queries are applied *after* the active category filter (All, Favorites, Uncollected, or Collection).

#### Scenario: Searching within a collection
- **WHEN** the "Work" collection is active
- **AND** the user searches for "Email"
- **THEN** only prompts in the "Work" collection that match "Email" are shown
