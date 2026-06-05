## ADDED Requirements

### Requirement: Visible Drive snapshot payload
The system SHALL create Google Drive snapshots as visible files in the configured user-created
Drive folder. Snapshot payloads SHALL include prompt data, local prompt image assets needed by
those prompts, schema metadata, app metadata, and explicitly non-sensitive settings only.
Snapshot payloads SHALL NOT include AI API keys, OAuth access tokens, OAuth refresh tokens,
client secrets, passphrases, or connector secrets.

#### Scenario: Snapshot includes prompt data
- **WHEN** a snapshot is created from a library with prompts and local image assets
- **THEN** the snapshot file contains prompt records, export metadata, and exportable image asset payloads

#### Scenario: Snapshot excludes sensitive data
- **WHEN** a snapshot is created while API keys or OAuth tokens exist in the current session
- **THEN** the snapshot file does not contain those keys or tokens

---

### Requirement: Snapshot after manual export
The system SHALL create a visible Drive snapshot after a successful manual export to Google Drive
when Google Drive snapshots are enabled and the configured folder is accessible.

#### Scenario: Export creates snapshot
- **WHEN** the user exports prompts to the configured Google Drive folder
- **THEN** the system creates or schedules a snapshot reflecting the exported state

#### Scenario: Export without Drive connection does not create Drive snapshot
- **WHEN** the user performs a local-only export while Google Drive is disconnected
- **THEN** the system does not attempt to create a Drive snapshot

---

### Requirement: Snapshot before destructive data operations
The system SHALL create a visible Drive snapshot before import or restore operations that may
replace or materially change local prompt data, when Google Drive snapshots are enabled and the
configured folder is accessible.

#### Scenario: Import creates pre-import snapshot
- **WHEN** the user confirms an import that will replace local prompt data
- **THEN** the system creates a pre-import snapshot before modifying the local database

#### Scenario: Restore creates pre-restore snapshot
- **WHEN** the user confirms restoring from a snapshot
- **THEN** the system creates a pre-restore snapshot before modifying the local database

#### Scenario: Pre-operation snapshot fails
- **WHEN** a required pre-import or pre-restore snapshot fails
- **THEN** the system warns the user and requires explicit confirmation before continuing without that snapshot

---

### Requirement: Automatic snapshot interval
The system SHALL support automatic visible Drive snapshots at a configurable interval. The default
interval SHALL be 15 minutes. Automatic snapshots SHALL run only when exportable data has changed
since the last successful snapshot.

#### Scenario: Default snapshot interval
- **WHEN** Google Drive snapshots are enabled and no custom interval is configured
- **THEN** the automatic snapshot interval is 15 minutes

#### Scenario: Changed data triggers eligible snapshot
- **WHEN** exportable prompt data or exportable non-sensitive settings changed since the last snapshot and the interval elapses
- **THEN** the system creates an automatic Drive snapshot

#### Scenario: Unchanged data does not create snapshot
- **WHEN** no exportable data changed since the last successful snapshot
- **THEN** the system skips the automatic snapshot for that interval

---

### Requirement: Snapshot restoration
The system SHALL support restoring local prompt data from a visible Drive snapshot after explicit
user confirmation. Restore SHALL reuse the existing import validation behavior for prompt records
and local image assets.

#### Scenario: User restores from valid snapshot
- **WHEN** the user selects a valid Drive snapshot and confirms restoration
- **THEN** the system validates the snapshot and replaces local prompt data with the valid snapshot contents

#### Scenario: User cancels snapshot restore
- **WHEN** the user opens a snapshot restore confirmation and cancels it
- **THEN** no local prompt data is modified

#### Scenario: Invalid snapshot cannot be restored
- **WHEN** the selected Drive snapshot has an invalid format or unsupported schema version
- **THEN** the system shows an error and does not modify local prompt data

