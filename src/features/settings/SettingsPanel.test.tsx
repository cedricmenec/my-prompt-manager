import { fireEvent, render, screen } from '@testing-library/react'
import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { IDBFactory } from 'fake-indexeddb'
import { resetDb } from '@/infrastructure/db'
import { SettingsPanel } from './SettingsPanel'

function cloneForTest<T>(value: T): T {
  return value
}

const authState = vi.hoisted(() => ({ connected: false }))

vi.mock('@/features/prompts/PromptsContext', () => ({
  usePrompts: () => ({
    state: { prompts: [] },
    dispatch: vi.fn(),
  }),
}))

vi.mock('@/infrastructure/googleDriveAuth', () => ({
  connectGoogleDrive: vi.fn(async () => {
    authState.connected = true
    return 'token'
  }),
  disconnectGoogleDrive: vi.fn(() => {
    authState.connected = false
  }),
  getGoogleDriveAccessToken: vi.fn(() => (authState.connected ? 'token' : null)),
  hasGoogleDriveSession: vi.fn(() => authState.connected),
}))

vi.mock('@/infrastructure/googleDriveClient', () => ({
  testDriveFolderAccess: vi.fn(async () => ({ id: 'folder_123456', name: 'Configured folder' })),
}))

vi.mock('@/infrastructure/driveImportExport', () => ({
  exportPromptsToDrive: vi.fn(async () => ({ id: 'file-1', name: 'byo-prompts.json' })),
  importPromptsFromDriveFile: vi.fn(),
  listDriveImportCandidates: vi.fn(async () => []),
  listDriveSnapshots: vi.fn(async () => []),
}))

vi.mock('@/infrastructure/vault', () => ({
  isVaultAvailable: vi.fn(async () => false),
  isUnlocked: vi.fn(() => false),
  exportVault: vi.fn(async () => null),
  importVault: vi.fn(async () => {}),
  changePassphrase: vi.fn(async () => {}),
  deleteVault: vi.fn(async () => {}),
  createVault: vi.fn(async () => {}),
  lockVault: vi.fn(),
  getDecryptedPayload: vi.fn(() => null),
  persistPayload: vi.fn(async () => {}),
}))

vi.mock('@/infrastructure/vault/vaultCrypto', () => ({
  isWebCryptoAvailable: vi.fn(() => true),
}))

describe('SettingsPanel Google Drive settings', () => {
  beforeEach(() => {
    localStorage.clear()
    authState.connected = false
    globalThis.structuredClone = cloneForTest
    globalThis.indexedDB = new IDBFactory()
    resetDb()
  })

  it('renders Drive controls and not configured status', () => {
    render(<SettingsPanel onClose={vi.fn()} />)

    expect(screen.getByText('Google Drive')).toBeTruthy()
    expect(screen.getByText('not-configured')).toBeTruthy()
    expect(screen.getByText('Export JSON')).toBeTruthy()
    expect(screen.getByText('Import JSON')).toBeTruthy()
  })

  it('rejects invalid snapshot intervals', () => {
    render(<SettingsPanel onClose={vi.fn()} />)

    fireEvent.change(screen.getByLabelText('Google OAuth Client ID'), {
      target: { value: '123-abc.apps.googleusercontent.com' },
    })
    fireEvent.change(screen.getByLabelText('Drive folder URL or ID'), {
      target: { value: 'folder_123456' },
    })
    fireEvent.change(screen.getByLabelText('Interval minutes'), {
      target: { value: '1' },
    })
    fireEvent.click(screen.getByText('Save'))

    expect(screen.getByText('Snapshot interval must be a whole number from 5 to 1440 minutes.')).toBeTruthy()
  })

  it('saves valid Drive settings and enables connect/disconnect actions', async () => {
    render(<SettingsPanel onClose={vi.fn()} />)

    fireEvent.change(screen.getByLabelText('Google OAuth Client ID'), {
      target: { value: '123-abc.apps.googleusercontent.com' },
    })
    fireEvent.change(screen.getByLabelText('Drive folder URL or ID'), {
      target: { value: 'https://drive.google.com/drive/folders/folder_123456' },
    })
    fireEvent.click(screen.getByLabelText('Enable visible Drive snapshots'))
    fireEvent.click(screen.getByText('Save'))

    expect(localStorage.getItem('googleDriveConfig')).toContain('folder_123456')
    fireEvent.click(screen.getByText('Connect'))
    expect(await screen.findByText('Google Drive connected for this session.')).toBeTruthy()
    fireEvent.click(screen.getByText('Disconnect'))
    expect(screen.getByText('Google Drive disconnected.')).toBeTruthy()
  })
  it('switches settings categories and preserves close behavior', () => {
    const onClose = vi.fn()
    render(<SettingsPanel onClose={onClose} />)

    expect(screen.getByText('Legacy')).toBeTruthy()
    fireEvent.click(screen.getByText('AI Features'))
    expect(screen.getByText('Prompt input assistant')).toBeTruthy()
    fireEvent.click(screen.getByText('API & Models'))
    expect(screen.getByText('Provider')).toBeTruthy()
    fireEvent.click(screen.getByText('Vault'))
    expect(screen.getByText('Encrypted Vault')).toBeTruthy()
    expect(screen.getByLabelText('Settings categories')).toBeTruthy()
    expect(screen.getByRole('dialog').className).toContain('h-[min(42rem,92vh)]')
    expect(document.querySelector('div[class*="overflow-y-auto"][class*="pr-1"]')).toBeTruthy()

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})


