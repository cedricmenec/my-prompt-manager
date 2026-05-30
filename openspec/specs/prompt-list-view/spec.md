# Prompt List View

## Purpose

Defines the main dashboard grid of prompt cards: rendering, sorting, selection, and empty state.
## Requirements
### Requirement: Prompt list renders all stored prompts
The system SHALL render prompts in the main content canvas in either grid or list layout depending on the active view mode. In grid mode, the layout SHALL use 1 column on small screens, 2 columns on medium screens, and 3 columns on large screens. In list mode, prompts SHALL be rendered as rows constrained to a maximum width of `48rem` (`max-w-3xl`) and centred horizontally. Both layouts SHALL be sorted by `updatedAt` descending. The displayed set SHALL reflect any active search filter.

#### Scenario: List shows all stored prompts in grid mode
- **WHEN** the app loads in grid mode and prompts exist in the repository
- **THEN** a card is rendered for each stored prompt, showing its title

#### Scenario: List shows all stored prompts in list mode
- **WHEN** the app is in list mode and prompts exist
- **THEN** a row is rendered for each stored prompt, showing its title

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

---

### Requirement: Prompt card displays metadata
Each prompt card SHALL show `title` (bold), `description` (two lines, truncated with ellipsis), and each tag rendered as a `Badge` component. Cards with no description SHALL omit the description row rather than showing a blank line. Prompts with `type === 'image'` SHALL display a small image badge icon (🖼) on the card to signal their type. Cards SHALL NOT display a hero/thumbnail image in the Prompts view, regardless of whether `imageUrl` is set.

#### Scenario: Card with all fields renders completely
- **WHEN** a prompt with title, description, and three tags is rendered
- **THEN** the title, description, and all three tag badges are visible

#### Scenario: Card without description omits description row
- **WHEN** a prompt has no `description` field
- **THEN** the card renders only title and tags with no empty space

#### Scenario: Image-type prompt card shows image badge
- **WHEN** a prompt with `type === 'image'` is rendered in the Prompts view
- **THEN** a small image-type indicator badge is visible on the card

#### Scenario: Image-type prompt card does NOT show a thumbnail
- **WHEN** a prompt with `type === 'image'` and a valid `imageUrl` is rendered in the Prompts view
- **THEN** no hero/thumbnail image is displayed on the card

---

### Requirement: Selecting a prompt opens the detail panel
The system SHALL track a `selectedPromptId` in the `PromptsContext`. Clicking a prompt card SHALL set that id as selected. The selected card SHALL receive a visual selection indicator (highlighted border or background).

#### Scenario: Clicking a card selects it
- **WHEN** the user clicks a prompt card
- **THEN** the card becomes visually selected and the detail panel opens showing that prompt

#### Scenario: Only one card can be selected at a time
- **WHEN** the user clicks a second card after one is already selected
- **THEN** the first card is deselected and the second becomes selected

---

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

### Requirement: List view renders prompts as compact rows
In list view, the system SHALL render each prompt as a horizontal row showing: `title` (bold, single line), `description` (single line, truncated with ellipsis), and `tags` as badge chips. Rows SHALL be sorted by `updatedAt` descending, consistent with grid view. Clicking a row SHALL select it and open the detail panel, same as clicking a card in grid view.

#### Scenario: List view shows title, description, and tags per row
- **WHEN** list view is active and prompts exist
- **THEN** each prompt is rendered as a row with its title, truncated description, and tag badges visible

#### Scenario: Clicking a row selects the prompt
- **WHEN** the user clicks a row in list view
- **THEN** the prompt becomes selected and the detail panel opens

#### Scenario: Rows are sorted newest first
- **WHEN** multiple prompts exist with different `updatedAt` timestamps in list view
- **THEN** the most recently updated prompt appears at the top of the list

