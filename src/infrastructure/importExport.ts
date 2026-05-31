import { PromptSchema } from '@/domain/promptSchema'
import type { Prompt } from '@/domain/promptSchema'
import { DATA_SCHEMA_VERSION } from './dataMigrations'

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
  errors: ImportValidationError[]
  migrationWarning?: string
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

interface ExportEnvelope {
  exportedAt: string
  appVersion: string
  schemaVersion: number
  promptCount: number
  prompts: unknown[]
}

export function exportPromptsToJson(prompts: Prompt[]): void {
  const exportedAt = new Date().toISOString()
  const envelope: ExportEnvelope = {
    exportedAt,
    appVersion: import.meta.env.VITE_APP_VERSION,
    schemaVersion: DATA_SCHEMA_VERSION,
    promptCount: prompts.length,
    prompts,
  }
  const json = JSON.stringify(envelope, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const dateStr = exportedAt.slice(0, 10) // YYYY-MM-DD
  const a = document.createElement('a')
  a.href = url
  a.download = `byo-prompts-${dateStr}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
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

  return { valid, errors, ...(migrationWarning !== undefined ? { migrationWarning } : {}) }
}

