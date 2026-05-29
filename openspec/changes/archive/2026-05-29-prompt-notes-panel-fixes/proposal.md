## Why

Three usability improvements have been identified:

1. **Free-text notes on prompts**: The existing `description` (short summary) and `content` (the prompt body) fields do not accommodate informal contextual information — prompt origin, usage tips, history, etc. An unstructured `notes` field fills this gap.

2. **Close button for `PromptDetailPanel`**: Once a prompt is selected, there is no way to dismiss the detail panel without selecting a different prompt or reloading the page. An explicit close button is needed.

3. **List mode display issue**: In "list" view, `PromptRow` items stretch to fill the full viewport width, hurting readability on wide screens. The list should be constrained to a maximum width for a more compact, scannable layout.

## What Changes

- New `notes` field (optional string) added to the Zod `PromptSchema` and `Prompt` type
- Display of `notes` in `PromptDetailPanel` (dedicated section, plain text rendering)
- Editing of `notes` in `PromptEditor` (textarea field)
- `notes` support in the Markdown/frontmatter parser (`markdownParser.ts`)
- Close button (×) added to the `PromptDetailPanel` header, dispatching a `DESELECT` action
- `DESELECT` action added to the `PromptsContext` reducer
- Maximum-width constraint on the list container in `PromptListView` (e.g. `max-w-3xl mx-auto`)

## Capabilities

### New Capabilities
- `prompt-notes`: Free-text notes field on each prompt — editable in the editor, displayed in the detail panel

### Modified Capabilities
- `prompt-model`: Add `notes?: string` field to the Zod schema and TypeScript type
- `prompt-detail-panel`: Notes display section + panel close button
- `prompt-editor`: Notes textarea field
- `prompt-list-view`: Maximum-width constraint in list mode

## Impact

- `src/domain/promptSchema.ts`: add `notes: z.string().optional()`
- `src/domain/markdownParser.ts`: `notes` read/written in YAML frontmatter
- `src/features/prompts/PromptDetailPanel.tsx`: notes section + × button
- `src/features/prompts/PromptEditor.tsx`: notes textarea
- `src/features/prompts/PromptsContext.tsx`: `DESELECT` action in reducer
- `src/features/prompts/PromptListView.tsx`: `max-w-3xl mx-auto` on list container
- `openspec/specs/prompt-model/spec.md`: updated with `notes` field
- `openspec/specs/prompt-detail-panel/spec.md`: updated with close button + notes section
- No new npm dependencies
