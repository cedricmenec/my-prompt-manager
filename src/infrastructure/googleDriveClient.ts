import { markGoogleDriveSessionExpired } from './googleDriveAuth'

const DRIVE_API = 'https://www.googleapis.com/drive/v3'
const DRIVE_UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3'

export class GoogleDriveError extends Error {
  readonly kind: 'network' | 'authorization' | 'permission' | 'not-found' | 'invalid' | 'unknown'
  readonly recovery: string

  constructor(
    message: string,
    kind: 'network' | 'authorization' | 'permission' | 'not-found' | 'invalid' | 'unknown',
    recovery: string,
  ) {
    super(message)
    this.name = 'GoogleDriveError'
    this.kind = kind
    this.recovery = recovery
  }
}

export interface DriveFile {
  id: string
  name: string
  modifiedTime?: string
  mimeType?: string
}

export interface DriveFolder {
  id: string
  name: string
}

export async function testDriveFolderAccess(accessToken: string, folderId: string): Promise<DriveFolder> {
  const probe = await uploadJsonToDriveFolder({
    accessToken,
    folderId,
    fileName: `.byo-prompt-manager-folder-test-${Date.now()}.json`,
    json: JSON.stringify({
      type: 'byo-prompt-manager-folder-test',
      createdAt: new Date().toISOString(),
    }),
  })

  try {
    await deleteDriveFile(accessToken, probe.id)
  } catch {
    // The access test already succeeded. A leftover probe file is recoverable by the user.
  }

  return { id: folderId, name: 'Configured folder' }
}

export async function uploadJsonToDriveFolder(params: {
  accessToken: string
  folderId: string
  fileName: string
  json: string
}): Promise<DriveFile> {
  const metadata = {
    name: params.fileName,
    mimeType: 'application/json',
    parents: [params.folderId],
  }
  const boundary = `byo-prompt-${crypto.randomUUID()}`
  const body = [
    `--${boundary}`,
    'Content-Type: application/json; charset=UTF-8',
    '',
    JSON.stringify(metadata),
    `--${boundary}`,
    'Content-Type: application/json',
    '',
    params.json,
    `--${boundary}--`,
  ].join('\r\n')

  const response = await driveFetch(
    `${DRIVE_UPLOAD_API}/files?uploadType=multipart&fields=id,name,modifiedTime`,
    params.accessToken,
    {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body,
    },
  )
  return (await response.json()) as DriveFile
}

export async function listJsonFilesInDriveFolder(accessToken: string, folderId: string): Promise<DriveFile[]> {
  const query = `'${folderId.replaceAll("'", "\\'")}' in parents and trashed = false and mimeType = 'application/json'`
  const url = new URL(`${DRIVE_API}/files`)
  url.searchParams.set('q', query)
  url.searchParams.set('fields', 'files(id,name,modifiedTime,mimeType)')
  url.searchParams.set('orderBy', 'modifiedTime desc')
  url.searchParams.set('supportsAllDrives', 'true')
  const response = await driveFetch(url.toString(), accessToken)
  const parsed = (await response.json()) as { files?: DriveFile[] }
  return parsed.files ?? []
}

export async function downloadDriveFileText(accessToken: string, fileId: string): Promise<string> {
  const response = await driveFetch(
    `${DRIVE_API}/files/${encodeURIComponent(fileId)}?alt=media&supportsAllDrives=true`,
    accessToken,
  )
  return response.text()
}

export async function deleteDriveFile(accessToken: string, fileId: string): Promise<void> {
  await driveFetch(
    `${DRIVE_API}/files/${encodeURIComponent(fileId)}?supportsAllDrives=true`,
    accessToken,
    { method: 'DELETE' },
  )
}

async function driveFetch(url: string, accessToken: string, init: RequestInit = {}): Promise<Response> {
  let response: Response
  try {
    response = await fetch(url, {
      ...init,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...(init.headers ?? {}),
      },
    })
  } catch {
    throw new GoogleDriveError('Google Drive could not be reached.', 'network', 'Check your network connection and try again.')
  }

  if (response.ok) return response

  const message = await readDriveErrorMessage(response)
  if (response.status === 401) {
    markGoogleDriveSessionExpired()
    throw new GoogleDriveError('Google Drive authorization expired.', 'authorization', 'Reconnect Google Drive and retry the action.')
  }
  if (response.status === 403) {
    throw new GoogleDriveError(message || 'Google Drive folder access was denied.', 'permission', 'Check that the connected Google account can access the folder.')
  }
  if (response.status === 404) {
    throw new GoogleDriveError('Google Drive folder or file was not found.', 'not-found', 'Check the folder URL or choose a file that still exists.')
  }
  throw new GoogleDriveError(message || 'Google Drive request failed.', 'unknown', 'Try again after checking your Drive configuration.')
}

async function readDriveErrorMessage(response: Response): Promise<string> {
  try {
    const parsed = (await response.json()) as { error?: { message?: string } }
    return parsed.error?.message ?? ''
  } catch {
    return ''
  }
}
