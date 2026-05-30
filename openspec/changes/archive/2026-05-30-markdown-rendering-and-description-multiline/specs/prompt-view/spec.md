## MODIFIED Requirements

### Requirement: PromptView read mode displays prompt content
In read mode, `PromptView` SHALL display the prompt fields in order:
1. `title` as an `h1` heading
2. `tags` as badge chips (if any)
3. `description` rendered as Markdown in an inline prose style (if present) — italic/muted tone, no enclosure border
4. `content` rendered as Markdown via `react-markdown` + `remark-gfm` inside a visually distinct enclosure (border, contrasting background)
5. `notes` rendered as Markdown via `react-markdown` + `remark-gfm` in a visually distinct "Notes" aside card (if present)

#### Scenario: Read mode renders all populated fields
- **WHEN** `PromptView` is in read mode for a prompt with title, tags, description, content, and notes
- **THEN** all five sections are visible in the order listed above

#### Scenario: Optional sections are hidden when absent
- **WHEN** the prompt has no `tags`, `description`, or `notes`
- **THEN** those sections are not rendered

#### Scenario: Content is rendered as full Markdown inside a code-block enclosure
- **WHEN** the prompt `content` contains Markdown (headers, bold, lists, code blocks, blockquotes)
- **THEN** all constructs are fully rendered inside a visually distinct container with border and contrasting background

#### Scenario: Description renders Markdown inline
- **WHEN** the prompt `description` contains Markdown (bold, italic, inline code)
- **THEN** it is rendered as formatted prose in a muted/italic inline style — no enclosure border

#### Scenario: Notes renders Markdown in aside card
- **WHEN** the prompt `notes` contains Markdown (lists, paragraphs)
- **THEN** it is rendered as formatted prose inside the "Notes" aside card with secondary visual weight

---

## MODIFIED Requirements

### Requirement: PromptView edit mode provides an inline form
When the user clicks "Edit", `PromptView` SHALL switch to edit mode in place. Edit mode SHALL render editable fields for all prompt properties: `title`, `content`, `description`, `tags`, `notes`, `model`, `temperature`. The `description` field SHALL be a multiline `<textarea>` (minimum 3 visible rows). The action bar SHALL show "Save" and "Cancel" in place of the default actions.

#### Scenario: Edit mode shows all form fields
- **WHEN** the user clicks "Edit"
- **THEN** all seven fields are rendered as interactive inputs pre-filled with current values, with `description` rendered as a multiline textarea

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
