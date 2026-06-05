# Delta Spec: Image Gallery View (local image assets)

## MODIFIED Requirements

### Requirement: Gallery cards render local assets before imageUrl
The Gallery view SHALL render image-type prompt cards using the local image asset referenced by `imageAssetId` when available. If no local asset is available, Gallery SHALL fall back to the existing `imageUrl` behavior, then the existing placeholder behavior.

#### Scenario: Gallery card renders local asset
- **WHEN** an image-type prompt has a resolvable `imageAssetId`
- **THEN** the gallery card displays the local image asset

#### Scenario: Gallery card prefers local asset over imageUrl
- **WHEN** an image-type prompt has both `imageAssetId` and `imageUrl`
- **THEN** the gallery card displays the local image asset
- **AND** does not load the remote URL

#### Scenario: Gallery card falls back to imageUrl
- **WHEN** an image-type prompt has no resolvable `imageAssetId` but has a valid `imageUrl`
- **THEN** the gallery card displays the remote image URL as before

#### Scenario: Gallery placeholder remains for prompts with no image reference
- **WHEN** an image-type prompt has neither a local asset nor an `imageUrl`
- **THEN** the existing square placeholder is shown
