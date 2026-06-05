# Delta Spec: Prompt View (local image assets)

## MODIFIED Requirements

### Requirement: PromptView supports local reference image assets
For prompts with `type === 'image'`, `PromptView` read mode SHALL render a local image asset when `imageAssetId` is set and resolvable. If no local asset is available, it SHALL fall back to the existing `imageUrl` behavior. If neither is available, no image preview section is rendered as currently specified.

#### Scenario: Local asset preview is shown before imageUrl
- **WHEN** `PromptView` is in read mode for an image prompt with both `imageAssetId` and `imageUrl`
- **THEN** the image preview renders the local asset
- **AND** does not load the remote `imageUrl`

#### Scenario: imageUrl fallback still renders
- **WHEN** `PromptView` is in read mode for an image prompt with no `imageAssetId` and a valid `imageUrl`
- **THEN** the image preview renders the remote URL as before

#### Scenario: Missing local asset falls back to imageUrl
- **WHEN** `PromptView` is in read mode for an image prompt whose `imageAssetId` cannot be resolved and whose `imageUrl` is valid
- **THEN** the image preview renders the remote URL fallback

---

### Requirement: PromptView edit mode manages local and remote image references
PromptView edit mode SHALL provide controls to attach, replace, and remove a local reference image asset. It SHALL support file picker upload, drag-and-drop upload, and public URL import-to-local. It SHALL also keep the existing `imageUrl` text input for compatibility.

#### Scenario: Edit mode shows local image attachment controls
- **WHEN** the user edits an image prompt
- **THEN** controls are available to upload/drop an image file and attach it as a local asset

#### Scenario: Edit mode preserves imageUrl input
- **WHEN** the user edits an image prompt
- **THEN** the existing `imageUrl` input remains available

#### Scenario: Removing local image preserves optional imageUrl
- **WHEN** the user removes the local image asset from a prompt that also has `imageUrl`
- **THEN** `imageAssetId` is cleared
- **AND** `imageUrl` remains unchanged unless the user explicitly edits it
