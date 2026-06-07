import { z } from 'zod'

export const PromptSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  description: z.string().optional(),
  tags: z.array(z.string()).optional().default([]),
  isFavorite: z.boolean().optional().default(false),
  type: z.enum(['text', 'image']).optional().default('text'),
  notes: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  imageUrl: z.string().url().optional(),
  imageAssetId: z.string().min(1).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export type Prompt = z.infer<typeof PromptSchema>

export const PromptImageAssetSchema = z.object({
  id: z.string().min(1),
  promptId: z.string().uuid(),
  blob: z.instanceof(Blob),
  mimeType: z.literal('image/webp'),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  sizeBytes: z.number().int().nonnegative(),
  source: z.enum(['upload', 'remote-url']),
  originalName: z.string().optional(),
  originalUrl: z.string().url().optional(),
  createdAt: z.string().datetime(),
})

export type PromptImageAsset = z.infer<typeof PromptImageAssetSchema>
