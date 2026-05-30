## MODIFIED Requirements

### Requirement: Main layout shell composes sidebar, top bar, and content canvas
The system SHALL provide a `MainLayoutShell` component that renders the `SidebarNav` on the left, and a main region on the right. The `TopAppBar` SHALL be rendered above the content canvas **only when no prompt is selected**. When `PromptView` is active (a prompt is selected or being created), the `TopAppBar` SHALL be hidden and `PromptView` SHALL occupy the full main region. The shell SHALL occupy the full viewport height without overflow on the body.

#### Scenario: Shell renders sidebar, top bar, and content canvas in list state
- **WHEN** the app loads and no prompt is selected
- **THEN** the sidebar, top bar, and content canvas are all visible simultaneously

#### Scenario: TopAppBar is hidden when PromptView is active
- **WHEN** a prompt is selected (or a new prompt is being created)
- **THEN** the `TopAppBar` is not rendered and `PromptView` occupies the full main region

#### Scenario: Content canvas scrolls independently of sidebar
- **WHEN** the user scrolls the content canvas
- **THEN** the sidebar remains in place while only the content scrolls
