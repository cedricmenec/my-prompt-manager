## ADDED Requirements

### Requirement: MagicInput combines input with magic wand icon
The system SHALL provide a reusable `MagicInput` component that renders either a single-line `<input>` or a multiline `<textarea>` with an integrated magic wand icon button positioned inside the field on the right side.

#### Scenario: Single-line variant renders input element
- **WHEN** `MagicInput` is rendered with `variant="single"`
- **THEN** the component renders an `<input type="text">` element
- **AND** a magic wand icon button is positioned inside the input on the right side

#### Scenario: Multi-line variant renders textarea element
- **WHEN** `MagicInput` is rendered with `variant="multi"`
- **THEN** the component renders a `<textarea>` element
- **AND** a magic wand icon button is positioned inside the textarea on the right side

#### Scenario: Default variant is single
- **WHEN** `MagicInput` is rendered without a `variant` prop
- **THEN** the component defaults to `variant="single"`

---

### Requirement: Magic wand icon triggers AI action
The magic wand icon SHALL be a clickable button that invokes the `onMagicAction` callback when clicked. The click MUST NOT trigger any native form submission or input blur behavior.

#### Scenario: Clicking the icon calls onMagicAction
- **WHEN** the user clicks the magic wand icon button
- **THEN** the `onMagicAction` callback is invoked
- **AND** the click does not trigger form submission or input blur

#### Scenario: Icon click is disabled during generation
- **WHEN** `isGenerating` is `true` and the user clicks the magic wand icon
- **THEN** the `onMagicAction` callback is NOT invoked
- **AND** the icon button is visually disabled

---

### Requirement: Generating state shows pulsing animation
When `isGenerating` is `true`, the magic wand icon SHALL display a pulsing animation with a subtle color shift to provide visual feedback that a generation is in progress. The input field itself MUST NOT pulse — only the icon.

#### Scenario: Generating state applies pulsing animation to icon
- **WHEN** `isGenerating` is `true`
- **THEN** the magic wand icon pulses with a subtle color shift animation
- **AND** the animation is smooth and modern, using CSS keyframes

#### Scenario: Idle state shows static icon
- **WHEN** `isGenerating` is `false`
- **THEN** the magic wand icon is displayed without animation
- **AND** the icon uses the default accent color

---

### Requirement: MagicInput passes through native input/textarea props
`MagicInput` SHALL forward all standard HTML input or textarea attributes (e.g., `placeholder`, `value`, `onChange`, `disabled`, `aria-*`) to the underlying element, allowing it to be used as a drop-in replacement for native inputs.

#### Scenario: Native props are forwarded to input
- **WHEN** `MagicInput` is rendered with `variant="single"` and props like `placeholder`, `value`, `onChange`
- **THEN** the underlying `<input>` receives all native attributes

#### Scenario: Native props are forwarded to textarea
- **WHEN** `MagicInput` is rendered with `variant="multi"` and props like `placeholder`, `value`, `onChange`, `rows`
- **THEN** the underlying `<textarea>` receives all native attributes

#### Scenario: Disabled prop disables both field and icon
- **WHEN** `MagicInput` receives `disabled={true}`
- **THEN** both the input/textarea and the magic wand icon are disabled

---

### Requirement: MagicInput supports dark and light mode
The component SHALL use the existing CSS custom property system for colors, ensuring it renders correctly in both light and dark mode without any mode-specific logic in the component.

#### Scenario: Light mode renders with correct colors
- **WHEN** the system is in light mode
- **THEN** the icon and input field use light-mode-compatible colors

#### Scenario: Dark mode renders with correct colors
- **WHEN** the system is in dark mode
- **THEN** the icon and input field use dark-mode-compatible colors

---

### Requirement: MagicInput is accessible
The magic wand icon button SHALL include appropriate ARIA attributes for screen reader compatibility.

#### Scenario: Icon button has accessible label
- **WHEN** `MagicInput` is rendered
- **THEN** the magic wand icon button has an `aria-label` attribute with a descriptive label (e.g., "Generate with AI")

#### Scenario: Icon button is keyboard accessible
- **WHEN** the user focuses the magic wand icon button
- **THEN** the button is visually focused and can be activated with Enter or Space

#### Scenario: Generating state is communicated to assistive technology
- **WHEN** `isGenerating` is `true`
- **THEN** the magic wand icon button has `aria-disabled="true"` or equivalent disabled state
