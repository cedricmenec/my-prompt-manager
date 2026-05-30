# Delta Spec: Prompt Card Visuals

## Requirements

### Requirement: Hero image display
In Grid View, if a prompt has an `imageUrl`, the `PromptCard` SHALL display it as a "hero" element.

- **Placement**: Top of the card, spanning full width.
- **Sizing**: `object-fit: cover`, variable height with a maximum limit (e.g. 256px).
- **Behavior**: Clicking the image selects the prompt.

### Requirement: Fallback state
If the `imageUrl` provided fails to load (e.g., 404, invalid URL, network error), the card SHALL display a discrete placeholder.

- **Appearance**: Brand color background (`--color-primary-bg`).
- **Layout**: Maintains the space or collapses to a minimal state (to be refined during implementation).
