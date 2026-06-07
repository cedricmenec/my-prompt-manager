## ADDED Requirements

### Requirement: PromptView edit mode provides AI field generation controls
PromptView edit mode SHALL render small, icon-style magic-wand generation controls next to the `Title` and `Description` field labels. Each control SHALL generate only its associated field from the current prompt `content` value and update the edit form without saving the prompt automatically.

#### Scenario: Title magic-wand button generates title
- **WHEN** the user clicks the magic-wand control next to `Title`
- **THEN** the system generates a title from the current prompt content
- **AND** updates the title input with the generated value
- **AND** does not persist the prompt until the user clicks `Save`

#### Scenario: Description magic-wand button generates description
- **WHEN** the user clicks the magic-wand control next to `Description`
- **THEN** the system generates a description from the current prompt content
- **AND** updates the description textarea with the generated value
- **AND** does not persist the prompt until the user clicks `Save`

#### Scenario: Generation button shows progress
- **WHEN** field generation is in progress
- **THEN** the corresponding magic-wand control is disabled or shows a loading state
- **AND** repeated clicks do not start duplicate provider calls for the same field

#### Scenario: Generation failure preserves current edit values
- **WHEN** field generation fails
- **THEN** the current edit form values remain unchanged
- **AND** the system shows an actionable error message

## MODIFIED Requirements

### Requirement: PromptView edit mode provides an inline form
When the user clicks "Edit", `PromptView` SHALL switch to edit mode in place. Edit mode SHALL render editable fields for all prompt properties: `title`, `content`, `description`, `tags`, `notes`, `temperature`, `imageUrl`, and local image attachment state for image prompts. The `description` field SHALL be a multiline `<textarea>` (minimum 3 visible rows). The `imageUrl` field SHALL be a text input for the reference image URL. For image prompts, edit mode SHALL provide controls to attach, replace, and remove a local reference image asset through file picker upload, drag-and-drop upload, and public URL import-to-local. The action bar SHALL show "Save" and "Cancel" in place of the default actions.

#### Scenario: Edit mode shows all form fields
- **WHEN** the user clicks "Edit"
- **THEN** all seven prompt data fields are rendered as interactive inputs pre-filled with current values, with `description` rendered as a multiline textarea and `imageUrl` as a text input
- **AND** no prompt-level `model` input is rendered

#### Scenario: Edit mode shows local image attachment controls
- **WHEN** the user edits an image prompt
- **THEN** controls are available to upload/drop an image file and attach it as a local asset

#### Scenario: Removing local image preserves optional imageUrl
- **WHEN** the user removes the local image asset from a prompt that also has `imageUrl`
- **THEN** `imageAssetId` is cleared
- **AND** `imageUrl` remains unchanged unless the user explicitly edits it

#### Scenario: Description textarea accepts multiline input
- **WHEN** the user types a multi-paragraph description in the description textarea
- **THEN** the text wraps across multiple lines and is persisted as-is

#### Scenario: Save persists changes and returns to read mode
- **WHEN** the user submits the edit form with valid data
- **THEN** the prompt is updated in the repository and `PromptView` switches back to read mode showing updated content

#### Scenario: Cancel discards changes and returns to read mode
- **WHEN** the user clicks "Cancel" in edit mode
- **THEN** no changes are persisted and `PromptView` switches back to read mode

#### Scenario: Validation error prevents save
- **WHEN** the user clears the required `title` or `content` field and clicks "Save"
- **THEN** an inline validation error is shown and the form is not submitted
