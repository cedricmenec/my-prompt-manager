## Why

Image-generation prompts currently support only a public `imageUrl` reference image. This is useful when the image is already hosted, but it does not cover local-first usage where the user wants to attach an example image directly from disk or import it from a public URL into the local database.

Because the app stores data locally in IndexedDB, storing large originals or base64 strings would unnecessarily grow the database. Reference images should therefore be resized, compressed, and stored as compact binary assets suitable for card thumbnails and prompt detail previews.

## What Changes

- Add local reference image assets for image prompts, stored in IndexedDB as binary `Blob` records rather than base64 strings.
- Optimize imported images client-side using WebP output through `browser-image-compression`.
- Support two import paths for local image assets:
  - drag-and-drop or file picker upload from the user's disk
  - public image URL import when the remote resource can be fetched and processed by the browser
- Resize imported images to a bounded preview size suitable for the app, with a maximum display-oriented dimension target around 800x600.
- Preserve the existing `imageUrl` field for backward compatibility and as a remote fallback.
- Display either a local image asset or the legacy remote `imageUrl` in prompt detail and image gallery views.
- Update export/import behavior so prompt data remains portable while local image assets are represented explicitly.

## Capabilities

### New Capabilities

- `prompt-image-assets`: Local reference image asset lifecycle, optimization rules, supported import paths, and Blob-based IndexedDB storage.

### Modified Capabilities

- `prompt-model`: Adds a local reference image relationship while keeping `imageUrl` valid for compatibility.
- `prompt-repository`: Adds IndexedDB structure and repository behavior for image assets alongside prompts.
- `prompt-view`: Updates prompt read/edit behavior to support local image assets and legacy `imageUrl`.
- `image-gallery-view`: Updates gallery cards to render local image assets before falling back to `imageUrl`.
- `image-prompt-view`: Updates the large image detail view to render local image assets before falling back to `imageUrl`.
- `import-export`: Defines JSON import/export behavior for local image asset metadata and binary payloads.

## Impact

- Adds a browser-side image optimization dependency: `browser-image-compression`.
- Adds an IndexedDB object store for optimized reference image assets.
- Requires a database version bump and structural migration.
- Requires repository APIs for creating, reading, deleting, and resolving prompt image assets.
- Requires UI updates for image upload, drag-and-drop, URL import, optimization progress/errors, and image removal.
- Requires tests for schema validation, repository asset persistence, optimization utility behavior, and import/export compatibility.
