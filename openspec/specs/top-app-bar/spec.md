# Top App Bar

## Purpose

Defines the sticky top bar rendered inside the main content area (not spanning the sidebar): search input and filter/view toolbar.
## Requirements
### Requirement: Sticky top app bar with search input
The system SHALL render a sticky top bar inside the main content area (not spanning the sidebar). The top bar SHALL contain a functional search input field with a search icon and placeholder (e.g., "Search prompts..."). Typing in the search input SHALL update the search query in `PromptsContext` in real-time (debounced), filtering the visible prompt list. The top bar SHALL remain visible at the top of the main content area when the user scrolls.

#### Scenario: Top bar is sticky on scroll
- **WHEN** the user scrolls down in the main content area
- **THEN** the top bar remains visible at the top of the main content area

#### Scenario: Search input is rendered and functional
- **WHEN** the top bar is rendered
- **THEN** a search input field is visible with a search icon and placeholder text, and the field is editable (not read-only)

#### Scenario: Typing in the search input filters the prompt list
- **WHEN** the user types a query in the top bar search input
- **THEN** the prompt list updates to show only prompts matching the query

#### Scenario: Clearing the search input shows all prompts
- **WHEN** the user clears the search input
- **THEN** all prompts are displayed again

