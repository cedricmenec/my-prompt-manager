## MODIFIED Requirements

### Requirement: Prompt card displays metadata
Each prompt card in the Prompts view SHALL show `title` (bold), `description` (two lines, truncated with ellipsis), and each tag rendered as a `Badge` component. Cards with no description SHALL omit the description row rather than showing a blank line. Prompts with `type === 'image'` SHALL display a small image badge icon (🖼) on the card to signal their type. Cards SHALL NOT display a hero/thumbnail image in the Prompts view, regardless of whether `imageUrl` is set.

#### Scenario: Card with all fields renders completely
- **WHEN** a prompt with title, description, and three tags is rendered
- **THEN** the title, description, and all three tag badges are visible

#### Scenario: Card without description omits description row
- **WHEN** a prompt has no `description` field
- **THEN** the card renders only title and tags with no empty space

#### Scenario: Image-type prompt card shows image badge
- **WHEN** a prompt with `type === 'image'` is rendered in the Prompts view
- **THEN** a small image-type indicator badge is visible on the card

#### Scenario: Image-type prompt card does NOT show a thumbnail
- **WHEN** a prompt with `type === 'image'` and a valid `imageUrl` is rendered in the Prompts view
- **THEN** no hero/thumbnail image is displayed on the card
