# Prompt Detail Panel

## Purpose

Defines the read-only side panel that displays full prompt content when a prompt is selected, along with edit, delete, and copy actions.
## Requirements
### Requirement: Component retired
This component SHALL NOT be used. All requirements have been superseded by `prompt-view`. See `prompt-view` spec for the replacement implementation.

#### Scenario: Component is not rendered
- **GIVEN** the application is running
- **THEN** `PromptDetailPanel` SHALL NOT be rendered anywhere in the component tree

