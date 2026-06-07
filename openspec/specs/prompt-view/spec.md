# prompt-view Specification

## Purpose
TBD - created by archiving change prompt-view-redesign. Update Purpose after archive.
## Requirements
### Requirement: PromptView replaces list and occupies full content area
When a prompt is selected, the system SHALL replace the `PromptListView` with `PromptView`, which SHALL occupy the full content area (excluding the sidebar). The `TopAppBar` SHALL be hidden during this state.

#### Scenario: Selecting a prompt shows PromptView full-screen
- **WHEN** the user clicks a prompt card in the list
- **THEN** the list view is replaced by `PromptView` occupying the full content area

#### Scenario: TopAppBar is hidden in PromptView
- **WHEN** `PromptView` is active
- **THEN** the `TopAppBar` is not rendered

---

### Requirement: PromptView read mode displays prompt content
In read mode, `PromptView` SHALL display the prompt fields in order:
1. `title` as an `h1` heading
2. `tags` as badge chips (if any)
3. `description` as a subtitle/lead paragraph (if present)
4. For prompts with `type === 'image'` and a resolvable local `imageAssetId` or valid `imageUrl`: the image rendered full-width at its natural aspect ratio (`w-full h-auto`), inside a rounded container, above the Copy CTA, preferring the local asset over the remote URL
5. `content` rendered as Markdown inside a terminal/code-block style enclosure
6. `notes` as plain free-text below the content block (if present), in a visually distinct "Notes" section

#### Scenario: Read mode renders all populated fields
- **WHEN** `PromptView` is in read mode for a prompt with title, tags, description, content, and notes
- **THEN** all five sections are visible in the order listed above

#### Scenario: Optional sections are hidden when absent
- **WHEN** the prompt has no `tags`, `description`, or `notes`
- **THEN** those sections are not rendered

#### Scenario: Content is rendered as Markdown inside a code-block enclosure
- **WHEN** the prompt `content` contains Markdown (headers, bold, code blocks)
- **THEN** the rendered HTML appears inside a visually distinct terminal/code-block style container

#### Scenario: Image preview is shown for image-type prompt with imageUrl
- **WHEN** `PromptView` is in read mode for a prompt with `type === 'image'` and a valid `imageUrl`
- **THEN** the image is rendered full-width at its natural aspect ratio above the Copy CTA

#### Scenario: Local asset preview is shown before imageUrl
- **WHEN** `PromptView` is in read mode for an image prompt with both `imageAssetId` and `imageUrl`
- **THEN** the image preview renders the local asset
- **AND** does not load the remote `imageUrl`

#### Scenario: Missing local asset falls back to imageUrl
- **WHEN** `PromptView` is in read mode for an image prompt whose `imageAssetId` cannot be resolved and whose `imageUrl` is valid
- **THEN** the image preview renders the remote URL fallback

#### Scenario: Image preview is hidden for text-type prompt
- **WHEN** `PromptView` is in read mode for a prompt with `type === 'text'`
- **THEN** no image preview section is rendered, even if `imageUrl` is set

#### Scenario: Image preview is hidden when no image reference is available
- **WHEN** `PromptView` is in read mode for a prompt with `type === 'image'` but no local asset or `imageUrl`
- **THEN** no image preview section is rendered

---

### Requirement: Copy CTA button appears above and below the content block
`PromptView` read mode SHALL render a prominent "Copy" CTA button both immediately above and immediately below the content block. Clicking either SHALL copy the raw `content` (not rendered HTML) to the clipboard and show a brief success toast.

#### Scenario: Copy above block writes content to clipboard
- **WHEN** the user clicks the "Copy" button above the content block
- **THEN** the raw Markdown content is written to the clipboard and a toast confirms success

#### Scenario: Copy below block writes content to clipboard
- **WHEN** the user clicks the "Copy" button below the content block
- **THEN** the raw Markdown content is written to the clipboard and a toast confirms success

---

### Requirement: PromptView action bar
`PromptView` SHALL include a contextual action bar at the top containing:
- `← Back` button — returns to the list view and deselects the prompt
- Favorite toggle button (★) — toggles `isFavorite`
- Edit button (✎) — switches to edit mode
- Overflow menu (`⋯`) containing: Delete (with confirmation)

#### Scenario: Back button returns to list
- **WHEN** the user clicks `← Back`
- **THEN** the prompt is deselected and the list view is restored

#### Scenario: Esc key returns to list
- **WHEN** `PromptView` is active and the user presses `Esc` (and is not in edit mode)
- **THEN** the prompt is deselected and the list view is restored

#### Scenario: Favorite toggle updates isFavorite
- **WHEN** the user clicks the favorite (★) button
- **THEN** `isFavorite` is toggled, persisted, and the button reflects the new state

#### Scenario: Delete in overflow menu requires confirmation
- **WHEN** the user opens the overflow menu and clicks "Delete"
- **THEN** a confirmation modal appears before deletion

#### Scenario: Confirmed delete returns to list
- **WHEN** the user confirms deletion
- **THEN** the prompt is removed, `PromptView` closes, and the list view is shown

---

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

---

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

---

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

### Requirement: Creating a new prompt navigates to PromptView in edit mode
When the user triggers "New Prompt" (from sidebar or top bar), the system SHALL navigate directly to `PromptView` in edit mode with all fields empty, rather than opening a modal.

#### Scenario: New Prompt opens PromptView in edit mode
- **WHEN** the user clicks "New Prompt"
- **THEN** `PromptView` is shown in edit mode with all fields empty

#### Scenario: Cancelling new prompt creation returns to list
- **WHEN** the user clicks "Cancel" on a new (unsaved) prompt
- **THEN** no prompt is created and the list view is restored
