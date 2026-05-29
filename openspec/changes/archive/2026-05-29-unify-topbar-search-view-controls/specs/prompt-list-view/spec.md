## MODIFIED Requirements

### Requirement: View-mode toggle switches between grid and list layouts
The view-mode toggle control (grid / list icon buttons) SHALL be rendered in the `TopAppBar`, not in the `PromptListView` toolbar. `PromptListView` SHALL read the active `viewMode` from `PromptsContext` and render accordingly. `PromptListView` SHALL NOT own `viewMode` state, nor render any view-toggle buttons. The selected view mode SHALL continue to be persisted in `localStorage` under `promptViewMode` and restored on load; this persistence is now the responsibility of `PromptsContext` (or `TopAppBar`). The default mode SHALL be `grid`.

#### Scenario: Default mode is grid
- **WHEN** the user opens the app for the first time with no stored preference
- **THEN** the prompts are displayed in grid layout

#### Scenario: Switching to list view via TopAppBar
- **WHEN** the user clicks the list-view toggle button in the top app bar
- **THEN** the prompts are re-rendered as list rows

#### Scenario: View mode persists across reloads
- **WHEN** the user selects list view and then reloads the page
- **THEN** the app opens in list view

#### Scenario: PromptListView does not render a toolbar
- **WHEN** PromptListView is rendered
- **THEN** no search input or view-toggle buttons appear inside the list view component itself
