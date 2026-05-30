# Design: Prompt Reference Images

## Data Model
The `Prompt` object will include a new optional property:

```typescript
imageUrl?: string; // Valid URL pointing to a public image
```

This will be serialized into the YAML frontmatter:

```yaml
---
title: "Cyberpunk City"
imageUrl: "https://example.com/image.jpg"
---
```

## UI Components

### PromptCard (Grid View)
- If `imageUrl` is present:
    - Display the image at the top of the card.
    - Use CSS `object-cover` to fill the width.
    - Set a `max-height` (e.g., `max-h-64`) to prevent extremely long cards, but allow it to be `h-auto` up to that limit.
    - Implement an `onError` handler on the `<img>` tag to show a fallback placeholder.
- The card remains clickable; clicking the image has the same effect as clicking the card (opens/selects the prompt).

### Fallback Placeholder
- Use a `div` with `bg-primary-bg` and a subtle bordure.
- Potentially show a "broken image" icon or just a clean empty state in the brand primary color.

### Grid Layout
- Ensure the `grid` in `PromptListView` handles variable card heights gracefully. While Tailwind's `grid-cols` usually creates rows with equal height, we might want to check if a masonry layout is desired or if standard equal-height rows are acceptable.
- *Decision*: For now, stick to standard grid rows for simplicity, with cards growing to match the tallest in the row.

### Prompt Editor
- Add a field labeled "Reference Image URL" or "Image URL".
- Type: `url` input.
- Help text: "Paste a public URL to display an image on this prompt card."

## Technical Integration
1. **Schema**: Update `src/domain/promptSchema.ts`.
2. **Components**:
    - `src/features/prompts/PromptCard.tsx`: Add logic for `imageUrl`.
    - `src/features/prompts/PromptEditor.tsx`: Add form field and state management.
