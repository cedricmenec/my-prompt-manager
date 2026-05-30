# Proposal: Prompt Reference Images

## Summary
Add support for displaying a reference image directly on prompt cards in the Grid View. This is particularly useful for prompts designed for AI image generation (Midjourney, DALL-E, etc.).

## Problem
Currently, the prompt manager is text-only. Users who store prompts for image generation cannot see the visual results of those prompts without opening the prompt and manually checking external references. This makes it harder to quickly find a specific "look" or "style" in a large collection.

## Solution
1. Add an optional `imageUrl` field to the `Prompt` domain model.
2. Update the Markdown frontmatter parser to support this field.
3. Modify the `PromptCard` component to display the image as a "hero" element at the top of the card in Grid View.
4. Allow variable heights for images to accommodate different aspect ratios (Portrait, Landscape).
5. Provide a discrete placeholder if an image fails to load.
6. Add an input field in the Prompt Editor to let users paste an image URL.

## Scope
- **Domain**: Update `PromptSchema`.
- **UI**: Update `PromptCard` and `PromptEditor`.
- **Infrastructure**: Update `markdownParser` (if needed, Zod usually handles this if we just update the schema).

## Non-goals
- Binary image upload or hosting.
- Local image caching (rely on browser cache).
- Image editing or cropping.
