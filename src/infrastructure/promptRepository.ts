import { getDb } from './db'
import type { Prompt } from '@/domain/promptSchema'

export class PromptNotFoundError extends Error {
  constructor(id: string) {
    super(`Prompt not found: ${id}`)
    this.name = 'PromptNotFoundError'
  }
}

export const promptRepository = {
  async getAll(): Promise<Prompt[]> {
    const db = await getDb()
    const all = await db.getAllFromIndex('prompts', 'by-updatedAt')
    return all.reverse() // index is ascending; we want newest first
  },

  async getById(id: string): Promise<Prompt | undefined> {
    const db = await getDb()
    return db.get('prompts', id)
  },

  async create(
    data: Omit<Prompt, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Prompt> {
    const db = await getDb()
    const now = new Date().toISOString()
    const prompt: Prompt = {
      ...data,
      tags: data.tags ?? [],
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    }
    await db.put('prompts', prompt)
    return prompt
  },

  async update(
    id: string,
    data: Partial<Omit<Prompt, 'id' | 'createdAt'>>,
  ): Promise<Prompt> {
    const db = await getDb()
    const existing = await db.get('prompts', id)
    if (!existing) throw new PromptNotFoundError(id)
    const updated: Prompt = {
      ...existing,
      ...data,
      id,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    }
    await db.put('prompts', updated)
    return updated
  },

  async delete(id: string): Promise<void> {
    const db = await getDb()
    await db.delete('prompts', id)
  },

  async bulkImport(prompts: Prompt[]): Promise<void> {
    const db = await getDb()
    const tx = db.transaction('prompts', 'readwrite')
    await Promise.all([...prompts.map((p) => tx.store.put(p)), tx.done])
  },
}
