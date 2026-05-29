## ADDED Requirements

### Requirement: Fixed sidebar renders brand header
The system SHALL render a fixed-position left sidebar of exactly 260px width that contains a brand header with the app logo/icon and app name. The sidebar SHALL remain visible and fixed regardless of scroll position in the main content area.

#### Scenario: Sidebar is always visible
- **WHEN** the user scrolls down in the main content area
- **THEN** the sidebar remains fixed on the left side of the viewport

#### Scenario: Brand header displays app name
- **WHEN** the sidebar is rendered
- **THEN** the brand header shows the app icon and the app name text

---

### Requirement: Sidebar primary navigation links
The sidebar SHALL display three primary navigation links: "All Prompts", "Favorites", and "Uncollected". Each link SHALL show an icon and a label. The active link SHALL receive a distinct visual active state (highlighted background or accent colour). "Uncollected" SHALL show a count badge of prompts that have no tags.

#### Scenario: Navigation links are rendered
- **WHEN** the sidebar is rendered
- **THEN** "All Prompts", "Favorites", and "Uncollected" links are visible with icons

#### Scenario: Uncollected badge shows tag-less prompt count
- **WHEN** three prompts have no tags
- **THEN** the "Uncollected" link shows a badge with the value "3"

#### Scenario: Active link is visually distinct
- **WHEN** a navigation link is the current active view
- **THEN** it renders with a highlighted background or accent colour different from inactive links

---

### Requirement: Sidebar Collections section
The sidebar SHALL display a "Collections" section below the primary navigation. Collections SHALL be derived at runtime by grouping all prompt tags. Each collection item SHALL show the tag name and the count of prompts that carry that tag. A "New Collection" icon button SHALL be present in the section header (action deferred; button is rendered but non-functional in this change).

#### Scenario: Collections are derived from prompt tags
- **WHEN** prompts exist with tags "ai" (3 prompts) and "dev" (5 prompts)
- **THEN** the Collections section shows "ai (3)" and "dev (5)"

#### Scenario: No collections shown when no prompts have tags
- **WHEN** all prompts have empty tag arrays
- **THEN** the Collections section shows no items (or an empty-state hint)

#### Scenario: Clicking a collection sets it as active
- **WHEN** the user clicks a collection item
- **THEN** the item receives a visual active state

---

### Requirement: Sidebar footer with dark mode toggle
The sidebar SHALL include a footer area at the bottom with a "Dark Mode" toggle button. The button SHALL be rendered and visible. Theme switching is deferred; clicking the button has no functional effect in this change.

#### Scenario: Dark mode toggle is rendered
- **WHEN** the sidebar is rendered
- **THEN** a "Dark Mode" button is visible at the bottom of the sidebar
