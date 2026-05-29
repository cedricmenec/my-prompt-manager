import { describe, it, expect, beforeEach } from 'vitest'
import 'fake-indexeddb/auto' // sets up all IDB class globals
import { IDBFactory } from 'fake-indexeddb'
import { promptRepository, PromptNotFoundError } from './promptRepository'
import { resetDb } from './db'

const baseData = {
  title: 'Test Prompt',
  content: 'Some content',
  tags: [] as string[],
}

beforeEach(() => {
  // Replace the factory instance to get a fresh empty database per test
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

describe('promptRepository.bulkImport', () => {
  it('stores all provided prompts', async () => {
    const now = new Date().toISOString()
    const prompts = Array.from({ length: 5 }, (_, i) => ({
      id: crypto.randomUUID(),
      title: `Prompt ${i}`,
      content: `Content ${i}`,
      tags: [] as string[],
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
