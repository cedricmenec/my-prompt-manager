## ADDED Requirements

### Requirement: Sticky top app bar with search input
The system SHALL render a sticky top bar inside the main content area (not spanning the sidebar). The top bar SHALL contain a search input field with a placeholder (e.g., "Search prompts..."). The top bar SHALL remain at the top of the main content area when the user scrolls the prompt grid.

#### Scenario: Top bar is sticky on scroll
- **WHEN** the user scrolls down in the main content area
- **THEN** the top bar remains visible at the top of the main content area

#### Scenario: Search input is rendered
- **WHEN** the top bar is rendered
- **THEN** a search input field is visible with a search icon and placeholder text

---

### Requirement: Filter toolbar in top app bar
The top bar SHALL display a filter toolbar with three filter buttons: "Tags", "Language", and "Favorites". It SHALL also show view toggle buttons for list view and grid view. These controls SHALL be rendered and visually correct. Functional filtering and view switching are deferred to a future change.

#### Scenario: Filter buttons are rendered
- **WHEN** the top bar is rendered
- **THEN** "Tags", "Language", and "Favorites" filter buttons are visible

#### Scenario: View toggle buttons are rendered
- **WHEN** the top bar is rendered
- **THEN** list-view and grid-view toggle buttons are visible, with one appearing active
