import { describe, expect, it, beforeEach } from 'vitest'
import {
  DEFAULT_SNAPSHOT_INTERVAL_MINUTES,
  loadGoogleDriveConfig,
  parseDriveFolderId,
  saveGoogleDriveConfig,
  validateDriveClientId,
  validateSnapshotInterval,
} from './googleDriveConfig'

describe('Google Drive configuration', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('parses Google Drive folder URLs and plain folder IDs', () => {
    expect(parseDriveFolderId('https://drive.google.com/drive/folders/abcDEF_123456')).toBe('abcDEF_123456')
    expect(parseDriveFolderId('abcDEF_123456')).toBe('abcDEF_123456')
  })

  it('rejects invalid folder input', () => {
    expect(parseDriveFolderId('not a folder')).toBeNull()
    expect(parseDriveFolderId('')).toBeNull()
  })

  it('validates browser OAuth client IDs and snapshot intervals', () => {
    expect(validateDriveClientId('123-abc.apps.googleusercontent.com')).toBeNull()
    expect(validateDriveClientId('secret-value')).toContain('OAuth Client ID')
    expect(validateSnapshotInterval(15)).toBeNull()
    expect(validateSnapshotInterval(1)).toContain('interval')
  })

  it('persists only non-sensitive Drive configuration', () => {
    saveGoogleDriveConfig({
      clientId: '123-abc.apps.googleusercontent.com',
      folderId: 'folder_123456',
      snapshots: {
        enabled: true,
        intervalMinutes: 15,
      },
      accessToken: 'token',
      clientSecret: 'secret',
    } as never)

    const raw = localStorage.getItem('googleDriveConfig') ?? ''
    expect(raw).not.toContain('token')
    expect(raw).not.toContain('secret')
    expect(loadGoogleDriveConfig().snapshots.intervalMinutes).toBe(DEFAULT_SNAPSHOT_INTERVAL_MINUTES)
  })
})
