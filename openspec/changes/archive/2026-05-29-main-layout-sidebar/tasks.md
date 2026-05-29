## 1. Create Layout Feature Folder

- [x] 1.1 Create `src/features/layout/` directory (add a `.gitkeep` or first file)
- [x] 1.2 Create `src/features/layout/SidebarNav.tsx` component skeleton

## 2. Implement SidebarNav Component

- [x] 2.1 Render fixed sidebar container (260px wide, full viewport height, left-anchored)
- [x] 2.2 Add brand header (app icon + app name)
- [x] 2.3 Add "New Prompt" CTA button that dispatches `OPEN_CREATE` via `usePrompts()`
- [x] 2.4 Add primary nav links: "All Prompts", "Favorites", "Uncollected" with icons
- [x] 2.5 Compute "Uncollected" count from `state.prompts` (prompts with no tags) and show as badge
- [x] 2.6 Add Collections section header with "add" icon button (non-functional)
- [x] 2.7 Derive collections from prompt tags (group by tag, count per tag) and render list items
- [x] 2.8 Add footer with "Dark Mode" toggle button (non-functional, rendered only)
- [x] 2.9 Apply active state styling to the currently selected nav link / collection item (local state)

## 3. Implement TopAppBar Component

- [x] 3.1 Create `src/features/layout/TopAppBar.tsx` component skeleton
- [x] 3.2 Render sticky top bar inside the main region (not spanning the sidebar)
- [x] 3.3 Add search input with search icon and placeholder "Search prompts..."
- [x] 3.4 Add filter toolbar buttons: "Tags", "Language", "Favorites" (rendered, non-functional)
- [x] 3.5 Add view toggle buttons for list/grid view (rendered, non-functional)

## 4. Implement MainLayoutShell Component

- [x] 4.1 Create `src/features/layout/MainLayoutShell.tsx`
- [x] 4.2 Compose `SidebarNav` (left, fixed) + `<main>` region (right, flex-1, overflow-hidden)
- [x] 4.3 Inside `<main>`, place `TopAppBar` (sticky) above a scrollable content canvas (`children`)
- [x] 4.4 Ensure body/root does not overflow; full viewport height layout

## 5. Integrate Shell in App.tsx

- [x] 5.1 Import `MainLayoutShell` in `src/app/App.tsx`
- [x] 5.2 Wrap existing content (list + detail panel + editor overlay) with `MainLayoutShell`
- [x] 5.3 Remove old bare `flex h-screen` wrapper div
- [x] 5.4 Adjust detail panel placement so it renders within the content canvas alongside the grid

## 6. Update PromptListView

- [x] 6.1 Replace the vertical list layout with a responsive CSS grid (1 / 2 / 3 columns)
- [x] 6.2 Remove the "New Prompt" button from `PromptListView` (moved to sidebar)
- [x] 6.3 Update `PromptCard` description truncation to two lines (`line-clamp-2`)

## 7. Verification

- [x] 7.1 Run `pnpm dev` and visually verify: sidebar visible, top bar sticky, prompt grid responsive
- [x] 7.2 Verify "New Prompt" CTA in sidebar opens the editor (dispatches `OPEN_CREATE`)
- [x] 7.3 Verify Collections section correctly lists tags with counts
- [x] 7.4 Verify "Uncollected" badge count matches prompts with no tags
- [x] 7.5 Run `pnpm test` and fix any snapshot failures caused by layout changes
- [x] 7.6 Run `pnpm build` and confirm exit code 0
