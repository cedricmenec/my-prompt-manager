import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  GoogleDriveError,
  listJsonFilesInDriveFolder,
  testDriveFolderAccess,
  uploadJsonToDriveFolder,
} from './googleDriveClient'

describe('Google Drive REST adapter', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('tests folder access', async () => {
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({
        id: 'probe-1',
        name: '.byo-prompt-manager-folder-test.json',
      }), { status: 200 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 })))

    await expect(testDriveFolderAccess('token', 'folder_123456')).resolves.toEqual({
      id: 'folder_123456',
      name: 'Configured folder',
    })
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('upload/drive/v3/files'), expect.objectContaining({
      method: 'POST',
    }))
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/drive/v3/files/probe-1'), expect.objectContaining({
      method: 'DELETE',
    }))
  })

  it('maps authorization errors to actionable errors', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      error: { message: 'Invalid Credentials' },
    }), { status: 401 })))

    await expect(listJsonFilesInDriveFolder('token', 'folder_123456')).rejects.toMatchObject({
      kind: 'authorization',
      recovery: expect.stringContaining('Reconnect'),
    } satisfies Partial<GoogleDriveError>)
  })

  it('uploads JSON with metadata and payload', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      id: 'file-1',
      name: 'export.json',
      modifiedTime: '2026-06-05T12:00:00.000Z',
    }), { status: 200 })))

    const file = await uploadJsonToDriveFolder({
      accessToken: 'token',
      folderId: 'folder_123456',
      fileName: 'export.json',
      json: '{"prompts":[]}',
    })

    expect(file.id).toBe('file-1')
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('upload/drive/v3/files'), expect.objectContaining({
      method: 'POST',
    }))
  })
})
