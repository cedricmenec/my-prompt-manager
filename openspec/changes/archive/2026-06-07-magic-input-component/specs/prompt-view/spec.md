## MODIFIED Requirements

### Requirement: PromptView edit mode provides AI field generation controls
PromptView edit mode SHALL use the reusable `MagicInput` component for the `Title` and `Description` fields. The `Title` field SHALL use `MagicInput` with `variant="single"`. The `Description` field SHALL use `MagicInput` with `variant="multi"`. Each `MagicInput` SHALL trigger generation of only its associated field from the current prompt `content` value and update the edit form without saving the prompt automatically.

#### Scenario: Title MagicInput generates title
- **WHEN** the user clicks the magic-wand icon in the Title `MagicInput`
- **THEN** the system generates a title from the current prompt content
- **AND** updates the title input with the generated value
- **AND** does not persist the prompt until the user clicks `Save`

#### Scenario: Description MagicInput generates description
- **WHEN** the user clicks the magic-wand icon in the Description `MagicInput`
- **THEN** the system generates a description from the current prompt content
- **AND** updates the description textarea with the generated value
- **AND** does not persist the prompt until the user clicks `Save`

#### Scenario: MagicInput shows pulsing animation during generation
- **WHEN** field generation is in progress for a given field
- **THEN** the corresponding `MagicInput` icon pulses with a subtle color shift animation
- **AND** the icon is disabled to prevent duplicate generation requests

#### Scenario: Generation failure preserves current edit values
- **WHEN** field generation fails
- **THEN** the current edit form values remain unchanged
- **AND** the system shows an actionable error message
