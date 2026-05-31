# Image Prompt View

## Purpose

Defines the dedicated detail view for image-generation prompts, shown when a prompt with `type === 'image'` is selected in Gallery mode. Displays the image prominently at the top, followed by prompt metadata, and provides Back and Edit actions.

## Requirements

### Requirement: Image prompt view displays prompt image prominently
The system SHALL provide an `ImagePromptView` component that is rendered when the user selects a prompt with `type === 'image'` while in Gallery mode (`appView === 'gallery'`). The view SHALL display the prompt's `imageUrl` image at large size (max height approximately 60% of the viewport height) with `object-contain` scaling, above the prompt text content and metadata. If no `imageUrl` is set, a placeholder SHALL be shown in place of the image.

#### Scenario: Image is displayed prominently at the top
- **WHEN** the user opens an image prompt from the gallery
- **THEN** the image is displayed at the top of the view at large size (max ~60vh) with preserved aspect ratio

#### Scenario: Placeholder shown when no imageUrl
- **WHEN** the selected image prompt has no `imageUrl` set
- **THEN** a placeholder element is shown in the image area indicating no image is available

#### Scenario: Prompt content is displayed below the image
- **WHEN** the ImagePromptView is rendered
- **THEN** the prompt title, content text, description (if any), tags, and model (if any) are displayed below the image section

---

### Requirement: Image prompt view provides navigation and edit actions
The `ImagePromptView` SHALL display a "Back to Gallery" button that closes the detail view and returns the user to the Gallery view. It SHALL also display an "Edit" button that opens the prompt editor (`PromptEditor`) for the selected prompt.

#### Scenario: Back button returns to gallery
- **WHEN** the user clicks "Back to Gallery" in ImagePromptView
- **THEN** the selected prompt is deselected and the Gallery masonry view is displayed again

#### Scenario: Edit button opens prompt editor
- **WHEN** the user clicks "Edit" in ImagePromptView
- **THEN** the prompt editor opens for the selected image prompt

---

### Requirement: Image prompt view is only reachable from Gallery mode
The `ImagePromptView` SHALL only be rendered when `appView === 'gallery'` and a prompt is selected. Selecting a prompt while in Prompts mode (`appView === 'prompts'`) SHALL continue to open the standard `PromptView`.

#### Scenario: Selecting a prompt in Gallery mode opens ImagePromptView
- **WHEN** `appView` is `'gallery'` and the user clicks a gallery card
- **THEN** `ImagePromptView` is rendered for the selected prompt

#### Scenario: Selecting a prompt in Prompts mode opens PromptView
- **WHEN** `appView` is `'prompts'` and the user clicks a prompt card or row
- **THEN** the standard `PromptView` is rendered for the selected prompt
