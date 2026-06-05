# Delta Spec: Image Prompt View (local image assets)

## MODIFIED Requirements

### Requirement: ImagePromptView renders local assets before imageUrl
`ImagePromptView` SHALL display the local image asset referenced by `imageAssetId` when available. If no local asset is available, it SHALL fall back to displaying `imageUrl`. If neither is available, it SHALL show the existing placeholder.

#### Scenario: Detail view renders local asset
- **WHEN** the selected image prompt has a resolvable `imageAssetId`
- **THEN** the large image area displays the local image asset with preserved aspect ratio

#### Scenario: Detail view prefers local asset over imageUrl
- **WHEN** the selected image prompt has both `imageAssetId` and `imageUrl`
- **THEN** the large image area displays the local image asset
- **AND** does not load the remote URL

#### Scenario: Detail view falls back to imageUrl
- **WHEN** the selected image prompt has no resolvable `imageAssetId` and has a valid `imageUrl`
- **THEN** the large image area displays the remote URL as before

#### Scenario: Detail view placeholder remains when no image is available
- **WHEN** the selected image prompt has neither a local asset nor `imageUrl`
- **THEN** the existing placeholder is shown
