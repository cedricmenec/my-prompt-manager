## MODIFIED Requirements

### Requirement: Sidebar is mode-aware and renders content based on active navigation mode
The system SHALL render a fixed-position left sidebar of exactly 260px width. The sidebar SHALL NOT contain the brand header / logo (moved to `GlobalTopBar`). Instead the sidebar SHALL directly render the "+ New Prompt" CTA button and navigation links appropriate for the current `appView` mode. The footer area SHALL retain the Settings button (non-functional dark mode toggle may remain or be removed in this change).

#### Scenario: Sidebar renders without brand header
- **WHEN** the sidebar is rendered
- **THEN** no app logo or app name is displayed inside the sidebar

#### Scenario: Sidebar is always visible
- **WHEN** the user scrolls down in the main content area
- **THEN** the sidebar remains fixed on the left side of the viewport

### Requirement: Sidebar in Prompts mode renders standard navigation links
When `appView === 'prompts'`, the sidebar SHALL display the following primary navigation links: "All Prompts", "Favorites", "Uncollected" (with count badge), and a Collections section derived from all prompt tags. There SHALL be no "Gallery" link — mode switching is handled by the `GlobalTopBar`. The "+ New Prompt" CTA SHALL dispatch `OPEN_CREATE` with `initialType: 'text'` (or no type, defaulting to text).

#### Scenario: Prompts mode navigation links are rendered
- **WHEN** `appView` is `'prompts'`
- **THEN** the sidebar shows "All Prompts", "Favorites", and "Uncollected" links, and a Collections section

#### Scenario: Uncollected badge shows tag-less prompt count
- **WHEN** `appView` is `'prompts'` and three prompts have no tags
- **THEN** the "Uncollected" link shows a badge with the value "3"

#### Scenario: Active link is visually distinct in Prompts mode
- **WHEN** a navigation link corresponds to the current `activeFilter`
- **THEN** it renders with a highlighted background or accent colour

#### Scenario: Collections in Prompts mode are derived from all prompt tags
- **WHEN** `appView` is `'prompts'` and prompts exist with tags "ai" (3) and "image" (5)
- **THEN** the Collections section shows "ai (3)" and "image (5)" regardless of prompt type

### Requirement: Sidebar in Gallery mode renders gallery-specific navigation
When `appView === 'gallery'`, the sidebar SHALL display: "All Images" link (sets `activeFilter` to `{ type: 'all' }`), "Favorites" link (sets `activeFilter` to `{ type: 'favorites' }`), and a Collections section derived only from prompts with `type === 'image'`. The "Uncollected" link SHALL NOT be shown in gallery mode. The "+ New Image Prompt" CTA SHALL dispatch `OPEN_CREATE` with `initialType: 'image'`.

#### Scenario: Gallery mode navigation links are rendered
- **WHEN** `appView` is `'gallery'`
- **THEN** the sidebar shows "All Images" and "Favorites" links, but NOT "Uncollected"

#### Scenario: Collections in Gallery mode are filtered to image prompts only
- **WHEN** `appView` is `'gallery'` and a tag "spring" appears only on text prompts
- **THEN** the tag "spring" does NOT appear in the Collections section

#### Scenario: Collections in Gallery mode show only tags from image-type prompts
- **WHEN** `appView` is `'gallery'` and a tag "cyberpunk" appears on 2 image prompts and 1 text prompt
- **THEN** the Collections section shows "cyberpunk (2)"

#### Scenario: New Image Prompt CTA is shown in Gallery mode
- **WHEN** `appView` is `'gallery'`
- **THEN** the sidebar CTA button is labelled "+ New Image Prompt" and clicking it opens the editor with `type: 'image'` pre-selected

## REMOVED Requirements

### Requirement: Sidebar primary navigation links (original — includes Gallery link)
**Reason**: The "Gallery" navigation link is removed from the sidebar. Mode switching between Prompts and Gallery is now handled exclusively by the `GlobalTopBar` segmented control. The sidebar navigation items are split into mode-specific sets (see MODIFIED requirements above).
**Migration**: Remove the "Gallery" `<button>` and its separator from `SidebarNav`. Mode switching calls `setAppView` which is now triggered from `GlobalTopBar` only.
