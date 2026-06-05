## MODIFIED Requirements

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

## ADDED Requirements

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

