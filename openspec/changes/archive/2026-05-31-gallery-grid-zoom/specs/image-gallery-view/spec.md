## MODIFIED Requirements

### Requirement: Gallery view displays image-gen prompts in CSS Grid layout with zoom control
The system SHALL provide a Gallery view that displays only prompts where `type === 'image'` in a CSS Grid layout. The number of columns SHALL be controlled by a zoom slider rendered in the gallery header. The slider SHALL support values from 2 to 6 columns (inclusive), with a default of 4 columns. The slider state SHALL be local to the Gallery view component (`useState`) and SHALL NOT be persisted across sessions. Each card cell SHALL use a square aspect ratio (`aspect-square`) with `object-contain` image scaling and a dark background (`zinc-950`) to provide a letterbox effect for non-square images. The Gallery view SHALL continue to reuse the active `activeFilter` and `searchQuery` from `PromptsContext` to filter the displayed set. When no image-type prompts match, an empty-state message SHALL be shown.

#### Scenario: Gallery renders in CSS Grid layout
- **WHEN** the Gallery view is displayed
- **THEN** the images are arranged in a CSS Grid (not a masonry columns layout)

#### Scenario: Gallery default column count is 4
- **WHEN** the user enters Gallery mode without having previously adjusted the slider
- **THEN** the grid renders with 4 columns

#### Scenario: Zoom slider renders in gallery header
- **WHEN** the Gallery view is displayed
- **THEN** a range slider with min=2, max=6, step=1 is visible in the gallery header alongside an image count label

#### Scenario: Decreasing zoom shows fewer, larger cards
- **WHEN** the user moves the zoom slider to the left (lower value)
- **THEN** the grid re-renders with fewer columns and larger cards

#### Scenario: Increasing zoom shows more, smaller cards
- **WHEN** the user moves the zoom slider to the right (higher value)
- **THEN** the grid re-renders with more columns and smaller cards

#### Scenario: Slider is reset to default on next session
- **WHEN** the user sets the slider to 6 columns and then reloads the page
- **THEN** the gallery renders with 4 columns (the default)

#### Scenario: Gallery card uses square aspect ratio
- **WHEN** an image-type prompt is displayed in the gallery
- **THEN** the card cell has a square aspect ratio regardless of the image's natural dimensions

#### Scenario: Image is fully visible with no cropping
- **WHEN** an image-type prompt with a non-square `imageUrl` is displayed
- **THEN** the image is scaled with `object-contain` so its full composition is visible, with dark letterbox bands on the sides or top/bottom as needed

#### Scenario: Gallery card placeholder is square
- **WHEN** an image-type prompt has no `imageUrl`
- **THEN** a square placeholder is displayed

#### Scenario: Gallery shows only image-type prompts
- **WHEN** the user is in Gallery mode
- **THEN** only prompts with `type === 'image'` are displayed

#### Scenario: Gallery respects active filter
- **WHEN** the user has selected a collection filter in the sidebar while in Gallery mode
- **THEN** the gallery shows only image-type prompts that match the active tag filter

#### Scenario: Gallery respects search query
- **WHEN** the user has typed a search query while in Gallery mode
- **THEN** the gallery shows only image-type prompts matching the search query

#### Scenario: Empty state when no image prompts match
- **WHEN** no prompts with `type === 'image'` exist or none match the current filter/search
- **THEN** an empty-state message is displayed

#### Scenario: Clicking a gallery card opens ImagePromptView
- **WHEN** the user clicks a gallery card
- **THEN** `ImagePromptView` is rendered for that prompt (not `PromptView`)

#### Scenario: Hover overlay appears on card hover
- **WHEN** the user hovers over a gallery card
- **THEN** an overlay appears showing the prompt title and tags

#### Scenario: Gallery card without imageUrl shows placeholder
- **WHEN** an image-type prompt has no `imageUrl`
- **THEN** a placeholder is shown in place of the image
