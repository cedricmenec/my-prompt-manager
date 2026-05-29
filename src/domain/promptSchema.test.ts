import { describe, it, expect } from 'vitest'
import { PromptSchema } from './promptSchema'

const validPrompt = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  title: 'My Prompt',
  content: 'Write a story about a robot.',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

describe('PromptSchema', () => {
  it('accepts a valid prompt with required fields', () => {
    const result = PromptSchema.safeParse(validPrompt)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.tags).toEqual([])
    }
  })

  it('accepts a valid prompt with all optional fields', () => {
    const result = PromptSchema.safeParse({
      ...validPrompt,
      description: 'A creative writing prompt',
      tags: ['creative', 'fiction'],
      model: 'gpt-4o',
      temperature: 0.8,
    })
    expect(result.success).toBe(true)
  })

  it('fails when title is missing', () => {
    const { title: _t, ...withoutTitle } = validPrompt
    const result = PromptSchema.safeParse(withoutTitle)
    expect(result.success).toBe(false)
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path[0])
      expect(paths).toContain('title')
    }
  })

  it('fails when title is empty string', () => {
    const result = PromptSchema.safeParse({ ...validPrompt, title: '' })
    expect(result.success).toBe(false)
  })

  it('fails when temperature is above 2', () => {
    const result = PromptSchema.safeParse({ ...validPrompt, temperature: 3 })
    expect(result.success).toBe(false)
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path[0])
      expect(paths).toContain('temperature')
    }
  })

  it('fails when temperature is below 0', () => {
    const result = PromptSchema.safeParse({ ...validPrompt, temperature: -0.1 })
    expect(result.success).toBe(false)
  })
})
