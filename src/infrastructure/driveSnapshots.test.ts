import { describe, expect, it, vi } from 'vitest'
import { createDriveSnapshot, hashSnapshotPayload } from './driveSnapshots'
import type { GoogleDriveConfig } from './googleDriveConfig'
import type { Prompt } from '@/domain/promptSchema'

const now = '2026-06-05T12:00:00.000Z'
const prompt: Prompt = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  title: 'Snapshot',
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
    enabled: true,
    intervalMinutes: 15,
  },
}

describe('Drive snapshots', () => {
  it('hashes payloads deterministically', async () => {
    await expect(hashSnapshotPayload('same')).resolves.toBe(await hashSnapshotPayload('same'))
  })

  it('uploads prompt snapshot payloads without sensitive credentials', async () => {
    localStorage.setItem('apiKey', 'sk-test-secret')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      id: 'snapshot-1',
      name: 'snapshot.json',
    }), { status: 200 })))

    await createDriveSnapshot({
      prompts: [prompt],
      config,
      accessToken: 'oauth-token-secret',
      reason: 'manual-export',
    })

    const request = vi.mocked(fetch).mock.calls[0]?.[1] as RequestInit
    expect(String(request.body)).toContain('Prompt content')
    expect(String(request.body)).not.toContain('sk-test-secret')
    expect(String(request.body)).not.toContain('oauth-token-secret')
  })
})
