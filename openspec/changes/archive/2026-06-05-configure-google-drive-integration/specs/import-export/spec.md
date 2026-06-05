## ADDED Requirements

### Requirement: Export prompts to configured Google Drive folder
The system SHALL allow the user to export the current prompt library JSON to the configured
visible Google Drive folder when Google Drive is connected and folder access has been configured.
This SHALL preserve the existing local JSON export behavior.

#### Scenario: Drive export succeeds
- **WHEN** the user chooses to export prompts to Google Drive while connected and the configured folder is accessible
- **THEN** the system uploads a valid prompt export JSON file to the configured Drive folder

#### Scenario: Drive export requires connection
- **WHEN** the user chooses to export prompts to Google Drive while disconnected
- **THEN** the system prompts the user to connect Google Drive and does not upload a file

#### Scenario: Local export remains available
- **WHEN** the user chooses the existing local JSON export action
- **THEN** the system downloads the export file locally without requiring Google Drive

---

### Requirement: Import prompts from configured Google Drive folder
The system SHALL allow the user to import a prompt JSON file from the configured visible Google
Drive folder when Google Drive is connected and folder access has been configured. Drive imports
SHALL use the same parse, validation, confirmation, and replacement behavior as local JSON imports.

#### Scenario: Drive import shows confirmation
- **WHEN** the user selects a valid prompt export JSON file from the configured Drive folder
- **THEN** the system parses the file and shows the same replacement confirmation used for local imports

#### Scenario: Drive import with invalid file shows error
- **WHEN** the selected Drive file is malformed or has an unsupported schema version
- **THEN** the system shows an error and does not modify local prompt data

#### Scenario: Drive import preserves local import behavior
- **WHEN** the user chooses the existing local JSON import action
- **THEN** the system continues to support local file selection and validation without requiring Google Drive

---

### Requirement: Export payload excludes sensitive configuration
The system SHALL ensure that local JSON exports, Google Drive exports, and Google Drive snapshots
exclude sensitive configuration. Sensitive configuration includes AI API keys, OAuth access tokens,
OAuth refresh tokens, client secrets, passphrases, and connector secrets.

#### Scenario: Export excludes API keys
- **WHEN** an AI API key exists in the current session or local configuration
- **THEN** exported prompt JSON and Drive snapshot payloads do not include the API key

#### Scenario: Export excludes OAuth tokens
- **WHEN** a Google Drive OAuth token exists in the current browser session
- **THEN** exported prompt JSON and Drive snapshot payloads do not include the token

#### Scenario: Export includes prompt data
- **WHEN** the prompt library contains prompts and local image assets
- **THEN** exported prompt JSON and Drive snapshot payloads include exportable prompt records and valid local image asset payloads

