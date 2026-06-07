## ADDED Requirements

### Requirement: User-facing interface text is English
The system SHALL render user-facing application interface text in English, including navigation labels, form labels, buttons, tooltips, empty states, validation errors, modal text, status messages, and toast notifications.

#### Scenario: Application chrome uses English labels
- **WHEN** the application shell, sidebar, top bar, settings panel, prompt list, prompt detail, prompt editor, and gallery views are rendered
- **THEN** built-in interface labels and messages are displayed in English

#### Scenario: User-authored content is not translated
- **WHEN** a saved prompt contains non-English title, description, content, tags, or notes
- **THEN** the system displays the saved user-authored content unchanged

#### Scenario: Existing non-English labels are normalized
- **WHEN** the implementation touches a view with existing non-English interface labels
- **THEN** those labels are replaced with English text as part of this change
