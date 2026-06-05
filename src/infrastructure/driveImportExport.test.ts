import { describe, expect, it, vi, beforeEach } from 'vitest'
import { exportPromptsToDrive, listDriveImportCandidates } from './driveImportExport'
import type { GoogleDriveConfig } from './googleDriveConfig'
import type { Prompt } from '@/domain/promptSchema'

const now = '2026-06-05T12:00:00.000Z'
const prompt: Prompt = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  title: 'Drive export',
  content: 'Prompt content',
  tags: [],
  isFavorite: false,
  type: 'text',
  createdAt: now,
  updatedAt: now,
}

const config: GoogleDriveConfig = {
  clientId: '123-abc.apps.googleusercontent.com',
  folderId: 'folder_123456',
  snapshots: {
    enabled: false,
    intervalMinutes: 15,
  },
}

vi.mock('./googleDriveAuth', () => ({
  getGoogleDriveAccessToken: vi.fn(() => 'token'),
  markGoogleDriveSessionExpired: vi.fn(),
}))

describe('Drive import/export orchestration', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('uploads the existing export envelope to Drive without sensitive token values', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      id: 'file-1',
      name: 'byo-prompts.json',
    }), { status: 200 })))

    await exportPromptsToDrive([prompt], config)

    const request = vi.mocked(fetch).mock.calls[0]?.[1] as RequestInit
    expect(String(request.body)).toContain('Prompt content')
    expect(String(request.body)).not.toContain('token')
  })

  it('lists Drive import candidates and excludes snapshot files', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      files: [
        { id: 'export-1', name: 'byo-prompts-2026-06-05.json' },
        { id: 'snapshot-1', name: 'byo-prompts-snapshot-automatic-2026.json' },
      ],
    }), { status: 200 })))

    await expect(listDriveImportCandidates(config)).resolves.toEqual([
      { id: 'export-1', name: 'byo-prompts-2026-06-05.json' },
    ])
  })
})
