## Why

The current grid view treats all prompts identically, using a fixed-height hero image thumbnail that clips portrait images and provides little visual signal about prompt type. Image-generation prompts need to be discoverable by their visual output, not their title — a use case that is fundamentally different from text prompts. These two prompt types require two distinct views.

## What Changes

- Add a `type` field (`'text' | 'image'`) to the `Prompt` domain model to explicitly classify prompts
- **Vue "Prompts"** (existing grid/list view): image-gen prompts show a small image badge icon but no thumbnail — keeping all cards visually uniform
- **Vue "Gallery"** (new): a dedicated masonry layout showing only `type: 'image'` prompts, each card sized to preserve the image's natural aspect ratio, with an overlay on hover displaying title and tags
- Sidebar adds a "Gallery" navigation entry that switches to the gallery view
- `PromptView` (read mode) gains an image preview section for `type: 'image'` prompts, displayed above the content block
- The view toggle (grid/list) in the TopAppBar is hidden while Gallery is the active view
- Existing prompts without a `type` field default to `'text'`

## Capabilities

### New Capabilities
- `image-gallery-view`: Masonry layout view for image-gen prompts — card grid with natural aspect ratio images, hover overlay with title/tags, click opens `PromptView`

### Modified Capabilities
- `prompt-model`: Add `type: 'text' | 'image'` field (optional, default `'text'`)
- `prompt-list-view`: Image-type prompts in Prompts view show a badge indicator instead of a thumbnail; thumbnail hero image is removed from `PromptCard`
- `prompt-view`: Read mode gains an image preview block (full-width, natural ratio) when `prompt.type === 'image'` and `imageUrl` is set
- `sidebar-navigation`: Add "Gallery" nav entry (distinct from filters) that switches `appView` to `'gallery'`

## Impact

- `src/domain/promptSchema.ts` — add `type` field
- `src/features/prompts/PromptsContext.tsx` — add `appView: 'prompts' | 'gallery'` state
- `src/features/prompts/PromptCard.tsx` — remove hero image, add image-type badge
- `src/features/prompts/PromptListView.tsx` — render `GalleryView` when `appView === 'gallery'`
- `src/features/prompts/PromptView.tsx` — image preview block in read mode, `type` field in edit mode
- `src/features/layout/SidebarNav.tsx` — Gallery nav entry
- `src/features/layout/TopAppBar.tsx` — hide view toggle in gallery view
- `src/features/prompts/GalleryView.tsx` — **new file**, masonry layout component
- Test fixtures across `*.test.ts` files — add `type` field to `Prompt` objects
