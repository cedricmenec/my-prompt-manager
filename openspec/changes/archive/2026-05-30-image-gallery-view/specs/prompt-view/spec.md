## MODIFIED Requirements

### Requirement: PromptView read mode displays prompt content
In read mode, `PromptView` SHALL display the prompt fields in order:
1. `title` as an `h1` heading
2. `tags` as badge chips (if any)
3. `description` as a subtitle/lead paragraph (if present)
4. For prompts with `type === 'image'` and a valid `imageUrl`: the image rendered full-width at its natural aspect ratio (`w-full h-auto`), inside a rounded container, above the Copy CTA
5. `content` rendered as Markdown inside a terminal/code-block style enclosure
6. `notes` as plain free-text below the content block (if present), in a visually distinct "Notes" section

#### Scenario: Read mode renders all populated fields
- **WHEN** `PromptView` is in read mode for a prompt with title, tags, description, content, and notes
- **THEN** all five sections are visible in the order listed above

#### Scenario: Optional sections are hidden when absent
- **WHEN** the prompt has no `tags`, `description`, or `notes`
- **THEN** those sections are not rendered

#### Scenario: Content is rendered as Markdown inside a code-block enclosure
- **WHEN** the prompt `content` contains Markdown (headers, bold, code blocks)
- **THEN** the rendered HTML appears inside a visually distinct terminal/code-block style container

#### Scenario: Image preview is shown for image-type prompt with imageUrl
- **WHEN** `PromptView` is in read mode for a prompt with `type === 'image'` and a valid `imageUrl`
- **THEN** the image is rendered full-width at its natural aspect ratio above the Copy CTA

#### Scenario: Image preview is hidden for text-type prompt
- **WHEN** `PromptView` is in read mode for a prompt with `type === 'text'`
- **THEN** no image preview section is rendered, even if `imageUrl` is set

#### Scenario: Image preview is hidden when imageUrl is absent
- **WHEN** `PromptView` is in read mode for a prompt with `type === 'image'` but no `imageUrl`
- **THEN** no image preview section is rendered
