## 1. GalleryView — Layout refactor

- [x] 1.1 Remove `columns-2 sm:columns-3 gap-3 space-y-3` masonry layout from the `<ul>` in `GalleryView`
- [x] 1.2 Add `useState<number>(4)` for `cols` in `GalleryView`
- [x] 1.3 Replace `<ul>` with a `<div>` using `display: grid` via `style={{ gridTemplateColumns: \`repeat(\${cols}, minmax(0, 1fr))\` }}` and a `gap-2` class

## 2. GalleryView — Gallery header with zoom slider

- [x] 2.1 Add a header row above the grid showing the image count (`{imagePrompts.length} images`)
- [x] 2.2 Add `<input type="range" min={2} max={6} step={1} value={cols} onChange={...} />` to the header
- [x] 2.3 Add zoom-out and zoom-in icons (or labels) at each end of the slider for visual affordance

## 3. GalleryCard — Square aspect ratio + object-contain

- [x] 3.1 Replace the `<img>` wrapper with a `div` using `aspect-square overflow-hidden bg-zinc-950` classes
- [x] 3.2 Update the `<img>` to use `w-full h-full object-contain` instead of `w-full h-auto block`
- [x] 3.3 Update the placeholder `div` (no imageUrl / error) to use `aspect-square` instead of `aspect-video`

## 4. Verification

- [x] 4.1 Verify `pnpm run build` passes with no TypeScript errors
- [x] 4.2 Verify `pnpm test` passes (29 tests)
- [ ] 4.3 Visually verify: default 4-col grid renders on page load
- [ ] 4.4 Visually verify: slider at 2 shows 2 large columns, slider at 6 shows 6 small columns
- [ ] 4.5 Visually verify: portrait and landscape images show letterbox bands on dark background without cropping
