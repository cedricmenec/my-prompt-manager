import type { GoogleDriveStatus } from './googleDriveConfig'

const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file'
const GIS_SCRIPT_SRC = 'https://accounts.google.com/gsi/client'

interface Session {
  accessToken: string
  expiresAt: number
}

interface GoogleTokenResponse {
  access_token?: string
  expires_in?: number
  error?: string
  error_description?: string
}

interface GoogleTokenClient {
  requestAccessToken(options?: { prompt?: string }): void
}

interface GoogleAccountsOAuth2 {
  initTokenClient(config: {
    client_id: string
    scope: string
    callback: (response: GoogleTokenResponse) => void
    error_callback?: (error: { type?: string; message?: string }) => void
  }): GoogleTokenClient
}

declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: GoogleAccountsOAuth2
      }
    }
  }
}

let session: Session | null = null
let statusError: string | undefined
let gisLoadPromise: Promise<void> | null = null

export function getGoogleDriveAccessToken(): string | null {
  if (!session) return null
  if (Date.now() >= session.expiresAt) {
    session = null
    statusError = 'Google Drive session expired. Reconnect to continue.'
    return null
  }
  return session.accessToken
}

export function hasGoogleDriveSession(): boolean {
  return getGoogleDriveAccessToken() !== null
}

export function getGoogleDriveSessionStatus(): GoogleDriveStatus {
  if (statusError) return { kind: 'error', message: statusError }
  if (hasGoogleDriveSession()) return { kind: 'connected', message: 'Connected for this browser session.' }
  return { kind: 'disconnected', message: 'Connect Google Drive to use Drive actions.' }
}

export async function connectGoogleDrive(clientId: string): Promise<string> {
  statusError = undefined
  await loadGoogleIdentityServices()

  return new Promise((resolve, reject) => {
    const oauth2 = window.google?.accounts?.oauth2
    if (!oauth2) {
      const message = 'Google Identity Services did not load. Check your network connection and try again.'
      statusError = message
      reject(new Error(message))
      return
    }

    const tokenClient = oauth2.initTokenClient({
      client_id: clientId,
      scope: DRIVE_SCOPE,
      callback: (response) => {
        if (response.error) {
          const message = response.error_description || `Google Drive connection failed: ${response.error}.`
          statusError = message
          reject(new Error(message))
          return
        }
        if (!response.access_token) {
          const message = 'Google Drive did not return an access token.'
          statusError = message
          reject(new Error(message))
          return
        }

        session = {
          accessToken: response.access_token,
          expiresAt: Date.now() + (response.expires_in ?? 3600) * 1000,
        }
        resolve(response.access_token)
      },
      error_callback: (error) => {
        const message =
          error.type === 'popup_failed_to_open'
            ? 'Popup was blocked. Allow popups and try connecting again.'
            : error.type === 'popup_closed'
              ? 'Google Drive connection was cancelled.'
              : error.message || 'Google Drive connection failed.'
        statusError = message
        reject(new Error(message))
      },
    })

    tokenClient.requestAccessToken({ prompt: 'consent' })
  })
}

export function disconnectGoogleDrive(): void {
  session = null
  statusError = undefined
}

export function markGoogleDriveSessionExpired(): void {
  session = null
  statusError = 'Google Drive session expired. Reconnect to continue.'
}

export function markGoogleDriveSessionError(message: string): void {
  statusError = message
}

async function loadGoogleIdentityServices(): Promise<void> {
  if (window.google?.accounts?.oauth2) return
  if (gisLoadPromise) return gisLoadPromise

  gisLoadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GIS_SCRIPT_SRC}"]`)
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('Google Identity Services failed to load.')), { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = GIS_SCRIPT_SRC
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Google Identity Services failed to load.'))
    document.head.appendChild(script)
  })

  return gisLoadPromise
}
