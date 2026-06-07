# Settings Panel

## Purpose

Provides a modal Settings panel accessible from the sidebar, exposing data management actions (import/export) and placeholder sections for future features.

## Requirements

### Requirement: Settings panel modal
The system SHALL provide a `SettingsPanel` React component that:
- Renders as a modal overlay (fixed, full-screen backdrop)
- Contains a "Data" section with an "Export JSON" button and an "Import JSON" button
- Contains an active "Google Drive" or "Sync" section for Google Drive integration configuration, connection status, connect/disconnect actions, folder configuration, and folder access testing
- Contains placeholder sections for future features that are not implemented by this change, including "API Keys" and any unsupported auto-backup or encrypted-vault features, visually present but non-interactive and labelled "coming soon" when shown
- Closes when the user presses Escape or clicks the backdrop

#### Scenario: Settings panel opens from sidebar
- **WHEN** the user clicks the ⚙ Settings button in the sidebar footer
- **THEN** the settings modal becomes visible

#### Scenario: Settings panel closes on backdrop click
- **WHEN** the settings modal is open and the user clicks the backdrop
- **THEN** the modal closes

#### Scenario: Settings panel closes on Escape key
- **WHEN** the settings modal is open and the user presses Escape
- **THEN** the modal closes

#### Scenario: Google Drive settings are visible
- **WHEN** the settings modal is open
- **THEN** the user can see Google Drive configuration fields and connection controls

---

### Requirement: Export JSON action in Settings panel
The system SHALL trigger an immediate JSON file download when the user clicks "Export JSON" in the Settings panel.

#### Scenario: Export downloads the library
- **WHEN** the user clicks "Export JSON" in the Settings panel
- **THEN** a `byo-prompts-YYYY-MM-DD.json` file is downloaded containing all current prompts

#### Scenario: Export with empty library still downloads
- **WHEN** the user clicks "Export JSON" and the library is empty
- **THEN** a JSON file is downloaded with `promptCount: 0`

---

### Requirement: Import JSON action in Settings panel
The system SHALL handle the full import flow when the user clicks "Import JSON" in the Settings panel:
1. A hidden `<input type="file" accept=".json">` is triggered programmatically
2. After the user selects a file, `parseImportFile` is called
3. If parsing fails with `ImportFormatError`, an error toast is shown and the flow stops
4. If parsing succeeds, a confirmation modal is shown stating the number of current prompts that will be replaced and the number of valid prompts to import; if any errors exist, they are listed
5. On confirmation: `promptRepository.deleteAll()` is called, then `promptRepository.bulkImport(valid)`, then the prompts state is reloaded
6. A success toast confirms how many prompts were imported and how many were skipped

#### Scenario: Import valid file triggers confirmation modal
- **WHEN** the user selects a valid JSON file
- **THEN** a confirmation modal shows the count of current prompts to replace and the count of valid prompts to import

#### Scenario: Import with invalid prompts shows skip count in modal
- **WHEN** the user selects a JSON file with 10 prompts of which 2 are invalid
- **THEN** the confirmation modal mentions that 2 prompts will be skipped

#### Scenario: Import confirmed replaces all prompts
- **WHEN** the user confirms the import
- **THEN** the previous prompts are deleted, the valid imported prompts are stored, and the list view refreshes

#### Scenario: Import cancelled leaves data unchanged
- **WHEN** the user dismisses the confirmation modal
- **THEN** no data is modified

#### Scenario: Import with malformed JSON shows error toast
- **WHEN** the user selects a file that is not valid JSON or has an unknown schema version
- **THEN** an error toast is shown and no data is modified

---

### Requirement: Settings button in sidebar footer
The system SHALL render a ⚙ Settings button in the footer of `SidebarNav` that opens the `SettingsPanel` modal.

#### Scenario: Settings button is always visible in sidebar
- **WHEN** the application is loaded
- **THEN** a Settings button is visible at the bottom of the sidebar

---

### Requirement: Google Drive settings controls
The Settings panel SHALL provide controls for entering a Google OAuth Client ID, entering a Google
Drive folder URL or ID, saving non-sensitive Drive configuration, connecting Google Drive,
disconnecting Google Drive, and testing configured folder access.

#### Scenario: User configures Drive settings
- **WHEN** the user enters a Google OAuth Client ID and Drive folder URL or ID and saves the settings
- **THEN** the Settings panel persists the non-sensitive configuration and updates the Google Drive status

#### Scenario: User connects from Settings
- **WHEN** the user clicks "Connect" from the Google Drive settings section
- **THEN** the system starts the Google Drive connection flow

#### Scenario: User disconnects from Settings
- **WHEN** the user clicks "Disconnect" from the Google Drive settings section
- **THEN** the system clears the current Google Drive session and updates the displayed status

---

### Requirement: Google Drive snapshot settings
The Settings panel SHALL provide controls for enabling or disabling visible Drive snapshots and
configuring the automatic snapshot interval in minutes. The default interval SHALL be 15 minutes.

#### Scenario: User enables snapshots
- **WHEN** the user enables Google Drive snapshots without entering a custom interval
- **THEN** the Settings panel uses a 15 minute automatic snapshot interval

#### Scenario: User changes snapshot interval
- **WHEN** the user enters a valid interval in minutes
- **THEN** the Settings panel persists the interval as non-sensitive configuration

#### Scenario: Invalid snapshot interval is rejected
- **WHEN** the user enters an invalid automatic snapshot interval
- **THEN** the Settings panel shows a validation error and does not save the invalid value

---

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
