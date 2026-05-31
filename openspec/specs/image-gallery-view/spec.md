# Image Gallery View

## Purpose

Defines the Gallery view: a masonry layout for image-generation prompts, accessible from the sidebar, showing cards at natural image aspect ratios with hover overlays.

## Requirements

### Requirement: Gallery view displays image-gen prompts in masonry layout
The system SHALL provide a Gallery view accessible from the sidebar that displays only prompts where `type === 'image'`. The layout SHALL be a masonry-style CSS columns grid (2 columns on small screens, 3 on medium and above). Each card SHALL display the image at its natural aspect ratio (`w-full h-auto`). The Gallery view SHALL reuse the active `activeFilter` and `searchQuery` from `PromptsContext` to filter the displayed set. When no image-type prompts match, an empty-state message SHALL be shown.

#### Scenario: Gallery shows only image-type prompts
- **WHEN** the user navigates to the Gallery view
- **THEN** only prompts with `type === 'image'` are displayed, regardless of whether they have an `imageUrl`

#### Scenario: Gallery respects active filter
- **WHEN** the user has selected a collection filter in the sidebar and switches to Gallery view
- **THEN** the gallery shows only image-type prompts that also match the active filter

#### Scenario: Gallery respects search query
- **WHEN** the user has typed a search query and switches to Gallery view
- **THEN** the gallery shows only image-type prompts matching the search query

#### Scenario: Empty state when no image prompts match
- **WHEN** no prompts with `type === 'image'` exist or none match the current filter/search
- **THEN** an empty-state message is displayed

#### Scenario: Cards preserve natural image aspect ratio
- **WHEN** an image-type prompt has an `imageUrl` and is displayed in the gallery
- **THEN** the image is rendered with full width and automatic height, preserving its aspect ratio without cropping

#### Scenario: Hover overlay appears on card hover
- **WHEN** the user hovers over a gallery card
- **THEN** an overlay appears showing the prompt title and tags over a gradient background

#### Scenario: Clicking a gallery card opens ImagePromptView
- **WHEN** the user clicks a gallery card
- **THEN** `ImagePromptView` is rendered for that prompt (not `PromptView`)

#### Scenario: Gallery card with broken imageUrl shows fallback
- **WHEN** an image-type prompt has an `imageUrl` that fails to load
- **THEN** a fallback placeholder is shown instead of a broken image

#### Scenario: Gallery card without imageUrl shows placeholder
- **WHEN** an image-type prompt has no `imageUrl`
- **THEN** a placeholder indicating no image is available is shown
