import { describe, it, expect } from 'vitest'
import { parseImportFile, ImportFormatError } from './importExport'

// Helper: create a File from a JS value
function makeJsonFile(content: unknown): File {
  const text = JSON.stringify(content)
  return new File([text], 'test-export.json', { type: 'application/json' })
}

function makeMalformedFile(): File {
  return new File(['not valid { json !!'], 'bad.json', { type: 'application/json' })
}

const now = new Date().toISOString()

const validPrompt = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  title: 'Test',
  content: 'Hello',
  tags: [],
  isFavorite: false,
  type: 'text',
  createdAt: now,
  updatedAt: now,
}

const invalidPrompt = {
  // missing required 'title' and 'content'
  id: '550e8400-e29b-41d4-a716-446655440001',
  tags: [],
}

describe('parseImportFile', () => {
  it('returns all prompts as valid when all entries pass schema', async () => {
    const file = makeJsonFile({
      schema: 'v1',
      exportedAt: now,
      promptCount: 1,
      prompts: [validPrompt],
    })
    const result = await parseImportFile(file)
    expect(result.valid).toHaveLength(1)
    expect(result.errors).toHaveLength(0)
    expect(result.valid[0].id).toBe(validPrompt.id)
  })

  it('separates valid and invalid prompts and reports errors', async () => {
    const file = makeJsonFile({
      schema: 'v1',
      exportedAt: now,
      promptCount: 3,
      prompts: [validPrompt, invalidPrompt, validPrompt],
    })
    const result = await parseImportFile(file)
    expect(result.valid).toHaveLength(2)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0].index).toBe(1)
    expect(result.errors[0].reason).toBeTruthy()
  })

  it('rejects with ImportFormatError for malformed JSON', async () => {
    const file = makeMalformedFile()
    await expect(parseImportFile(file)).rejects.toBeInstanceOf(ImportFormatError)
  })

  it('rejects with ImportFormatError for unknown schema version', async () => {
    const file = makeJsonFile({
      schema: 'v99',
      exportedAt: now,
      prompts: [],
    })
    await expect(parseImportFile(file)).rejects.toBeInstanceOf(ImportFormatError)
  })

  it('handles empty prompts array gracefully', async () => {
    const file = makeJsonFile({
      schema: 'v1',
      exportedAt: now,
      promptCount: 0,
      prompts: [],
    })
    const result = await parseImportFile(file)
    expect(result.valid).toHaveLength(0)
    expect(result.errors).toHaveLength(0)
  })
})
