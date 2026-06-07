## ADDED Requirements

### Requirement: Settings sidebar navigation
The Settings panel SHALL provide a two-column modal layout with a left sidebar for settings categories and a right content area for the active category.

#### Scenario: Settings opens with navigable categories
- **WHEN** the user opens the Settings panel
- **THEN** the panel shows a left sidebar with `Legacy` and `API & Models` categories
- **AND** the panel shows the active category content on the right

#### Scenario: User switches categories
- **WHEN** the user selects a settings category from the sidebar
- **THEN** the right content area updates to show that category

---

### Requirement: Legacy settings view
The Settings panel SHALL preserve the current settings controls under a `Legacy` category until they are restructured in a later change.

#### Scenario: Legacy view contains existing settings
- **WHEN** the user selects the `Legacy` settings category
- **THEN** the existing data import/export, Google Drive, Drive import/export, and Drive snapshot controls remain available

#### Scenario: Existing close behavior remains available
- **WHEN** the Settings panel is open
- **THEN** the user can still close it with Escape, the backdrop, or the close button

---

### Requirement: API and Models settings view
The Settings panel SHALL expose an `API & Models` category that hosts AI provider configuration and model selection.

#### Scenario: User opens API and Models
- **WHEN** the user selects `API & Models` from the Settings sidebar
- **THEN** the main content area shows the provider selector, API key entry area, and model selection area
