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

---

### Requirement: View toggle in top app bar
The top bar SHALL display view-toggle icon buttons (grid and list) to the right of the search input. Clicking a toggle button SHALL switch the active view mode between grid and list. The selected view mode SHALL be persisted in `localStorage` under the key `promptViewMode` and restored on next load. The default mode SHALL be `grid`. Filter buttons ("Tags", "Language", "Favorites") SHALL NOT be rendered in the top bar; they are deferred to a future change.

#### Scenario: View toggle buttons are rendered
- **WHEN** the top bar is rendered
- **THEN** grid-view and list-view toggle buttons are visible; the active mode button appears highlighted

#### Scenario: Clicking grid toggle switches to grid view
- **WHEN** the user clicks the grid-view toggle button
- **THEN** the prompt list switches to grid layout and the grid button appears active

#### Scenario: Clicking list toggle switches to list view
- **WHEN** the user clicks the list-view toggle button
- **THEN** the prompt list switches to list layout and the list button appears active

#### Scenario: View mode persists across reloads
- **WHEN** the user selects list view and then reloads the page
- **THEN** the app opens in list view

#### Scenario: Filter buttons are absent
- **WHEN** the top bar is rendered
- **THEN** no "Tags", "Language", or "Favorites" filter buttons are present

