## ADDED Requirements

### Requirement: Main layout shell composes sidebar, top bar, and content canvas
The system SHALL provide a `MainLayoutShell` component that renders the `SidebarNav` on the left, and a main region on the right composed of a `TopAppBar` (sticky) above a scrollable content canvas. The shell SHALL occupy the full viewport height without overflow on the body.

#### Scenario: Shell renders all three regions
- **WHEN** the app loads
- **THEN** the sidebar, top bar, and content canvas are all visible simultaneously

#### Scenario: Content canvas scrolls independently of sidebar
- **WHEN** the user scrolls the content canvas
- **THEN** the sidebar and top bar remain in place while only the content scrolls

---

### Requirement: App.tsx delegates layout to MainLayoutShell
The system SHALL use `MainLayoutShell` in `src/app/App.tsx` as the top-level layout wrapper. The existing orchestration logic (showing editor overlay, showing detail panel) SHALL remain in `App.tsx`, passed as children or slots to the shell.

#### Scenario: App renders within the layout shell
- **WHEN** the app mounts
- **THEN** `MainLayoutShell` is the root visual container wrapping all app content
