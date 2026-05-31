## MODIFIED Requirements

### Requirement: Main layout shell composes GlobalTopBar, sidebar, and content canvas
The system SHALL provide a `MainLayoutShell` component that renders a `GlobalTopBar` spanning the full viewport width at the very top, then below it: `SidebarNav` on the left and a main region on the right. The `TopAppBar` (contextual search bar) SHALL be rendered inside the main region above the content canvas only when no prompt detail is active. When `PromptView` or `ImagePromptView` is active, the contextual `TopAppBar` SHALL be hidden and the detail view SHALL occupy the full main region. The `hideTopBar` prop is removed — visibility of the contextual top bar is determined by the active view, not by a prop. The shell SHALL occupy the full viewport height without overflow on the body.

#### Scenario: GlobalTopBar is always visible
- **WHEN** the app is rendered in any state
- **THEN** the GlobalTopBar is rendered at the very top spanning full width, above both sidebar and content

#### Scenario: Shell renders sidebar, contextual top bar, and content canvas in list state
- **WHEN** the app loads and no prompt is selected
- **THEN** the sidebar, contextual TopAppBar, and content canvas are all visible simultaneously

#### Scenario: Contextual TopAppBar is hidden when PromptView is active
- **WHEN** a prompt is selected and appView is 'prompts'
- **THEN** the contextual TopAppBar is not rendered and PromptView occupies the full main region

#### Scenario: Contextual TopAppBar is hidden when ImagePromptView is active
- **WHEN** a prompt is selected and appView is 'gallery'
- **THEN** the contextual TopAppBar is not rendered and ImagePromptView occupies the full main region

#### Scenario: Content canvas scrolls independently of sidebar
- **WHEN** the user scrolls the content canvas
- **THEN** the sidebar remains in place while only the content scrolls

## REMOVED Requirements

### Requirement: App.tsx delegates layout to MainLayoutShell
**Reason**: The `hideTopBar` prop pattern is replaced — `App.tsx` no longer passes a prop to control top bar visibility; the contextual bar visibility is determined by the active view state inside the shell or App.
**Migration**: Remove `hideTopBar` prop usage from `App.tsx`. Visibility of the contextual `TopAppBar` is now driven by `selectedPromptId` and `viewMode` read directly from `PromptsContext` inside the shell or App.
