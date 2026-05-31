## Why

The Gallery view currently uses a masonry columns layout where each card grows to its image's natural height — a single tall portrait image can dominate an entire column, making it impossible to see more than 2–3 images at a time. Users need density control to scan their collection efficiently.

## What Changes

- **BREAKING layout change**: Replace the masonry `columns-2 sm:columns-3` layout with a CSS Grid (`grid-cols-N`) where N is controlled by the user via a zoom slider.
- Gallery cards switch from `w-full h-auto` (natural height) to a fixed `aspect-square` cell with `object-contain` scaling and a dark (`zinc-950`) background — preserving the full image without cropping while preventing extreme heights.
- A zoom slider (`<input type="range" min=2 max=6 step=1>`) is added to the gallery header (above the grid, inside `GalleryView`), allowing the user to control the number of columns (default: 4).
- The slider state is local to `GalleryView` (`useState`) — not persisted between sessions.
- A count label ("N images") is shown alongside the slider in the gallery header.

## Capabilities

### New Capabilities
*(none)*

### Modified Capabilities
- `image-gallery-view`: Layout changes from masonry to CSS Grid; card rendering changes from natural-height to fixed aspect-ratio; gallery header gains a zoom/column-count slider.

## Impact

- `src/features/prompts/GalleryView.tsx` — primary change (layout, card style, slider)
- No changes to `PromptsContext`, routing, or data model
- No new dependencies
