import type { Prompt } from '@/domain/promptSchema'
import {
  buildExportFileName,
  createPromptExportEnvelope,
  parseImportText,
  serializePromptExportEnvelope,
  type ImportParseResult,
} from './importExport'
import { getGoogleDriveAccessToken } from './googleDriveAuth'
import { uploadJsonToDriveFolder, listJsonFilesInDriveFolder, downloadDriveFileText, type DriveFile } from './googleDriveClient'
import { createDriveSnapshotAfterExport } from './driveSnapshots'
import type { GoogleDriveConfig } from './googleDriveConfig'

export class DrivePreconditionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DrivePreconditionError'
  }
}

export async function exportPromptsToDrive(prompts: Prompt[], config: GoogleDriveConfig): Promise<DriveFile> {
  const accessToken = requireDriveAccess(config)
  const envelope = await createPromptExportEnvelope(prompts)
  const json = serializePromptExportEnvelope(envelope)
  const file = await uploadJsonToDriveFolder({
    accessToken,
    folderId: config.folderId,
    fileName: buildExportFileName(envelope.exportedAt),
    json,
  })
  await createDriveSnapshotAfterExport({ prompts, config, accessToken }).catch(() => undefined)
  return file
}

export async function listDriveImportCandidates(config: GoogleDriveConfig): Promise<DriveFile[]> {
  const accessToken = requireDriveAccess(config)
  const files = await listJsonFilesInDriveFolder(accessToken, config.folderId)
  return files.filter((file) => file.name.endsWith('.json') && !file.name.startsWith('byo-prompts-snapshot-'))
}

export async function listDriveSnapshots(config: GoogleDriveConfig): Promise<DriveFile[]> {
  const accessToken = requireDriveAccess(config)
  const files = await listJsonFilesInDriveFolder(accessToken, config.folderId)
  return files.filter((file) => file.name.startsWith('byo-prompts-snapshot-'))
}

export async function importPromptsFromDriveFile(config: GoogleDriveConfig, fileId: string): Promise<ImportParseResult> {
  const accessToken = requireDriveAccess(config)
  const text = await downloadDriveFileText(accessToken, fileId)
  return parseImportText(text)
}

function requireDriveAccess(config: GoogleDriveConfig): string {
  if (!config.clientId || !config.folderId) {
    throw new DrivePreconditionError('Configure a Google OAuth Client ID and Drive folder first.')
  }
  const accessToken = getGoogleDriveAccessToken()
  if (!accessToken) {
    throw new DrivePreconditionError('Connect Google Drive before using Drive actions.')
  }
  return accessToken
}
