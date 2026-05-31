## Context

`GalleryView.tsx` currently uses CSS `columns-2 sm:columns-3` (masonry layout) with `w-full h-auto` on each image. Cards grow to their image's natural height — there is no upper bound. A single portrait image can consume the full visible height of the viewport, making it hard to scan more than 2–3 images at a time.

The change is self-contained: only `GalleryView.tsx` is affected. No data model, routing, context, or infrastructure changes are needed.

## Goals / Non-Goals

**Goals:**
- Replace the masonry layout with a CSS Grid where column count is user-controlled (2–6, default 4)
- Cap card height via a fixed `aspect-square` cell so images never overflow the grid
- Preserve the full image without cropping (`object-contain`) using a dark background for the letterbox effect
- Provide a zoom slider in the gallery header (count label + range input) — local `useState`, no persistence

**Non-Goals:**
- Persisting the zoom level across sessions (deferred)
- Changing the hover overlay, click-to-select, or filter/search behaviour
- Any changes outside `GalleryView.tsx`

## Decisions

### Decision 1: CSS Grid over masonry columns
**Chosen**: `grid grid-cols-{N}` (N from slider state) replacing `columns-2 sm:columns-3`.  
**Why**: Masonry columns heights are unbounded per card. CSS Grid with a fixed cell aspect ratio gives uniform rows, making the zoom slider meaningful and the layout predictable.  
**Alternative considered**: Keep masonry, add `max-h` per card. Rejected — masonry with capped heights creates irregular gaps and doesn't honour the "zoom = more rows visible" mental model.

### Decision 2: aspect-square + object-contain + zinc-950 background
**Chosen**: Each card cell uses `aspect-square overflow-hidden` with `bg-zinc-950`; the `<img>` uses `w-full h-full object-contain`.  
**Why**: Preserves the full image composition (no crop). Dark background makes letterbox bands invisible rather than distracting. Square cells work best for the dominant AI image formats (1:1, near-square). Paysage and portrait images get subtle symmetric bands on dark.  
**Alternative considered**: `object-cover` (crop). Rejected — loses the compositional intent of AI-generated images, which is their primary value.

### Decision 3: Slider in gallery header inside GalleryView
**Chosen**: A header row inside `GalleryView` with an image count label and an `<input type="range" min=2 max=6 step=1>`. State lives in `useState<number>(4)` in `GalleryView`.  
**Why**: The slider is gallery-specific UX; co-locating it with the grid keeps `TopAppBar` and `PromptsContext` untouched. Consistent with the principle that view-local preferences stay local.  
**Alternative considered**: In `TopAppBar`. Rejected — would require threading slider state up through `PromptsContext` or prop-drilling, adding coupling for a trivial view preference.

### Decision 4: Tailwind dynamic class via inline style fallback
**Issue**: Tailwind purges dynamic classes like `grid-cols-${n}`. Cannot safely use template literals in className.  
**Chosen**: Use `style={{ gridTemplateColumns: \`repeat(\${cols}, minmax(0, 1fr))\` }}` inline on the grid div — bypasses the purge issue entirely without needing to safelist classes.

## Risks / Trade-offs

- **[Visual regression on non-square images]** → Accepted trade-off; dark letterbox is intentional design. Mitigated by `object-contain` which never crops.
- **[Loss of masonry visual variety]** → Grid is more regular/rigid than masonry. Acceptable given the density goal.
- **[Slider not persisted]** → User resets to 4 cols on every visit. Acceptable for now; persistence deferred.
