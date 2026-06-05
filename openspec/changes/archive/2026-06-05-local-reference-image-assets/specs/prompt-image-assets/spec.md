# Delta Spec: Prompt Image Assets

## ADDED Requirements

### Requirement: Local reference image assets are optimized before storage
The system SHALL optimize user-provided reference images in the browser before storing them locally. Optimization SHALL output a WebP image `Blob`, preserve the source image aspect ratio, avoid upscaling smaller images, and fit the resulting image within an approximately 800x600 display boundary suitable for prompt cards and prompt detail views.

The system SHALL use `browser-image-compression` as the browser-side image optimization dependency for the initial implementation.

The system SHALL NOT store optimized image binary data as base64 inside the `Prompt` object.

#### Scenario: Uploaded image is stored as optimized WebP Blob
- **WHEN** the user uploads a supported image file for an image prompt
- **THEN** the image is resized and compressed in the browser
- **AND** the stored asset has `mimeType: "image/webp"`
- **AND** the stored asset value contains a `Blob`, not a base64 string in the prompt record

#### Scenario: Smaller image is not upscaled
- **WHEN** the user uploads an image smaller than the configured preview boundary
- **THEN** optimization preserves its original dimensions or smaller dimensions
- **AND** does not enlarge it to fill 800x600

#### Scenario: Unsupported file type is rejected
- **WHEN** the user uploads a file that is not a supported image type
- **THEN** no image asset is stored
- **AND** an actionable validation error is shown

---

### Requirement: Local image assets can be created from upload, drag-and-drop, or public URL import
The system SHALL allow a user to attach a local reference image asset to an image prompt using a file picker, drag-and-drop from disk, or a public image URL import. Public URL import SHALL fetch the remote image, optimize it locally, and store the optimized WebP asset when browser security constraints allow it.

If a public URL cannot be fetched or cannot be processed because of CORS or canvas origin restrictions, the system SHALL preserve the ability to save the URL in the legacy `imageUrl` field without creating a local asset.

#### Scenario: Dragged image file creates local asset
- **WHEN** the user drags a supported image file onto the image attachment drop zone
- **THEN** the app optimizes the image and stores a local asset
- **AND** the prompt references the asset

#### Scenario: Public URL import creates local asset when allowed
- **WHEN** the user provides a public image URL that can be fetched and processed by the browser
- **THEN** the app downloads, optimizes, and stores the image as a local WebP asset
- **AND** records the source as `remote-url`

#### Scenario: Public URL CORS failure falls back to imageUrl
- **WHEN** the user provides a public image URL that cannot be processed because of CORS or canvas origin restrictions
- **THEN** the app does not create a local asset
- **AND** the user can still save the URL in `imageUrl`
- **AND** the UI explains why local import failed

---

### Requirement: Local image asset records contain display and provenance metadata
The system SHALL store each local image asset with a stable ID, the owning prompt ID, the optimized image `Blob`, MIME type, display dimensions, byte size, source, and creation timestamp.

#### Scenario: Asset metadata is persisted
- **WHEN** an image asset is created
- **THEN** its record includes `id`, `promptId`, `blob`, `mimeType`, `width`, `height`, `sizeBytes`, `source`, and `createdAt`

#### Scenario: Remote import records original URL
- **WHEN** an image asset is created from a public URL
- **THEN** its record includes the original URL as provenance metadata

---

### Requirement: Local image asset rendering uses object URLs safely
The system SHALL render local image asset `Blob` values by creating browser object URLs. Components SHALL revoke object URLs when they are no longer needed.

#### Scenario: Local asset renders as image source
- **WHEN** a prompt references a local image asset
- **THEN** the relevant image component renders the asset through an object URL

#### Scenario: Object URL is revoked after use
- **WHEN** an image component unmounts or replaces the referenced asset
- **THEN** the previous object URL is revoked

---

### Requirement: Local image asset failures do not corrupt prompt data
The system SHALL keep prompt persistence and image asset persistence failure states explicit. If image optimization or asset storage fails, the prompt SHALL NOT silently reference a missing asset.

#### Scenario: Optimization failure leaves prompt unchanged
- **WHEN** image optimization fails while editing an existing prompt
- **THEN** the existing prompt image reference remains unchanged
- **AND** an error is shown

#### Scenario: Asset write failure does not save dangling reference
- **WHEN** IndexedDB fails while storing the optimized asset
- **THEN** the prompt is not saved with a new `imageAssetId` pointing to a missing asset
- **AND** an error is shown
