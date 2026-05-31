## MODIFIED Requirements

### Requirement: Sticky top app bar with search input — mode-aware appearance
The system SHALL render a sticky contextual top bar inside the main content area (not spanning the sidebar). In **Prompts mode** (`appView === 'prompts'`), the top bar SHALL render with the existing full-width search input style (solid background, standard border). In **Gallery mode** (`appView === 'gallery'`), the top bar SHALL render with a **discrete style**: transparent or lightly tinted background, attenuated border, and a slightly smaller/muted search input. The search input SHALL remain functional in both modes. Typing SHALL update `searchQuery` in `PromptsContext` (debounced).

#### Scenario: Top bar renders with full style in Prompts mode
- **WHEN** `appView` is `'prompts'` and no prompt is selected
- **THEN** the top bar renders with solid background and a standard full-width search input

#### Scenario: Top bar renders with discrete style in Gallery mode
- **WHEN** `appView` is `'gallery'`
- **THEN** the top bar renders with a transparent or lightly tinted background and an attenuated border on the search input

#### Scenario: Search input remains functional in Gallery mode
- **WHEN** `appView` is `'gallery'` and the user types in the search input
- **THEN** the gallery filters to show only image-type prompts matching the query

#### Scenario: Clearing the search input shows all prompts or images
- **WHEN** the user clears the search input in either mode
- **THEN** all prompts (or all images in gallery mode) matching the active filter are displayed

## MODIFIED Requirements

### Requirement: View toggle in top app bar — hidden in Gallery mode
The top bar SHALL display the grid/list view-toggle buttons **only when `appView === 'prompts'`**. In Gallery mode, the view toggle SHALL NOT be rendered. The selected view mode (`grid` / `list`) SHALL continue to be persisted in `localStorage` under `promptViewMode` and restored on next load. The default mode remains `grid`.

#### Scenario: View toggle is visible in Prompts mode
- **WHEN** `appView` is `'prompts'` and the top bar is rendered
- **THEN** the grid-view and list-view toggle buttons are visible and functional

#### Scenario: View toggle is hidden in Gallery mode
- **WHEN** `appView` is `'gallery'`
- **THEN** no grid or list toggle buttons are rendered in the top bar

#### Scenario: Clicking grid toggle switches to grid view in Prompts mode
- **WHEN** `appView` is `'prompts'` and the user clicks the grid-view toggle button
- **THEN** the prompt list switches to grid layout and the grid button appears active

#### Scenario: Clicking list toggle switches to list view in Prompts mode
- **WHEN** `appView` is `'prompts'` and the user clicks the list-view toggle button
- **THEN** the prompt list switches to list layout and the list button appears active

#### Scenario: View mode persists across reloads
- **WHEN** the user selects list view and then reloads the page
- **THEN** the app opens in list view (in Prompts mode)
