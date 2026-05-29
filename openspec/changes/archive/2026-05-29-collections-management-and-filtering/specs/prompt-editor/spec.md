## MODIFIED Requirements

### Requirement: Tag management in editor
The `PromptEditor` SHALL allow users to add and remove tags for a prompt.

#### Scenario: Adding a tag
- **WHEN** the user types a new tag and presses Enter in the tags field
- **THEN** the tag is added to the prompt's tags array and displayed in the editor UI

#### Scenario: Removing a tag
- **WHEN** the user clicks the remove icon on a tag badge in the editor
- **THEN** the tag is removed from the prompt's tags array
