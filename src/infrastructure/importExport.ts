import { PromptSchema } from '@/domain/promptSchema'
import type { Prompt, PromptImageAsset } from '@/domain/promptSchema'
import { DATA_SCHEMA_VERSION } from './dataMigrations'
import { promptRepository } from './promptRepository'

// ---------------------------------------------------------------------------
// Error types
// ---------------------------------------------------------------------------

export class ImportFormatError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ImportFormatError'
  }
}

// ---------------------------------------------------------------------------
// Result types
// ---------------------------------------------------------------------------

export interface ImportValidationError {
  index: number
  reason: string
}

export interface ImportParseResult {
  valid: Prompt[]
  imageAssets: PromptImageAsset[]
  errors: ImportValidationError[]
  migrationWarning?: string
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

export interface ExportEnvelope {
  exportedAt: string
  appVersion: string
  schemaVersion: number
  promptCount: number
  prompts: unknown[]
  imageAssets?: ExportedImageAsset[]
}

export interface ExportedImageAsset {
  id: string
  promptId: string
  mimeType: 'image/webp'
  width: number
  height: number
  sizeBytes: number
  source: 'upload' | 'remote-url'
  originalName?: string
  originalUrl?: string
  createdAt: string
  payloadBase64: string
}

export async function exportPromptsToJson(prompts: Prompt[]): Promise<void> {
  const envelope = await createPromptExportEnvelope(prompts)
  const json = serializePromptExportEnvelope(envelope)
  downloadJson(json, buildExportFileName(envelope.exportedAt))
}

export async function createPromptExportEnvelope(prompts: Prompt[]): Promise<ExportEnvelope> {
  const exportedAt = new Date().toISOString()
  const imageAssets = await collectExportableImageAssets(prompts)
  return {
    exportedAt,
    appVersion: import.meta.env.VITE_APP_VERSION,
    schemaVersion: DATA_SCHEMA_VERSION,
    promptCount: prompts.length,
    prompts,
    ...(imageAssets.length > 0 ? { imageAssets } : {}),
  }
}

export function serializePromptExportEnvelope(envelope: ExportEnvelope): string {
  return JSON.stringify(envelope, null, 2)
}

export function buildExportFileName(exportedAt = new Date().toISOString()): string {
  return `byo-prompts-${exportedAt.slice(0, 10)}.json`
}

function downloadJson(json: string, fileName: string): void {
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

async function collectExportableImageAssets(prompts: Prompt[]): Promise<ExportedImageAsset[]> {
  const ids = [...new Set(prompts.map((prompt) => prompt.imageAssetId).filter((id): id is string => Boolean(id)))]
  const exported: ExportedImageAsset[] = []

  for (const id of ids) {
    const asset = await promptRepository.getImageAssetById(id)
    if (!asset) continue
    exported.push({
      id: asset.id,
      promptId: asset.promptId,
      mimeType: asset.mimeType,
      width: asset.width,
      height: asset.height,
      sizeBytes: asset.sizeBytes,
      source: asset.source,
      ...(asset.originalName !== undefined ? { originalName: asset.originalName } : {}),
      ...(asset.originalUrl !== undefined ? { originalUrl: asset.originalUrl } : {}),
      createdAt: asset.createdAt,
      payloadBase64: await blobToBase64(asset.blob),
    })
  }

  return exported
}

// ---------------------------------------------------------------------------
// Import — transformers registry
// ---------------------------------------------------------------------------

/**
 * Maps target schema version N to a function that transforms raw prompts
 * from version N-1 to version N. Add entries here when introducing new migrations.
 */
export const importTransformers: Record<number, (prompts: unknown[]) => unknown[]> = {}

function migrateImportedPrompts(
  prompts: unknown[],
  fromVersion: number,
  toVersion: number,
): unknown[] {
  let current = prompts
  for (let v = fromVersion + 1; v <= toVersion; v++) {
    const transformer = importTransformers[v]
    if (transformer) {
      current = transformer(current)
    }
  }
  return current
}

// ---------------------------------------------------------------------------
// Import
// ---------------------------------------------------------------------------

export async function parseImportFile(file: File): Promise<ImportParseResult> {
  const text = await file.text()
  return parseImportText(text)
}

export async function parseImportText(text: string): Promise<ImportParseResult> {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new ImportFormatError('Invalid JSON file. Please check the file and try again.')
  }

  if (typeof parsed !== 'object' || parsed === null) {
    throw new ImportFormatError(
      'Unrecognised file format. Expected a Prompt Vault export file.',
    )
  }

  const raw = parsed as Record<string, unknown>

  // Resolve schemaVersion: explicit field takes priority; legacy "v1" schema field maps to 1
  let fileSchemaVersion: number
  if (typeof raw.schemaVersion === 'number') {
    fileSchemaVersion = raw.schemaVersion
  } else if (raw.schema === 'v1') {
    fileSchemaVersion = 1
  } else {
    throw new ImportFormatError(
      'Unrecognised file format. Expected a Prompt Vault export file.',
    )
  }

  if (fileSchemaVersion > DATA_SCHEMA_VERSION) {
    throw new ImportFormatError(
      `This export file was created with a newer version of the app (schema version ${fileSchemaVersion}). ` +
        `Please update the app to import this file.`,
    )
  }

  const rawPrompts = Array.isArray(raw.prompts) ? (raw.prompts as unknown[]) : []

  let migrationWarning: string | undefined
  let migratedPrompts = rawPrompts
  if (fileSchemaVersion < DATA_SCHEMA_VERSION) {
    migratedPrompts = migrateImportedPrompts(rawPrompts, fileSchemaVersion, DATA_SCHEMA_VERSION)
    migrationWarning =
      `This file was created with an older schema (version ${fileSchemaVersion}). ` +
      `It has been automatically migrated to the current version (${DATA_SCHEMA_VERSION}).`
  }

  const valid: Prompt[] = []
  const imageAssets: PromptImageAsset[] = []
  const errors: ImportValidationError[] = []

  for (let i = 0; i < migratedPrompts.length; i++) {
    const result = PromptSchema.safeParse(migratedPrompts[i])
    if (result.success) {
      valid.push(result.data)
    } else {
      errors.push({
        index: i,
        reason: result.error.issues.map((iss) => iss.message).join('; '),
      })
    }
  }

  const promptIds = new Set(valid.map((prompt) => prompt.id))
  const rawAssets = Array.isArray(raw.imageAssets) ? raw.imageAssets : []
  for (let i = 0; i < rawAssets.length; i++) {
    try {
      const asset = await parseExportedImageAsset(rawAssets[i], promptIds)
      if (asset) {
        imageAssets.push(asset)
      }
    } catch (error) {
      errors.push({
        index: i,
        reason: error instanceof Error ? `Image asset: ${error.message}` : 'Image asset is invalid',
      })
    }
  }

  return { valid, imageAssets, errors, ...(migrationWarning !== undefined ? { migrationWarning } : {}) }
}

async function parseExportedImageAsset(
  rawAsset: unknown,
  promptIds: Set<string>,
): Promise<PromptImageAsset | undefined> {
  if (typeof rawAsset !== 'object' || rawAsset === null) {
    throw new ImportFormatError('Asset record is not an object.')
  }
  const asset = rawAsset as Record<string, unknown>
  if (asset.mimeType !== 'image/webp') {
    throw new ImportFormatError('Only image/webp assets are supported.')
  }
  if (typeof asset.id !== 'string' || asset.id.length === 0) {
    throw new ImportFormatError('Asset id is missing.')
  }
  if (typeof asset.promptId !== 'string' || !promptIds.has(asset.promptId)) {
    return undefined
  }
  if (typeof asset.payloadBase64 !== 'string' || asset.payloadBase64.length === 0) {
    throw new ImportFormatError('Asset payload is missing.')
  }

  const blob = base64ToBlob(asset.payloadBase64, asset.mimeType)
  return {
    id: asset.id,
    promptId: asset.promptId,
    blob,
    mimeType: asset.mimeType,
    width: typeof asset.width === 'number' ? asset.width : 1,
    height: typeof asset.height === 'number' ? asset.height : 1,
    sizeBytes: typeof asset.sizeBytes === 'number' ? asset.sizeBytes : blob.size,
    source: asset.source === 'remote-url' ? 'remote-url' : 'upload',
    ...(typeof asset.originalName === 'string' ? { originalName: asset.originalName } : {}),
    ...(typeof asset.originalUrl === 'string' ? { originalUrl: asset.originalUrl } : {}),
    createdAt: typeof asset.createdAt === 'string' ? asset.createdAt : new Date().toISOString(),
  }
}

async function blobToBase64(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer()
  let binary = ''
  for (const byte of new Uint8Array(buffer)) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary)
}

function base64ToBlob(base64: string, mimeType: string): Blob {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return new Blob([bytes], { type: mimeType })
}

