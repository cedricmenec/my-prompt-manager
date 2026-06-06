# markdown-editor Specification (Delta)

## Purpose

A reusable WYSIWYG Markdown editing component that wraps Tiptap/ProseMirror and exposes a simple controlled `value`/`onChange` interface. The component is used wherever Markdown content needs to be edited with visual formatting feedback.

## Requirements

### Requirement: Component renders a WYSIWYG Markdown editor
The `MarkdownEditor` component SHALL render a Tiptap/ProseMirror editor that displays Markdown content with inline visual formatting (bold, italic, headings, lists, code blocks, blockquotes, horizontal rules, tables).

#### Scenario: Rendering formatted Markdown content
- **GIVEN** the `value` prop contains `# Title\n\nSome **bold** text`
- **WHEN** the component renders in default (WYSIWYG) mode
- **THEN** the editor displays "Title" as a heading and "bold" in bold weight

#### Scenario: Empty content shows placeholder
- **GIVEN** the `value` prop is an empty string
- **WHEN** the component renders
- **THEN** the placeholder text is visible inside the editor area

---

### Requirement: Component provides a controlled value/onChange interface
The `MarkdownEditor` component SHALL accept `value: string` (Markdown) and `onChange: (value: string) => void` props. The component SHALL be fully controlled — the parent owns the Markdown string.

#### Scenario: Typing in WYSIWYG mode updates parent state
- **GIVEN** the user types text in WYSIWYG mode
- **WHEN** the editor content changes
- **THEN** `onChange` is called with the serialized Markdown string

#### Scenario: Typing in source mode updates parent state
- **GIVEN** the user types text in source mode (textarea)
- **WHEN** the textarea value changes
- **THEN** `onChange` is called with the raw textarea value

---

### Requirement: Source mode toggle button
The component SHALL render a toggle button (labeled `[MD]`) in the top-right corner of the editor area. Clicking the toggle switches between WYSIWYG mode and raw Markdown source mode.

#### Scenario: Toggle from WYSIWYG to source
- **GIVEN** the editor is in WYSIWYG mode
- **WHEN** the user clicks the `[MD]` toggle button
- **THEN** the editor switches to a plain textarea displaying the raw Markdown string
- **AND** no data transformation occurs — the Markdown string is the same

#### Scenario: Toggle from source to WYSIWYG
- **GIVEN** the editor is in source mode
- **WHEN** the user clicks the `[MD]` toggle button
- **THEN** the editor switches back to WYSIWYG mode
- **AND** the Markdown string is re-parsed into the visual editor

#### Scenario: Toggle preserves unsaved edits
- **GIVEN** the user has made edits in source mode
- **WHEN** the user toggles back to WYSIWYG mode
- **THEN** the edited Markdown is re-parsed and displayed correctly

---

### Requirement: Clipboard paste renders Markdown in WYSIWYG mode
When the user pastes text into the WYSIWYG editor, the pasted content SHALL be parsed as Markdown and rendered with visual formatting.

#### Scenario: Pasting Markdown-formatted text
- **GIVEN** the clipboard contains `**bold** and *italic*`
- **WHEN** the user pastes into WYSIWYG mode
- **THEN** the editor displays "bold" in bold weight and "italic" in italic style

#### Scenario: Pasting a Markdown list
- **GIVEN** the clipboard contains `- item 1\n- item 2\n- item 3`
- **WHEN** the user pastes into WYSIWYG mode
- **THEN** the editor displays a bullet list with three items

#### Scenario: Pasting raw text without Markdown syntax
- **GIVEN** the clipboard contains `plain text with no formatting`
- **WHEN** the user pastes into WYSIWYG mode
- **THEN** the text is inserted as a plain paragraph

---

### Requirement: Clipboard copy yields Markdown
When the user copies content from the WYSIWYG editor, the clipboard SHALL contain the Markdown representation of the selected content.

#### Scenario: Copying formatted text
- **GIVEN** the editor contains **bold** text
- **WHEN** the user selects the text and copies
- **THEN** the clipboard contains `**bold**`

---

### Requirement: Source mode is a plain textarea
In source mode, the component SHALL render a standard `<textarea>` with monospace font displaying the raw Markdown string. The textarea SHALL be editable.

#### Scenario: Editing Markdown directly
- **GIVEN** the editor is in source mode
- **WHEN** the user types Markdown syntax into the textarea
- **THEN** the textarea value updates in real time
- **AND** `onChange` is called with the updated Markdown string

#### Scenario: Pasting in source mode
- **GIVEN** the editor is in source mode
- **WHEN** the user pastes content into the textarea
- **THEN** the pasted text is inserted as raw text (no Markdown parsing)

---

### Requirement: Error state styling
The component SHALL accept an `error?: boolean` prop. When `true`, the editor border SHALL use an error color.

#### Scenario: Error state applied
- **GIVEN** the `error` prop is `true`
- **WHEN** the component renders
- **THEN** the editor border uses the error color from the theme

---

### Requirement: Minimum height from rows prop
The component SHALL accept a `rows?: number` prop that sets the minimum visible height of the editor, matching textarea convention. Default SHALL be 8 rows.

#### Scenario: Custom height
- **GIVEN** the `rows` prop is set to `12`
- **WHEN** the component renders
- **THEN** the editor area has a minimum height equivalent to 12 text rows
