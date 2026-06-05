## ADDED Requirements

### Requirement: User-owned Google OAuth configuration
The system SHALL allow the user to configure Google Drive with their own Google OAuth Client ID.
The system SHALL treat the Client ID as non-sensitive configuration and SHALL NOT request, accept,
store, or document the use of a Google OAuth client secret.

#### Scenario: User saves a Google OAuth Client ID
- **WHEN** the user enters a valid-looking Google OAuth Client ID in Google Drive settings
- **THEN** the system stores the Client ID as non-sensitive local configuration

#### Scenario: Client secret is not configurable
- **WHEN** the user opens Google Drive settings
- **THEN** no field for a Google OAuth client secret is displayed

#### Scenario: Missing Client ID prevents connection
- **WHEN** the user attempts to connect Google Drive without a configured Client ID
- **THEN** the system shows an actionable error and does not start OAuth

---

### Requirement: Visible Drive folder configuration
The system SHALL allow the user to configure a visible Google Drive folder that the user created
outside the app. The system SHALL accept a Google Drive folder URL or folder ID and normalize it
to a stored folder ID.

#### Scenario: User saves a folder URL
- **WHEN** the user enters a Google Drive folder URL
- **THEN** the system extracts and stores the folder ID as non-sensitive local configuration

#### Scenario: User saves a folder ID
- **WHEN** the user enters a Google Drive folder ID
- **THEN** the system stores that folder ID as non-sensitive local configuration

#### Scenario: Invalid folder input is rejected
- **WHEN** the user enters text that cannot be interpreted as a Google Drive folder URL or ID
- **THEN** the system shows an actionable validation error and does not save the folder setting

---

### Requirement: Session-only Google Drive connection
The system SHALL connect to Google Drive using browser-compatible Google OAuth for a public
client. Access tokens SHALL be held only for the current browser session and SHALL be cleared on
disconnect. The system SHALL NOT persist OAuth access tokens, refresh tokens, or connector secrets
in exported data or unencrypted local storage.

#### Scenario: User connects Google Drive
- **WHEN** the user clicks "Connect" with a configured Client ID
- **THEN** the system starts Google OAuth and updates the Drive status when an access token is available

#### Scenario: User disconnects Google Drive
- **WHEN** the user clicks "Disconnect"
- **THEN** the system clears the current Google Drive access token and shows the integration as disconnected

#### Scenario: Token expires
- **WHEN** a Google Drive request fails because authorization expired
- **THEN** the system shows that reconnection is required and does not modify local prompt data

---

### Requirement: Google Drive folder access test
The system SHALL provide a way to test access to the configured visible Google Drive folder before
running import, export, or snapshot operations.

#### Scenario: Folder test succeeds
- **WHEN** the user tests a configured folder while connected to Google Drive
- **THEN** the system verifies folder access and shows a successful status

#### Scenario: Folder test fails because of permissions
- **WHEN** the configured folder is not accessible to the connected Google account
- **THEN** the system shows an actionable error explaining that the folder or permissions must be checked

#### Scenario: Folder test requires connection
- **WHEN** the user tests the configured folder while disconnected
- **THEN** the system prompts the user to connect Google Drive first

---

### Requirement: Google Drive integration status
The system SHALL expose Google Drive status states covering at least: not configured, configured,
connected, disconnected, expired, and error.

#### Scenario: Initial state has no configuration
- **WHEN** no Google Drive Client ID or folder is configured
- **THEN** the system shows Google Drive as not configured

#### Scenario: Configuration exists but no session is connected
- **WHEN** a Client ID and folder are configured but no access token is available
- **THEN** the system shows Google Drive as configured but disconnected

#### Scenario: Drive operation fails
- **WHEN** a Google Drive operation fails because of network, authorization, or folder access issues
- **THEN** the system records an error status with user-facing recovery guidance

---

### Requirement: Google Drive user documentation
The system SHALL provide clear user-facing documentation for Google Drive configuration. The
documentation SHALL explain Google Cloud OAuth setup, authorized origins/redirect expectations,
Drive folder creation, required scopes, session-only reconnection behavior, and which data is and
is not exported.

#### Scenario: User reads Drive setup documentation
- **WHEN** the user opens the project documentation
- **THEN** the documentation explains how to create the required Google OAuth Client ID and Drive folder

#### Scenario: User reads data boundary documentation
- **WHEN** the user reviews the Drive feature documentation
- **THEN** the documentation states that API keys, OAuth tokens, client secrets, passphrases, and connector secrets are not exported or snapshotted

