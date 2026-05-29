## MODIFIED Requirements

### Requirement: Sidebar primary navigation links
The sidebar SHALL display three primary navigation links: "All Prompts", "Favorites", and "Uncollected". Clicking a link SHALL update the `activeFilter` in `PromptsContext`.

#### Scenario: Clicking "Favorites" filters the list
- **WHEN** the user clicks "Favorites"
- **THEN** the prompt list shows only prompts where `isFavorite` is `true`

#### Scenario: Clicking "Uncollected" filters the list
- **WHEN** the user clicks "Uncollected"
- **THEN** the prompt list shows only prompts with no tags

### Requirement: Sidebar Collections section
The sidebar SHALL display a "Collections" section below the primary navigation. Collections SHALL be derived at runtime by grouping all prompt tags. Clicking a collection SHALL update the `activeFilter` in `PromptsContext` to filter by that specific tag.

#### Scenario: Clicking a collection tag filters the list
- **WHEN** the user clicks a collection named "Work"
- **THEN** only prompts containing the "Work" tag are displayed in the list
