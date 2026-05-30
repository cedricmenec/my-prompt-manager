## 1. Domain Model

- [x] 1.1 Add `type: z.enum(['text', 'image']).optional().default('text')` to `PromptSchema` in `src/domain/promptSchema.ts`
- [x] 1.2 Update `promptSchema.test.ts` — add scenario: prompt without `type` defaults to `'text'`; add scenario: invalid `type` value fails validation; add `type` field to existing `validPrompt` fixture

## 2. App State

- [x] 2.1 Add `appView: 'prompts' | 'gallery'` to `PromptsContextValue` interface in `PromptsContext.tsx`
- [x] 2.2 Add `appView` state with `useState` (persisted in `localStorage` as `'promptAppView'`)
- [x] 2.3 Expose `appView` and `setAppView` from the context provider

## 3. PromptCard — Remove Hero Image, Add Type Badge

- [x] 3.1 Remove the hero image block (`prompt.imageUrl && !imageError`) from `PromptCard.tsx`
- [x] 3.2 Add a small image-type indicator badge (e.g. `🖼` icon or `Badge` chip) to `PromptCard` when `prompt.type === 'image'`

## 4. GalleryView — New Component

- [x] 4.1 Create `src/features/prompts/GalleryView.tsx` with masonry layout (`columns-2 sm:columns-3`, `break-inside-avoid` per item)
- [x] 4.2 Filter `filteredPrompts` to `type === 'image'` inside `GalleryView`
- [x] 4.3 Create `GalleryCard` (inline or separate file): `w-full h-auto` image, `group-hover` overlay with title and tags
- [x] 4.4 Handle broken `imageUrl` in `GalleryCard` with `onError` fallback placeholder
- [x] 4.5 Handle missing `imageUrl` in `GalleryCard` with a placeholder block
- [x] 4.6 Wire click on `GalleryCard` to `dispatch({ type: 'SELECT', id: prompt.id })`
- [x] 4.7 Add empty-state message when no image-type prompts match

## 5. PromptListView — Route to GalleryView

- [x] 5.1 In `PromptListView.tsx`, read `appView` from context
- [x] 5.2 When `appView === 'gallery'`, render `GalleryView` instead of the grid/list

## 6. PromptView — Image Preview in Read Mode

- [x] 6.1 In `PromptView.tsx` `renderReadMode`, add image preview block between description and Copy CTA for prompts where `type === 'image'` and `imageUrl` is set
- [x] 6.2 Image rendered as `<img src={p.imageUrl} className="w-full h-auto rounded-lg" />`
- [x] 6.3 Add `type` field selector (Text / Image) to the edit/create form in `PromptView.tsx`
- [x] 6.4 Include `type` in the `handleSave` create and update payloads

## 7. Sidebar Navigation — Gallery Entry

- [x] 7.1 Add "Gallery" button to `SidebarNav.tsx` primary nav section with an image/gallery icon
- [x] 7.2 Wire click to call `setAppView('gallery')`
- [x] 7.3 Update `isActive` logic: "Gallery" is active when `appView === 'gallery'`; other nav links set `appView` back to `'prompts'` on click
- [x] 7.4 Add a visual separator between filter links and the Gallery link (or group Gallery above Collections)

## 8. TopAppBar — Hide View Toggle in Gallery

- [x] 8.1 In `TopAppBar.tsx`, read `appView` from context
- [x] 8.2 Hide the grid/list toggle buttons when `appView === 'gallery'`

## 9. Test Fixtures

- [x] 9.1 Update `promptRepository.test.ts` fixture objects — add `type: 'text'` to `baseData` and all inline prompt objects
- [x] 9.2 Update `markdownParser.test.ts` fixture — add `type: 'text'` to `validPrompt`
- [x] 9.3 Update `importExport.test.ts` fixture objects — add `type: 'text'` to prompt objects used in bulk import
