## ADDED Requirements

### Requirement: Component retired
This component SHALL NOT be used. All requirements have been superseded by `prompt-view`. See `prompt-view` spec for the replacement implementation.

#### Scenario: Component is not rendered
- **GIVEN** the application is running
- **THEN** `PromptDetailPanel` SHALL NOT be rendered anywhere in the component tree

## REMOVED Requirements

### Requirement: Detail panel shows selected prompt content
**Reason**: Replaced by `prompt-view` — the full-screen `PromptView` component supersedes the fixed-width side panel entirely.
**Migration**: All display requirements for title, tags, description, content (Markdown), notes, and metadata are now covered by `prompt-view` spec.

### Requirement: Close button dismisses the detail panel
**Reason**: Replaced by `prompt-view` — `PromptView` provides a `← Back` button and `Esc` key shortcut.
**Migration**: See `prompt-view` → "PromptView action bar" requirement.

### Requirement: Notes section in detail panel
**Reason**: Replaced by `prompt-view` — notes are rendered below the content block in `PromptView`.
**Migration**: See `prompt-view` → "PromptView read mode displays prompt content" requirement.

### Requirement: Edit action from detail panel
**Reason**: Replaced by `prompt-view` — edit is a mode toggle within `PromptView`.
**Migration**: See `prompt-view` → "PromptView edit mode provides an inline form" requirement.

### Requirement: Delete action from detail panel
**Reason**: Replaced by `prompt-view` — delete is available via the overflow menu (`⋯`) in the `PromptView` action bar.
**Migration**: See `prompt-view` → "PromptView action bar" requirement.

### Requirement: Copy content to clipboard
**Reason**: Replaced by `prompt-view` — copy is a prominent CTA above and below the content block.
**Migration**: See `prompt-view` → "Copy CTA button appears above and below the content block" requirement.
