export const DEFAULT_SNAPSHOT_INTERVAL_MINUTES = 15
const STORAGE_KEY = 'googleDriveConfig'

export interface GoogleDriveSnapshotSettings {
  enabled: boolean
  intervalMinutes: number
  lastSnapshotAt?: string
  lastSnapshotHash?: string
  lastSnapshotFileId?: string
}

export interface GoogleDriveConfig {
  clientId: string
  folderId: string
  snapshots: GoogleDriveSnapshotSettings
}

export type GoogleDriveStatusKind =
  | 'not-configured'
  | 'configured'
  | 'connected'
  | 'disconnected'
  | 'expired'
  | 'error'

export interface GoogleDriveStatus {
  kind: GoogleDriveStatusKind
  message: string
}

export interface FolderAccessTestResult {
  ok: boolean
  folderName?: string
  message: string
}

export function createDefaultDriveConfig(): GoogleDriveConfig {
  return {
    clientId: '',
    folderId: '',
    snapshots: {
      enabled: false,
      intervalMinutes: DEFAULT_SNAPSHOT_INTERVAL_MINUTES,
    },
  }
}

export function loadGoogleDriveConfig(): GoogleDriveConfig {
  const fallback = createDefaultDriveConfig()
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return fallback

  try {
    const parsed = JSON.parse(raw) as Partial<GoogleDriveConfig>
    return sanitizeGoogleDriveConfig(parsed)
  } catch {
    return fallback
  }
}

export function saveGoogleDriveConfig(config: GoogleDriveConfig): GoogleDriveConfig {
  const sanitized = sanitizeGoogleDriveConfig(config)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized))
  return sanitized
}

export function updateGoogleDriveSnapshotMetadata(metadata: {
  lastSnapshotAt: string
  lastSnapshotHash: string
  lastSnapshotFileId?: string
}): GoogleDriveConfig {
  const current = loadGoogleDriveConfig()
  return saveGoogleDriveConfig({
    ...current,
    snapshots: {
      ...current.snapshots,
      lastSnapshotAt: metadata.lastSnapshotAt,
      lastSnapshotHash: metadata.lastSnapshotHash,
      ...(metadata.lastSnapshotFileId !== undefined ? { lastSnapshotFileId: metadata.lastSnapshotFileId } : {}),
    },
  })
}

export function parseDriveFolderId(input: string): string | null {
  const value = input.trim()
  if (!value) return null

  try {
    const url = new URL(value)
    const folderMatch = url.pathname.match(/\/folders\/([A-Za-z0-9_-]+)/)
    if (folderMatch?.[1]) return folderMatch[1]
    const id = url.searchParams.get('id')
    if (id && isValidDriveFolderId(id)) return id
  } catch {
    // Plain folder IDs are handled below.
  }

  return isValidDriveFolderId(value) ? value : null
}

export function validateDriveClientId(clientId: string): string | null {
  const value = clientId.trim()
  if (!value) return 'Enter a Google OAuth Client ID.'
  if (!/^[\w.-]+\.apps\.googleusercontent\.com$/.test(value)) {
    return 'Use a browser OAuth Client ID ending in .apps.googleusercontent.com.'
  }
  return null
}

export function validateSnapshotInterval(value: number): string | null {
  if (!Number.isInteger(value) || value < 5 || value > 1440) {
    return 'Snapshot interval must be a whole number from 5 to 1440 minutes.'
  }
  return null
}

export function deriveDriveStatus(config: GoogleDriveConfig, hasToken: boolean, error?: string): GoogleDriveStatus {
  if (error) return { kind: 'error', message: error }
  if (!config.clientId || !config.folderId) {
    return { kind: 'not-configured', message: 'Add a Client ID and Drive folder to enable Drive actions.' }
  }
  if (hasToken) return { kind: 'connected', message: 'Connected for this browser session.' }
  return { kind: 'configured', message: 'Configured. Connect when you want to use Google Drive.' }
}

export function sanitizeGoogleDriveConfig(config: Partial<GoogleDriveConfig>): GoogleDriveConfig {
  const interval = config.snapshots?.intervalMinutes ?? DEFAULT_SNAPSHOT_INTERVAL_MINUTES
  const snapshots: GoogleDriveSnapshotSettings = {
    enabled: config.snapshots?.enabled === true,
    intervalMinutes: validateSnapshotInterval(interval) === null ? interval : DEFAULT_SNAPSHOT_INTERVAL_MINUTES,
    ...(typeof config.snapshots?.lastSnapshotAt === 'string' ? { lastSnapshotAt: config.snapshots.lastSnapshotAt } : {}),
    ...(typeof config.snapshots?.lastSnapshotHash === 'string' ? { lastSnapshotHash: config.snapshots.lastSnapshotHash } : {}),
    ...(typeof config.snapshots?.lastSnapshotFileId === 'string' ? { lastSnapshotFileId: config.snapshots.lastSnapshotFileId } : {}),
  }

  return {
    clientId: typeof config.clientId === 'string' ? config.clientId.trim() : '',
    folderId: typeof config.folderId === 'string' ? config.folderId.trim() : '',
    snapshots,
  }
}

function isValidDriveFolderId(value: string): boolean {
  return /^[A-Za-z0-9_-]{10,}$/.test(value)
}
