# Design: Local Reference Image Assets

## Overview

Prompts keep the existing `imageUrl?: string` field for compatibility with previously saved data and Markdown/frontmatter workflows. New local image support is modeled as a separate optimized image asset stored in IndexedDB as a `Blob`.

The prompt references the local asset by ID. Rendering code resolves the local asset first, then falls back to `imageUrl`.

```text
Prompt
  imageAssetId? ───────────────┐
  imageUrl? ───────┐           │
                   │           ▼
                   │     promptImageAssets store
                   │       id
                   │       blob: image/webp
                   │       width / height / sizeBytes
                   │
                   ▼
              remote image fallback
```

## Data Model

Add an optional prompt field:

```typescript
imageAssetId?: string
```

Keep the existing field unchanged:

```typescript
imageUrl?: string
```

Add a new IndexedDB value type:

```typescript
interface PromptImageAsset {
  id: string
  promptId: string
  blob: Blob
  mimeType: 'image/webp'
  width: number
  height: number
  sizeBytes: number
  source: 'upload' | 'remote-url'
  originalName?: string
  originalUrl?: string
  createdAt: string
}
```

The asset is separate from the prompt to avoid placing binary data inside prompt JSON and to allow prompt export/import logic to handle assets explicitly.

## Storage Format

Imported local images SHALL be stored as WebP `Blob` values in IndexedDB. The implementation SHALL NOT store optimized image data as base64 in the prompt object.

Rationale:

- base64 increases storage size compared to binary data
- IndexedDB supports `Blob` values directly
- WebP provides strong compression, browser display compatibility, and easy client-side encoding through browser canvas APIs used by `browser-image-compression`

## Optimization Pipeline

Use `browser-image-compression` as the v1 browser-side optimization dependency.

Default target behavior:

- output format: `image/webp`
- max rendered dimensions: fit within 800x600, preserving aspect ratio
- no upscaling of smaller images
- lossy quality target: approximately `0.78`
- target size guardrail: approximately 200 KB where achievable without excessive quality loss
- strip nonessential metadata by default
- run in a Web Worker when supported

`browser-image-compression` exposes `maxWidthOrHeight`, `maxSizeMB`, `fileType`, `initialQuality`, `useWebWorker`, and cancellation support. If exact 800x600 bounding requires more control than `maxWidthOrHeight`, the implementation may pre-scale via canvas before calling the compressor or adjust the compressor wrapper while keeping the dependency choice.

## Upload Flow

Supported local import entry points:

- file input
- drag-and-drop image file onto the image field/drop zone

Flow:

```text
User selects/drops file
  -> validate image MIME type
  -> optimize to WebP Blob
  -> measure optimized dimensions and size
  -> store PromptImageAsset in IndexedDB
  -> set prompt.imageAssetId
  -> keep existing imageUrl unchanged unless user clears it
```

If the user replaces a local image, the old unused asset SHOULD be deleted after the prompt update succeeds.

## Public URL Import Flow

The user may paste a public URL and choose to import it into local storage.

Flow:

```text
User enters URL
  -> fetch URL as Blob
  -> validate image MIME type
  -> optimize to WebP Blob
  -> store PromptImageAsset with source='remote-url'
  -> set prompt.imageAssetId
  -> optionally preserve imageUrl as original remote fallback
```

Browser security constraints apply. If the remote server does not allow CORS access, the app cannot safely draw and re-encode the image in a canvas. In that case, the UI SHALL report that local import is unavailable for that URL and SHALL still allow saving the URL in the legacy `imageUrl` field.

## Rendering Priority

Image rendering SHOULD use this priority:

1. local asset referenced by `prompt.imageAssetId`
2. legacy public `prompt.imageUrl`
3. placeholder

For local assets, components SHOULD create an object URL from the `Blob` and revoke it when the component unmounts or when the blob changes.

## Compatibility

Existing prompts with only `imageUrl` remain valid and render as before. Importing old JSON or Markdown frontmatter that contains `imageUrl` continues to work.

New JSON exports include prompt asset references and asset payloads. Markdown/frontmatter export may preserve `imageUrl` but SHOULD NOT inline binary image data in Markdown frontmatter.

## Error Handling

The UI should surface clear errors for:

- unsupported file type
- image decode failure
- image too large for browser canvas limits
- optimization failure
- remote URL fetch failure
- remote URL CORS failure
- IndexedDB write failure

Errors must state whether the prompt itself was saved and whether the image asset was attached.

## Privacy

Uploaded image files are processed locally in the browser. No image data is sent to an external service by this feature. Remote URL import necessarily downloads the image from the provided URL, but optimization and storage remain local after fetch.
