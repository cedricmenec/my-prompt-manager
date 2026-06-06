import { describe, it, expect, beforeEach } from 'vitest'
import 'fake-indexeddb/auto' // sets up all IDB class globals
import { IDBFactory } from 'fake-indexeddb'
import { promptRepository, PromptNotFoundError } from './promptRepository'
import { initDb, resetDb } from './db'

const baseData = {
  title: 'Test Prompt',
  content: 'Some content',
  tags: [] as string[],
  type: 'text' as const,
}

beforeEach(() => {
  // Replace the factory instance to get a fresh empty database per test
  globalThis.structuredClone = <T>(value: T) => value
  globalThis.indexedDB = new IDBFactory()
  resetDb()
})

describe('promptRepository.create', () => {
  it('returns a prompt with id, createdAt, updatedAt', async () => {
    const prompt = await promptRepository.create(baseData)
    expect(prompt.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    )
    expect(prompt.createdAt).toBeTruthy()
    expect(prompt.updatedAt).toBeTruthy()
    expect(prompt.title).toBe('Test Prompt')
  })
})

describe('promptRepository.getById', () => {
  it('returns the created prompt', async () => {
    const created = await promptRepository.create(baseData)
    const fetched = await promptRepository.getById(created.id)
    expect(fetched).toEqual(created)
  })

  it('returns undefined for unknown id', async () => {
    const result = await promptRepository.getById('does-not-exist')
    expect(result).toBeUndefined()
  })
})

describe('promptRepository.getAll', () => {
  it('returns empty array when no prompts', async () => {
    const all = await promptRepository.getAll()
    expect(all).toEqual([])
  })

  it('returns all prompts sorted by updatedAt descending', async () => {
    const p1 = await promptRepository.create({ ...baseData, title: 'P1' })
    await new Promise((r) => setTimeout(r, 5))
    const p2 = await promptRepository.create({ ...baseData, title: 'P2' })
    await new Promise((r) => setTimeout(r, 5))
    const p3 = await promptRepository.create({ ...baseData, title: 'P3' })
    const all = await promptRepository.getAll()
    expect(all.map((p) => p.title)).toEqual([p3.title, p2.title, p1.title])
  })
})

describe('promptRepository.update', () => {
  it('updates fields and refreshes updatedAt', async () => {
    const created = await promptRepository.create(baseData)
    await new Promise((r) => setTimeout(r, 5))
    const updated = await promptRepository.update(created.id, { title: 'Updated Title' })
    expect(updated.title).toBe('Updated Title')
    expect(updated.updatedAt).not.toBe(created.updatedAt)
    expect(updated.createdAt).toBe(created.createdAt)
  })

  it('throws PromptNotFoundError for unknown id', async () => {
    await expect(
      promptRepository.update('unknown-id', { title: 'x' }),
    ).rejects.toBeInstanceOf(PromptNotFoundError)
  })
})

describe('promptRepository.delete', () => {
  it('removes the prompt from the store', async () => {
    const created = await promptRepository.create(baseData)
    await promptRepository.delete(created.id)
    const fetched = await promptRepository.getById(created.id)
    expect(fetched).toBeUndefined()
  })

  it('is idempotent — deleting unknown id does not throw', async () => {
    await expect(promptRepository.delete('nonexistent')).resolves.toBeUndefined()
  })
})

describe('promptRepository image assets', () => {
  it('stores and retrieves a WebP Blob image asset', async () => {
    const prompt = await promptRepository.create({ ...baseData, type: 'image' })
    const blob = new Blob(['webp-data'], { type: 'image/webp' })
    const asset = await promptRepository.createImageAsset({
      promptId: prompt.id,
      blob,
      mimeType: 'image/webp',
      width: 320,
      height: 240,
      sizeBytes: blob.size,
      source: 'upload',
      originalName: 'reference.png',
    })

    const fetched = await promptRepository.getImageAssetById(asset.id)
    expect(fetched?.blob).toBeInstanceOf(Blob)
    expect(await fetched?.blob.text()).toBe('webp-data')
    expect(fetched?.mimeType).toBe('image/webp')
  })

  it('lists image assets by prompt id', async () => {
    const prompt = await promptRepository.create({ ...baseData, type: 'image' })
    const blob = new Blob(['asset'], { type: 'image/webp' })
    await promptRepository.createImageAsset({
      promptId: prompt.id,
      blob,
      mimeType: 'image/webp',
      width: 1,
      height: 1,
      sizeBytes: blob.size,
      source: 'upload',
    })

    const assets = await promptRepository.listImageAssetsByPrompt(prompt.id)
    expect(assets).toHaveLength(1)
    expect(assets[0].promptId).toBe(prompt.id)
  })

  it('deletes the previous local asset when a prompt replaces it', async () => {
    const prompt = await promptRepository.create({ ...baseData, type: 'image' })
    const first = await promptRepository.createImageAsset({
      promptId: prompt.id,
      blob: new Blob(['first'], { type: 'image/webp' }),
      mimeType: 'image/webp',
      width: 1,
      height: 1,
      sizeBytes: 5,
      source: 'upload',
    })
    const second = await promptRepository.createImageAsset({
      promptId: prompt.id,
      blob: new Blob(['second'], { type: 'image/webp' }),
      mimeType: 'image/webp',
      width: 1,
      height: 1,
      sizeBytes: 6,
      source: 'upload',
    })

    await promptRepository.update(prompt.id, { imageAssetId: first.id })
    await promptRepository.update(prompt.id, { imageAssetId: second.id })

    await expect(promptRepository.getImageAssetById(first.id)).resolves.toBeUndefined()
    await expect(promptRepository.getImageAssetById(second.id)).resolves.toBeTruthy()
  })

  it('deletes owned assets when deleting a prompt', async () => {
    const prompt = await promptRepository.create({ ...baseData, type: 'image' })
    const asset = await promptRepository.createImageAsset({
      promptId: prompt.id,
      blob: new Blob(['asset'], { type: 'image/webp' }),
      mimeType: 'image/webp',
      width: 1,
      height: 1,
      sizeBytes: 5,
      source: 'upload',
    })
    await promptRepository.update(prompt.id, { imageAssetId: asset.id })

    await promptRepository.delete(prompt.id)

    await expect(promptRepository.getImageAssetById(asset.id)).resolves.toBeUndefined()
  })
})

describe('promptRepository.bulkImport', () => {
  it('stores all provided prompts', async () => {
    const now = new Date().toISOString()
    const prompts = Array.from({ length: 5 }, (_, i) => ({
      id: crypto.randomUUID(),
      title: `Prompt ${i}`,
      content: `Content ${i}`,
      tags: [] as string[],
      isFavorite: false,
      type: 'text' as const,
      createdAt: now,
      updatedAt: now,
    }))
    await promptRepository.bulkImport(prompts)
    const all = await promptRepository.getAll()
    expect(all.length).toBeGreaterThanOrEqual(5)
    for (const p of prompts) {
      expect(all.some((a) => a.id === p.id)).toBe(true)
    }
  })
})

describe('promptRepository.deleteAll', () => {
  it('removes all prompts from the store', async () => {
    await promptRepository.create(baseData)
    await promptRepository.create({ ...baseData, title: 'Second' })
    await promptRepository.deleteAll()
    const all = await promptRepository.getAll()
    expect(all).toEqual([])
  })

  it('is a no-op on an empty store', async () => {
    await expect(promptRepository.deleteAll()).resolves.toBeUndefined()
  })
})

describe('DB_VERSION and _meta store', () => {
  it('DB_VERSION is 5', async () => {
    const { DB_VERSION } = await import('./db')
    expect(DB_VERSION).toBe(5)
  })

  it('_meta store exists after initDb()', async () => {
    const db = await initDb()
    expect(db.objectStoreNames.contains('_meta')).toBe(true)
  })

  it('promptImageAssets store exists after initDb()', async () => {
    const db = await initDb()
    expect(db.objectStoreNames.contains('promptImageAssets')).toBe(true)
  })

  it('_meta contains schemaVersion after initDb()', async () => {
    const db = await initDb()
    const entry = await db.get('_meta', 'schemaVersion')
    expect(typeof entry?.value).toBe('number')
  })
})

