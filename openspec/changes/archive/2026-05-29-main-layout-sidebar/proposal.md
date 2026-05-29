## Why

The app currently has a minimal two-column layout (list + detail panel) with no global navigation. Users need a proper application shell with a persistent sidebar to navigate between collections and views, and a top bar for search and filtering — matching the intended UX design of a prompt vault manager.

## What Changes

- Introduce a fixed-width left sidebar (260px) containing: brand header, "New Prompt" CTA button, primary navigation links (All Prompts, Favorites, Uncollected), a Collections section listing prompt folders with counts, and a dark mode toggle footer
- Introduce a sticky top app bar in the main content area with a search input and a filter/sort toolbar (Tags, Language, Favorites filters + list/grid view toggle)
- Replace the current ad-hoc `flex h-screen` shell in `App.tsx` with the new layout shell that wires sidebar + top bar + content area together
- The `PromptListView` moves into the main content canvas, displayed as a grid of prompt cards with breadcrumb/collection title above

## Capabilities

### New Capabilities
- `sidebar-navigation`: Fixed left sidebar with brand header, primary nav links, collections list with counts, and footer actions (dark mode toggle)
- `top-app-bar`: Sticky top bar within the main content area featuring a search input and a filter/view toolbar
- `main-layout-shell`: The root layout component that composes the sidebar, top bar, and main content canvas; replaces the current minimal shell in `App.tsx`

### Modified Capabilities
- `prompt-list-view`: The prompt list is now rendered inside the main content canvas (within the layout shell). The layout of cards changes to a responsive grid. The "New Prompt" button moves to the sidebar CTA; the list view no longer owns it at the top-level.

## Impact

- `src/app/App.tsx` — replaced by the new layout shell component
- `src/features/prompts/PromptListView.tsx` — adapted to render as a grid inside the content canvas
- New components added under `src/features/layout/` (or `src/shared/ui/`): `SidebarNav.tsx`, `TopAppBar.tsx`, `MainLayoutShell.tsx`
- Tailwind design tokens (colours, spacing) already defined in `styles/index.css` are used as-is; no new dependencies required
- No breaking changes to domain model, repository, or context APIs
