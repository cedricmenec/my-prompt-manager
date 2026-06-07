## ADDED Requirements

### Requirement: AI Features settings category
The Settings panel SHALL include an `AI Features` category in the settings sidebar. Selecting it SHALL show app-level AI feature configuration, starting with the `Prompt input assistant` feature.

#### Scenario: AI Features category is visible
- **WHEN** the user opens the Settings panel
- **THEN** the settings sidebar includes an `AI Features` category

#### Scenario: User switches to AI Features
- **WHEN** the user selects `AI Features` from the settings sidebar
- **THEN** the right content area shows AI feature configuration
- **AND** existing `Legacy` and `API & Models` settings remain accessible from the sidebar

---

### Requirement: Stable Settings dialog frame
The Settings panel SHALL render in a fixed responsive position and height, independent of the active settings category and model list loading state. Scrolling SHALL be constrained to the internal settings content region rather than resizing the outer dialog.

#### Scenario: Switching categories does not resize the dialog
- **WHEN** the Settings panel is open and the user switches between settings categories
- **THEN** the outer dialog remains in the same position and keeps the same height

#### Scenario: Loading model data does not resize the dialog
- **WHEN** model catalog data loads or the model list content changes inside Settings
- **THEN** the outer dialog remains in the same position and keeps the same height
- **AND** overflow content scrolls inside the settings content region

#### Scenario: Dialog remains usable on small viewports
- **WHEN** the viewport height is smaller than the preferred dialog height
- **THEN** the dialog fits within the viewport with internal scrolling and remains closable
