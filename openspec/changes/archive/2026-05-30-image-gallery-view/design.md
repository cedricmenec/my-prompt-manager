## Context

The app currently has a unified grid/list view for all prompts. Prompt cards optionally display a hero image in a fixed-height (`h-32`) container with `object-cover`, which crops portrait images and provides poor visual feedback for image-generation prompts. There is no explicit concept of prompt "type" in the data model — image-gen prompts are currently identified only by the presence of `imageUrl`. The sidebar has navigation filters (All, Favorites, Uncollected, Collections) but no concept of a separate view mode at the app level.

## Goals / Non-Goals

**Goals:**
- Introduce `type: 'text' | 'image'` as an explicit field on the `Prompt` model
- Add a Gallery view (masonry layout) accessible from the sidebar, showing only image-type prompts with natural-ratio images
- Keep the existing Prompts view working for all prompts; remove the hero thumbnail from `PromptCard` and replace it with a small badge for image-type prompts
- Show an image preview in `PromptView` read mode for image-type prompts
- Zero external dependencies added

**Non-Goals:**
- Drag-and-drop reordering in the gallery
- Lightbox / fullscreen image modal (deferred)
- Bulk-tagging image prompts as type=image automatically from existing data
- Upload or local storage of image files (imageUrl remains a URL string)

## Decisions

### D1: Explicit `type` field instead of inferring from `imageUrl`

**Decision**: Add `type: z.enum(['text', 'image']).optional().default('text')` to `PromptSchema`.

**Alternatives considered**:
- Infer from `imageUrl` presence: simpler, no schema change, but a prompt can have an imageUrl without being an image-gen prompt (e.g., a prompt with a reference image). Also, an image-gen prompt without a screenshot yet would be classified as text.
- Boolean `isImageGen`: equivalent but less extensible.

**Rationale**: An explicit type is the source of truth. Gallery visibility is gated on `type === 'image'`, not `imageUrl`. The user sets type when creating/editing the prompt.

---

### D2: CSS `columns` for masonry (no library)

**Decision**: Use Tailwind's `columns-2 sm:columns-3` utilities on a `<ul>` with `break-inside-avoid` on each item. Images render with `w-full h-auto` to preserve aspect ratio.

**Alternatives considered**:
- `react-masonry-css` or `masonry-layout`: adds a dependency, more configuration needed.
- CSS Grid with `grid-template-rows: masonry` (CSS masonry spec): not yet widely supported in browsers.

**Rationale**: CSS columns are universally supported, zero-dependency, and the natural ratio preservation is built-in via `h-auto`. Reflow on image load is acceptable for this use case.

---

### D3: `appView` state in `PromptsContext`

**Decision**: Add `appView: 'prompts' | 'gallery'` to `PromptsContext`, stored in `localStorage` like `viewMode`.

**Alternatives considered**:
- React Router route (`/gallery`): overkill for a single-page app with no URL-based navigation currently in use.
- Separate context: unnecessary split.

**Rationale**: All other view state (viewMode, filter, search) lives in PromptsContext. `appView` fits naturally alongside them.

---

### D4: Gallery filters reuse `activeFilter` and `searchQuery`

**Decision**: The gallery uses the same `filteredPrompts` computed value from `PromptsContext`, then additionally filters to `type === 'image'`. The sidebar filters (All, Favorites, Collections) apply in both views.

**Rationale**: Consistent behaviour — filtering by a collection in the sidebar filters both the Prompts list and the Gallery. No duplicated filter logic.

---

### D5: Hover overlay in `GalleryCard`

**Decision**: Use Tailwind `group` + `group-hover:opacity-100` on an absolutely-positioned overlay div with a gradient from transparent to `rgba(0,0,0,0.7)`. Overlay shows title and tags.

**Rationale**: Consistent with Ideogram-style gallery UX. Keeps cards clean when browsing. Accessible fallback: title is always in the DOM via `alt` and `aria-label`.

## Risks / Trade-offs

- **Image load jank** → Masonry columns reflow when images load. Mitigation: add `aspect-ratio` hint if the user provides dimensions, or accept the reflow (low impact for personal use).
- **Existing data has no `type` field** → All existing prompts default to `'text'`. Users must edit prompts to set `type: 'image'`. Mitigation: the import/export format (`importExport.ts`) already passes raw data through `PromptSchema.parse()`, which will apply the default. No migration script needed.
- **imageUrl field still accepts any URL** → No validation that the URL points to an actual image. Mitigation: existing `onError` handler in `PromptCard` already handles broken images gracefully; same pattern reused in `GalleryCard`.
