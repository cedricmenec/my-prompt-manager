import { describe, it, expect } from 'vitest'
import { parseImportFile, ImportFormatError } from './importExport'
import { DATA_SCHEMA_VERSION } from './dataMigrations'

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
      schemaVersion: DATA_SCHEMA_VERSION,
      appVersion: '0.1.0',
      exportedAt: now,
      promptCount: 1,
      prompts: [validPrompt],
    })
    const result = await parseImportFile(file)
    expect(result.valid).toHaveLength(1)
    expect(result.errors).toHaveLength(0)
    expect(result.valid[0].id).toBe(validPrompt.id)
    expect(result.migrationWarning).toBeUndefined()
  })

  it('separates valid and invalid prompts and reports errors', async () => {
    const file = makeJsonFile({
      schemaVersion: DATA_SCHEMA_VERSION,
      appVersion: '0.1.0',
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

  it('rejects with ImportFormatError when neither schemaVersion nor schema is present', async () => {
    const file = makeJsonFile({
      exportedAt: now,
      prompts: [],
    })
    await expect(parseImportFile(file)).rejects.toBeInstanceOf(ImportFormatError)
  })

  it('rejects with ImportFormatError when schemaVersion exceeds current version', async () => {
    const file = makeJsonFile({
      schemaVersion: DATA_SCHEMA_VERSION + 1,
      appVersion: '99.0.0',
      exportedAt: now,
      prompts: [],
    })
    await expect(parseImportFile(file)).rejects.toBeInstanceOf(ImportFormatError)
  })

  it('handles empty prompts array gracefully', async () => {
    const file = makeJsonFile({
      schemaVersion: DATA_SCHEMA_VERSION,
      appVersion: '0.1.0',
      exportedAt: now,
      promptCount: 0,
      prompts: [],
    })
    const result = await parseImportFile(file)
    expect(result.valid).toHaveLength(0)
    expect(result.errors).toHaveLength(0)
  })

  it('treats legacy schema "v1" file as schemaVersion 1', async () => {
    const file = makeJsonFile({
      schema: 'v1',
      exportedAt: now,
      promptCount: 1,
      prompts: [validPrompt],
    })
    // schemaVersion 1 == DATA_SCHEMA_VERSION (1), so no migration warning
    const result = await parseImportFile(file)
    expect(result.valid).toHaveLength(1)
    expect(result.migrationWarning).toBeUndefined()
  })

  it('sets migrationWarning when file has older schemaVersion', async () => {
    // Only meaningful when DATA_SCHEMA_VERSION > 1; simulate by using a value lower than current
    if (DATA_SCHEMA_VERSION <= 1) {
      // Cannot test migration with current version = 1 and no older version
      return
    }
    const file = makeJsonFile({
      schemaVersion: DATA_SCHEMA_VERSION - 1,
      appVersion: '0.0.9',
      exportedAt: now,
      prompts: [],
    })
    const result = await parseImportFile(file)
    expect(result.migrationWarning).toBeTruthy()
  })
})

