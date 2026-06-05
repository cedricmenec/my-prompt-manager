# Tasks: Local Reference Image Assets

- [x] Add image optimization dependency and adapter <!-- id: 1 -->
  - [x] Add `browser-image-compression` to dependencies
  - [x] Create a typed image optimization utility that outputs WebP `Blob` data
  - [x] Cover resize, quality, MIME validation, and failure paths with tests

- [x] Extend the prompt and image asset data model <!-- id: 2 -->
  - [x] Add `imageAssetId?: string` to `PromptSchema` while keeping `imageUrl`
  - [x] Add `PromptImageAsset` type and validation helpers
  - [x] Update schema tests for local asset references and legacy `imageUrl`

- [x] Add IndexedDB image asset storage <!-- id: 3 -->
  - [x] Bump the IndexedDB version
  - [x] Add `promptImageAssets` object store with indexes needed by prompt cleanup
  - [x] Add repository APIs for create/get/delete/list-by-prompt asset operations
  - [x] Ensure deleting/replacing prompts cleans up unreferenced local image assets
  - [x] Add repository tests with Blob persistence

- [x] Update prompt editing flows <!-- id: 4 -->
  - [x] Add file picker and drag-and-drop support for image prompts
  - [x] Add public URL import-to-local action with CORS-aware failure handling
  - [x] Preserve direct `imageUrl` editing for compatibility
  - [x] Add remove/replace local image actions
  - [x] Show optimization progress and actionable errors

- [x] Update image rendering views <!-- id: 5 -->
  - [x] Resolve local image assets for `PromptView`
  - [x] Resolve local image assets for `ImagePromptView`
  - [x] Resolve local image assets for `GalleryView`
  - [x] Fall back to `imageUrl`, then placeholder
  - [x] Revoke object URLs to avoid memory leaks

- [x] Update import/export behavior <!-- id: 6 -->
  - [x] Extend JSON export to include local image asset payloads without base64 in prompt objects
  - [x] Extend JSON import validation and persistence for asset payloads
  - [x] Preserve legacy imports containing only `imageUrl`
  - [x] Document Markdown/frontmatter compatibility behavior

- [ ] Validate end to end <!-- id: 7 -->
  - [x] Run unit tests
  - [x] Build the app
  - [ ] Manually verify upload, drag-and-drop, URL import success, URL import CORS failure, replace, remove, export, and import
