import { PromptSchema } from '@/domain/promptSchema'
import type { Prompt } from '@/domain/promptSchema'

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
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

interface ExportEnvelope {
  exportedAt: string
  schema: string
  promptCount: number
  prompts: unknown[]
}

export function exportPromptsToJson(prompts: Prompt[]): void {
  const exportedAt = new Date().toISOString()
  const envelope: ExportEnvelope = {
    exportedAt,
    schema: 'v1',
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

  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    (parsed as ExportEnvelope).schema !== 'v1'
  ) {
    throw new ImportFormatError(
      'Unrecognised file format. Expected a Prompt Vault export file (schema "v1").',
    )
  }

  const envelope = parsed as ExportEnvelope
  const rawPrompts = Array.isArray(envelope.prompts) ? envelope.prompts : []

  const valid: Prompt[] = []
  const errors: ImportValidationError[] = []

  for (let i = 0; i < rawPrompts.length; i++) {
    const result = PromptSchema.safeParse(rawPrompts[i])
    if (result.success) {
      valid.push(result.data)
    } else {
      errors.push({
        index: i,
        reason: result.error.issues.map((iss) => iss.message).join('; '),
      })
    }
  }

  return { valid, errors }
}
