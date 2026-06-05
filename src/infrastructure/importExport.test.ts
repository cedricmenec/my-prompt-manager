import { describe, it, expect, vi, beforeEach } from 'vitest'
import { parseImportFile, ImportFormatError, exportPromptsToJson } from './importExport'
import { DATA_SCHEMA_VERSION } from './dataMigrations'
import { promptRepository } from './promptRepository'

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
  beforeEach(() => {
    vi.restoreAllMocks()
  })

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
    expect(result.imageAssets).toHaveLength(0)
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

  it('restores exported local image asset payloads as Blobs', async () => {
    const file = makeJsonFile({
      schemaVersion: DATA_SCHEMA_VERSION,
      appVersion: '0.1.0',
      exportedAt: now,
      promptCount: 1,
      prompts: [{ ...validPrompt, type: 'image', imageAssetId: 'asset-1' }],
      imageAssets: [
        {
          id: 'asset-1',
          promptId: validPrompt.id,
          mimeType: 'image/webp',
          width: 2,
          height: 1,
          sizeBytes: 4,
          source: 'upload',
          createdAt: now,
          payloadBase64: btoa('webp'),
        },
      ],
    })

    const result = await parseImportFile(file)

    expect(result.valid).toHaveLength(1)
    expect(result.imageAssets).toHaveLength(1)
    expect(result.imageAssets[0].blob).toBeInstanceOf(Blob)
    await expect(result.imageAssets[0].blob.text()).resolves.toBe('webp')
  })

  it('reports invalid image asset payloads without rejecting valid prompts', async () => {
    const file = makeJsonFile({
      schemaVersion: DATA_SCHEMA_VERSION,
      appVersion: '0.1.0',
      exportedAt: now,
      promptCount: 1,
      prompts: [validPrompt],
      imageAssets: [{ id: 'asset-1', promptId: validPrompt.id, mimeType: 'image/png' }],
    })

    const result = await parseImportFile(file)

    expect(result.valid).toHaveLength(1)
    expect(result.imageAssets).toHaveLength(0)
    expect(result.errors.some((error) => error.reason.includes('Image asset'))).toBe(true)
  })
})

describe('exportPromptsToJson', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('exports image assets separately from prompt records', async () => {
    const prompt = { ...validPrompt, type: 'image' as const, imageAssetId: 'asset-1' }
    vi.spyOn(promptRepository, 'getImageAssetById').mockResolvedValue({
      id: 'asset-1',
      promptId: prompt.id,
      blob: new Blob(['webp'], { type: 'image/webp' }),
      mimeType: 'image/webp',
      width: 2,
      height: 1,
      sizeBytes: 4,
      source: 'upload',
      createdAt: now,
    })
    const click = vi.fn()
    const appendChild = vi
      .spyOn(document.body, 'appendChild')
      .mockImplementation((node) => node)
    const removeChild = vi
      .spyOn(document.body, 'removeChild')
      .mockImplementation((node) => node)
    let exportedJson: Promise<string> | undefined
    vi.spyOn(document, 'createElement').mockReturnValue({
      click,
      set href(_value: string) {},
      set download(_value: string) {},
    } as unknown as HTMLAnchorElement)
    vi.spyOn(URL, 'createObjectURL').mockImplementation((blob) => {
      exportedJson = (blob as Blob).text()
      return 'blob:test'
    })
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined)

    await exportPromptsToJson([prompt])

    const parsed = JSON.parse(await exportedJson!) as Record<string, unknown>
    expect(parsed.prompts).toEqual([prompt])
    expect((parsed.imageAssets as unknown[])).toHaveLength(1)
    expect(JSON.stringify(parsed.prompts)).not.toContain('payloadBase64')
    expect(click).toHaveBeenCalled()
    expect(appendChild).toHaveBeenCalled()
    expect(removeChild).toHaveBeenCalled()
  })
})

