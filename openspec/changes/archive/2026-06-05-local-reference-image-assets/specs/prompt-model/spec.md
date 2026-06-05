# Delta Spec: Prompt Model (local image assets)

## MODIFIED Requirements

### Requirement: Prompt may reference a local image asset
The `Prompt` schema SHALL include an optional `imageAssetId` field containing the stable ID of an optimized local reference image asset stored in IndexedDB.

The existing optional `imageUrl` field SHALL remain supported and valid for backward compatibility with existing prompts, Markdown/frontmatter files, and JSON exports.

#### Scenario: Prompt with imageAssetId is valid
- **WHEN** a prompt object includes a non-empty `imageAssetId` string
- **THEN** validation succeeds

#### Scenario: Prompt with legacy imageUrl remains valid
- **WHEN** a prompt object includes a valid `imageUrl` and no `imageAssetId`
- **THEN** validation succeeds
- **AND** the prompt remains renderable through the remote URL fallback

#### Scenario: Prompt without any image reference is valid
- **WHEN** an image-type prompt omits both `imageAssetId` and `imageUrl`
- **THEN** validation succeeds
- **AND** image views show their existing placeholder behavior

#### Scenario: Prompt can carry both local asset and imageUrl
- **WHEN** a prompt object includes both `imageAssetId` and a valid `imageUrl`
- **THEN** validation succeeds
- **AND** rendering prefers the local asset over the remote URL
