import { describe, it, expect } from 'vitest'
import { parseMarkdown, serializeMarkdown } from './markdownParser'
import type { Prompt } from './promptSchema'

const validPrompt: Prompt = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  title: 'My Prompt',
  content: 'Write a story about a robot.',
  tags: [],
  isFavorite: false,
  type: 'text',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

const validMarkdown = `---
id: 550e8400-e29b-41d4-a716-446655440000
title: My Prompt
tags: []
createdAt: '2026-01-01T00:00:00.000Z'
updatedAt: '2026-01-01T00:00:00.000Z'
---
Write a story about a robot.
`

describe('parseMarkdown', () => {
  it('parses valid frontmatter and returns a Prompt', () => {
    const result = parseMarkdown(validMarkdown)
    expect(result.error).toBeNull()
    expect(result.data?.id).toBe('550e8400-e29b-41d4-a716-446655440000')
    expect(result.data?.title).toBe('My Prompt')
    expect(result.data?.content).toBe('Write a story about a robot.')
  })

  it('returns error when no frontmatter delimiters present', () => {
    const result = parseMarkdown('Just plain markdown without frontmatter')
    expect(result.data).toBeNull()
    expect(result.error).not.toBeNull()
  })

  it('returns error when required fields are missing', () => {
    const noTitle = `---
id: 550e8400-e29b-41d4-a716-446655440000
createdAt: '2026-01-01T00:00:00.000Z'
updatedAt: '2026-01-01T00:00:00.000Z'
---
Some content.
`
    const result = parseMarkdown(noTitle)
    expect(result.data).toBeNull()
    expect(result.error).not.toBeNull()
  })

  it('accepts and strips legacy model frontmatter', () => {
    const legacy = `---
id: 550e8400-e29b-41d4-a716-446655440000
title: My Prompt
model: gpt-4o
createdAt: '2026-01-01T00:00:00.000Z'
updatedAt: '2026-01-01T00:00:00.000Z'
---
Content here.
`
    const result = parseMarkdown(legacy)
    expect(result.error).toBeNull()
    expect(result.data).not.toBeNull()
    expect((result.data as Record<string, unknown>)['model']).toBeUndefined()
  })

  it('strips unknown extra fields (Zod strip mode)', () => {
    const withExtra = `---
id: 550e8400-e29b-41d4-a716-446655440000
title: My Prompt
tags: []
createdAt: '2026-01-01T00:00:00.000Z'
updatedAt: '2026-01-01T00:00:00.000Z'
custom_field: foo
---
Content here.
`
    const result = parseMarkdown(withExtra)
    expect(result.error).toBeNull()
    expect(result.data).not.toBeNull()
    expect((result.data as Record<string, unknown>)['custom_field']).toBeUndefined()
  })
})

describe('serializeMarkdown', () => {
  it('produces a string with --- delimiters', () => {
    const output = serializeMarkdown(validPrompt)
    expect(output).toMatch(/^---\n/)
    expect(output).toContain('\n---\n')
  })

  it('roundtrips: serialize then parse returns the original prompt', () => {
    const serialized = serializeMarkdown(validPrompt)
    const parsed = parseMarkdown(serialized)
    expect(parsed.error).toBeNull()
    expect(parsed.data).toEqual(validPrompt)
  })

  it('roundtrips a prompt with multi-line notes', () => {
    const withNotes: Prompt = {
      ...validPrompt,
      notes: 'Line one.\nLine two.\nLine three.',
    }
    const serialized = serializeMarkdown(withNotes)
    const parsed = parseMarkdown(serialized)
    expect(parsed.error).toBeNull()
    expect(parsed.data?.notes).toBe('Line one.\nLine two.\nLine three.')
  })

  it('omits legacy model when serializing', () => {
    const serialized = serializeMarkdown({
      ...validPrompt,
      model: 'gpt-4o',
    } as Prompt & { model: string })

    expect(serialized).not.toContain('model:')
  })

  it('preserves imageUrl and omits local image binary payloads', () => {
    const imagePrompt: Prompt = {
      ...validPrompt,
      type: 'image',
      imageUrl: 'https://example.com/reference.png',
      imageAssetId: 'asset-1',
    }
    const serialized = serializeMarkdown(imagePrompt)

    expect(serialized).toContain('imageUrl: https://example.com/reference.png')
    expect(serialized).toContain('imageAssetId: asset-1')
    expect(serialized).not.toContain('payloadBase64')
    expect(serialized).not.toContain('data:image/')
  })
})
