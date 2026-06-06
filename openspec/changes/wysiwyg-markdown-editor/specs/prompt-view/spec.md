# prompt-view Specification (Delta — Modified by wysiwyg-markdown-editor)

## Purpose

This delta describes the changes to `prompt-view` introduced by the `wysiwyg-markdown-editor` change. Only the modified requirement is listed here. All other requirements from the base `prompt-view` spec remain unchanged.

## Requirements

### Requirement: PromptView edit mode uses WYSIWYG Markdown editor for content
The `content` field in edit mode SHALL be rendered using the `MarkdownEditor` component instead of a plain `<textarea>`. The `MarkdownEditor` SHALL default to WYSIWYG mode. All other edit mode fields, validation, save, and cancel behavior remain unchanged.

#### Scenario: Edit mode shows WYSIWYG editor for content
- **WHEN** the user clicks "Edit" on a prompt
- **THEN** the content field renders as a WYSIWYG Markdown editor with visual formatting

#### Scenario: Content edits are saved as Markdown
- **WHEN** the user edits the content in WYSIWYG mode and clicks "Save"
- **THEN** the prompt content is saved as a Markdown string in the repository
- **AND** the saved content renders identically in read mode (ReactMarkdown)

#### Scenario: Toggling source mode does not affect save behavior
- **WHEN** the user switches to source mode, edits the raw Markdown, and clicks "Save"
- **THEN** the prompt content is saved as the edited Markdown string

#### Scenario: Creating a new prompt uses WYSIWYG editor
- **WHEN** the user clicks "New Prompt"
- **THEN** the content field renders as a WYSIWYG Markdown editor

#### Scenario: Validation error on empty content
- **WHEN** the user clears the content and clicks "Save"
- **THEN** an inline validation error is shown and the form is not submitted
