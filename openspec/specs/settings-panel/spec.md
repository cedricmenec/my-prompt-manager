# Settings Panel

## Purpose

Provides a modal Settings panel accessible from the sidebar, exposing data management actions (import/export) and placeholder sections for future features.

## Requirements

### Requirement: Settings panel modal
The system SHALL provide a `SettingsPanel` React component that:
- Renders as a modal overlay (fixed, full-screen backdrop)
- Contains a "Data" section with an "Export JSON" button and an "Import JSON" button
- Contains placeholder sections for future features: "Sync", "API Keys", "Auto-backup" (visually present but non-interactive, labelled "coming soon")
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
