# Prompt Editor

## Purpose

Defines the create/edit form for prompts, covering all fields, validation, save and cancel behaviour, and how state is persisted to the repository.
## Requirements
### Requirement: Component retired
This component SHALL NOT be used. All requirements have been superseded by `prompt-view`. See `prompt-view` spec for the replacement implementation.

#### Scenario: Component is not rendered
- **GIVEN** the application is running
- **THEN** `PromptEditor` SHALL NOT be rendered anywhere in the component tree

