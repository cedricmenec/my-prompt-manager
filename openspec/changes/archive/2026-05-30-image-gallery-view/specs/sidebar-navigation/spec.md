## MODIFIED Requirements

### Requirement: Sidebar primary navigation links
The sidebar SHALL display four primary navigation links: "All Prompts", "Favorites", "Uncollected", and "Gallery". Each link SHALL show an icon and a label. The active link SHALL receive a distinct visual active state (highlighted background or accent colour). "Uncollected" SHALL show a count badge of prompts that have no tags. "Gallery" SHALL switch the `appView` in `PromptsContext` to `'gallery'`, while the other three links SHALL switch `appView` to `'prompts'` and update `activeFilter` accordingly. The "Gallery" link SHALL be visually separated from the filter links (e.g., by a divider or placement above the Collections section).

#### Scenario: Navigation links are rendered
- **WHEN** the sidebar is rendered
- **THEN** "All Prompts", "Favorites", "Uncollected", and "Gallery" links are visible with icons

#### Scenario: Uncollected badge shows tag-less prompt count
- **WHEN** three prompts have no tags
- **THEN** the "Uncollected" link shows a badge with the value "3"

#### Scenario: Active link is visually distinct
- **WHEN** a navigation link is the current active view
- **THEN** it renders with a highlighted background or accent colour different from inactive links

#### Scenario: Clicking "Favorites" filters the list and switches to Prompts view
- **WHEN** the user clicks "Favorites"
- **THEN** `appView` is set to `'prompts'` and the prompt list shows only prompts where `isFavorite` is `true`

#### Scenario: Clicking "Uncollected" filters the list and switches to Prompts view
- **WHEN** the user clicks "Uncollected"
- **THEN** `appView` is set to `'prompts'` and the prompt list shows only prompts with no tags

#### Scenario: Clicking "Gallery" switches to gallery view
- **WHEN** the user clicks "Gallery" in the sidebar
- **THEN** `appView` is set to `'gallery'` and the Gallery view is displayed
