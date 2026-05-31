# Global Top Bar

## Purpose

Defines the permanent full-width top bar that spans the entire viewport width above the sidebar and content area, containing the application logo/name and the mode switcher segmented control.

## Requirements

### Requirement: Global top bar renders logo and mode switcher
The system SHALL provide a `GlobalTopBar` component rendered at the very top of the viewport, spanning the full width above the sidebar and content area. The bar SHALL contain the application logo/icon and name on the left side, and a segmented control (tab-style) on the right-center area allowing the user to switch between **Prompts** mode and **Gallery** mode. The `GlobalTopBar` SHALL always be visible — including when a prompt detail is open.

#### Scenario: Global top bar is always visible
- **WHEN** the application is rendered in any state (list, detail, editor)
- **THEN** the GlobalTopBar is visible at the top of the viewport with the logo and mode switcher

#### Scenario: Mode switcher shows two segments
- **WHEN** the GlobalTopBar is rendered
- **THEN** a segmented control with exactly two options — "Prompts" and "Gallery" — is visible

#### Scenario: Active mode segment is visually highlighted
- **WHEN** the current mode is "Prompts"
- **THEN** the "Prompts" segment appears active (e.g., filled background, accent colour) and "Gallery" appears inactive

#### Scenario: Clicking "Gallery" segment switches to gallery mode
- **WHEN** the user clicks the "Gallery" segment
- **THEN** `appView` is set to `'gallery'`, `activeFilter` is reset to `{ type: 'all' }`, and `searchQuery` is cleared

#### Scenario: Clicking "Prompts" segment switches to prompts mode
- **WHEN** the user clicks the "Prompts" segment while in gallery mode
- **THEN** `appView` is set to `'prompts'`
