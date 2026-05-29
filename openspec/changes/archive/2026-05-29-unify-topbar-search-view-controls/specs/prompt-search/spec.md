## MODIFIED Requirements

### Requirement: Search bar filters the prompt list in real-time
The system SHALL render the search input in the `TopAppBar` (not inline above or inside `PromptListView`). As the user types, the displayed prompt list SHALL update immediately to show only prompts whose `title` or `description` matches the query using fuzzy (approximate) matching. When the query is empty, all prompts SHALL be shown. The search query SHALL be managed through `PromptsContext` (`searchQuery` / `setSearchQuery`) so that `TopAppBar` and `PromptListView` share the same state without prop-drilling.

#### Scenario: Typing a query filters the list
- **WHEN** the user types "tempate" in the top bar search input
- **THEN** prompts whose title or description contains "template" (or a close match) are shown, and others are hidden

#### Scenario: Exact match is always included
- **WHEN** the user types a word that exactly matches a prompt's title
- **THEN** that prompt is always included in the results

#### Scenario: Empty query shows all prompts
- **WHEN** the search input is cleared
- **THEN** all prompts are displayed, as if no filter is applied

#### Scenario: No results shows empty search state
- **WHEN** the user types a query that matches no prompts
- **THEN** an empty-state message is shown indicating no results were found for that query (distinct from the "no prompts yet" empty state)
