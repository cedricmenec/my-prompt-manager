## ADDED Requirements

### Requirement: Component retired
This component SHALL NOT be used. All requirements have been superseded by `prompt-view`. See `prompt-view` spec for the replacement implementation.

#### Scenario: Component is not rendered
- **GIVEN** the application is running
- **THEN** `PromptEditor` SHALL NOT be rendered anywhere in the component tree

## REMOVED Requirements

### Requirement: Prompt editor form fields
**Reason**: Replaced by `prompt-view` — the edit mode of `PromptView` provides the same field set inline, without a modal overlay.
**Migration**: See `prompt-view` → "PromptView edit mode provides an inline form" requirement.

### Requirement: Create mode saves a new prompt
**Reason**: Replaced by `prompt-view` — creating a new prompt navigates to `PromptView` in edit mode with empty fields.
**Migration**: See `prompt-view` → "Creating a new prompt navigates to PromptView in edit mode" requirement.

### Requirement: Edit mode updates an existing prompt
**Reason**: Replaced by `prompt-view` — editing toggles the existing `PromptView` into edit mode in place.
**Migration**: See `prompt-view` → "PromptView edit mode provides an inline form" requirement.

### Requirement: Notes field in prompt editor
**Reason**: Replaced by `prompt-view` — the `notes` field is included in `PromptView` edit mode.
**Migration**: See `prompt-view` → "PromptView edit mode provides an inline form" requirement.

### Requirement: Editor form cancel/close
**Reason**: Replaced by `prompt-view` — Cancel and Save actions are provided in the `PromptView` edit mode action bar.
**Migration**: See `prompt-view` → "PromptView edit mode provides an inline form" requirement.
