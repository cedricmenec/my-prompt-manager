import type { Prompt } from '@/domain/promptSchema'
import { createPromptExportEnvelope, parseImportText, serializePromptExportEnvelope, type ImportParseResult } from './importExport'
import { uploadJsonToDriveFolder, type DriveFile } from './googleDriveClient'
import {
  loadGoogleDriveConfig,
  updateGoogleDriveSnapshotMetadata,
  type GoogleDriveConfig,
} from './googleDriveConfig'
import { getGoogleDriveAccessToken } from './googleDriveAuth'

export type SnapshotReason = 'manual-export' | 'pre-import' | 'pre-restore' | 'automatic'

export async function createDriveSnapshot(params: {
  prompts: Prompt[]
  config: GoogleDriveConfig
  accessToken: string
  reason: SnapshotReason
}): Promise<DriveFile> {
  const envelope = await createPromptExportEnvelope(params.prompts)
  const json = serializePromptExportEnvelope(envelope)
  const hash = await hashSnapshotPayload(json)
  const file = await uploadJsonToDriveFolder({
    accessToken: params.accessToken,
    folderId: params.config.folderId,
    fileName: `byo-prompts-snapshot-${params.reason}-${envelope.exportedAt.replaceAll(':', '-')}.json`,
    json,
  })
  updateGoogleDriveSnapshotMetadata({
    lastSnapshotAt: envelope.exportedAt,
    lastSnapshotHash: hash,
    lastSnapshotFileId: file.id,
  })
  return file
}

export async function createDriveSnapshotAfterExport(params: {
  prompts: Prompt[]
  config: GoogleDriveConfig
  accessToken: string
}): Promise<DriveFile | null> {
  if (!params.config.snapshots.enabled) return null
  return createDriveSnapshot({ ...params, reason: 'manual-export' })
}

export async function createPreOperationSnapshot(params: {
  prompts: Prompt[]
  config: GoogleDriveConfig
  reason: Extract<SnapshotReason, 'pre-import' | 'pre-restore'>
}): Promise<DriveFile | null> {
  const accessToken = getGoogleDriveAccessToken()
  if (!params.config.snapshots.enabled || !accessToken) return null
  return createDriveSnapshot({ ...params, accessToken })
}

export async function createAutomaticSnapshotIfNeeded(prompts: Prompt[]): Promise<DriveFile | null> {
  const config = loadGoogleDriveConfig()
  const accessToken = getGoogleDriveAccessToken()
  if (!config.snapshots.enabled || !config.folderId || !accessToken) return null
  if (!isSnapshotIntervalElapsed(config.snapshots.lastSnapshotAt, config.snapshots.intervalMinutes)) return null

  const envelope = await createPromptExportEnvelope(prompts)
  const json = serializePromptExportEnvelope(envelope)
  const hash = await hashSnapshotPayload(json)
  if (hash === config.snapshots.lastSnapshotHash) return null

  return createDriveSnapshot({ prompts, config, accessToken, reason: 'automatic' })
}

export async function parseDriveSnapshotText(text: string): Promise<ImportParseResult> {
  return parseImportText(text)
}

export async function hashSnapshotPayload(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

function isSnapshotIntervalElapsed(lastSnapshotAt: string | undefined, intervalMinutes: number): boolean {
  if (!lastSnapshotAt) return true
  return Date.now() - Date.parse(lastSnapshotAt) >= intervalMinutes * 60_000
}
