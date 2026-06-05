import { getDb } from './db'
import type { Prompt, PromptImageAsset } from '@/domain/promptSchema'

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
    data: Omit<Prompt, 'id' | 'createdAt' | 'updatedAt' | 'isFavorite'> & { isFavorite?: boolean },
  ): Promise<Prompt> {
    const db = await getDb()
    const now = new Date().toISOString()
    const prompt: Prompt = {
      isFavorite: false, // Default value
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
    const tx = db.transaction(['prompts', 'promptImageAssets'], 'readwrite')
    await tx.objectStore('prompts').put(updated)
    if (existing.imageAssetId && existing.imageAssetId !== updated.imageAssetId) {
      const prompts = await tx.objectStore('prompts').getAll()
      const stillReferenced = prompts.some(
        (storedPrompt) =>
          storedPrompt.id !== id && storedPrompt.imageAssetId === existing.imageAssetId,
      )
      if (!stillReferenced) {
        await tx.objectStore('promptImageAssets').delete(existing.imageAssetId)
      }
    }
    await tx.done
    return updated
  },

  async delete(id: string): Promise<void> {
    const db = await getDb()
    const tx = db.transaction(['prompts', 'promptImageAssets'], 'readwrite')
    await tx.objectStore('prompts').delete(id)
    const assets = await tx.objectStore('promptImageAssets').index('by-promptId').getAllKeys(id)
    await Promise.all(assets.map((assetId) => tx.objectStore('promptImageAssets').delete(assetId)))
    await tx.done
  },

  async bulkImport(prompts: Prompt[]): Promise<void> {
    const db = await getDb()
    const tx = db.transaction('prompts', 'readwrite')
    await Promise.all([...prompts.map((p) => tx.store.put(p)), tx.done])
  },

  async bulkImportWithAssets(prompts: Prompt[], assets: PromptImageAsset[]): Promise<void> {
    const db = await getDb()
    const tx = db.transaction(['prompts', 'promptImageAssets'], 'readwrite')
    await Promise.all([
      ...prompts.map((p) => tx.objectStore('prompts').put(p)),
      ...assets.map((asset) => tx.objectStore('promptImageAssets').put(asset)),
      tx.done,
    ])
  },

  async deleteAll(): Promise<void> {
    const db = await getDb()
    const tx = db.transaction(['prompts', 'promptImageAssets'], 'readwrite')
    await tx.objectStore('prompts').clear()
    await tx.objectStore('promptImageAssets').clear()
    await tx.done
  },

  async createImageAsset(
    data: Omit<PromptImageAsset, 'id' | 'createdAt'> & { id?: string; createdAt?: string },
  ): Promise<PromptImageAsset> {
    const db = await getDb()
    const asset: PromptImageAsset = {
      ...data,
      id: data.id ?? crypto.randomUUID(),
      createdAt: data.createdAt ?? new Date().toISOString(),
    }
    await db.put('promptImageAssets', asset)
    return asset
  },

  async getImageAssetById(id: string): Promise<PromptImageAsset | undefined> {
    const db = await getDb()
    return db.get('promptImageAssets', id)
  },

  async listImageAssetsByPrompt(promptId: string): Promise<PromptImageAsset[]> {
    const db = await getDb()
    return db.getAllFromIndex('promptImageAssets', 'by-promptId', promptId)
  },

  async deleteImageAsset(id: string): Promise<void> {
    const db = await getDb()
    await db.delete('promptImageAssets', id)
  },
}
