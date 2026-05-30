import { z } from 'zod'

export const PromptSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  description: z.string().optional(),
  tags: z.array(z.string()).optional().default([]),
  isFavorite: z.boolean().optional().default(false),
  notes: z.string().optional(),
  model: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
  imageUrl: z.string().url().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export type Prompt = z.infer<typeof PromptSchema>
