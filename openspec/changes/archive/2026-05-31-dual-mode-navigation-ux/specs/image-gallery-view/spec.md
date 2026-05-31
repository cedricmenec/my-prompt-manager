## MODIFIED Requirements

### Requirement: Gallery view card click opens ImagePromptView
The system SHALL provide a Gallery view that displays only prompts where `type === 'image'` in a masonry-style CSS columns grid. Clicking a gallery card SHALL dispatch `SELECT` with the prompt id, and the application SHALL render `ImagePromptView` for the selected prompt (not the standard `PromptView`). All other gallery behaviours (masonry layout, aspect ratio, hover overlay, empty state, filter/search respect) remain unchanged.

#### Scenario: Gallery shows only image-type prompts
- **WHEN** the user is in Gallery mode
- **THEN** only prompts with `type === 'image'` are displayed

#### Scenario: Gallery respects active filter
- **WHEN** the user has selected a collection filter in the sidebar while in Gallery mode
- **THEN** the gallery shows only image-type prompts that match the active tag filter

#### Scenario: Gallery respects search query
- **WHEN** the user has typed a search query while in Gallery mode
- **THEN** the gallery shows only image-type prompts matching the search query

#### Scenario: Clicking a gallery card opens ImagePromptView
- **WHEN** the user clicks a gallery card
- **THEN** `ImagePromptView` is rendered for that prompt (not `PromptView`)

#### Scenario: Empty state when no image prompts match
- **WHEN** no prompts with `type === 'image'` exist or none match the current filter/search
- **THEN** an empty-state message is displayed

#### Scenario: Cards preserve natural image aspect ratio
- **WHEN** an image-type prompt has an `imageUrl` and is displayed in the gallery
- **THEN** the image is rendered with full width and automatic height, preserving its aspect ratio

#### Scenario: Hover overlay appears on card hover
- **WHEN** the user hovers over a gallery card
- **THEN** an overlay appears showing the prompt title and tags

#### Scenario: Gallery card without imageUrl shows placeholder
- **WHEN** an image-type prompt has no `imageUrl`
- **THEN** a placeholder is shown in place of the image
