import { useRef, useState, useEffect } from 'react'
import { usePrompts } from '@/features/prompts/PromptsContext'
import { promptRepository } from '@/infrastructure/promptRepository'
import {
  exportPromptsToJson,
  parseImportFile,
  ImportFormatError,
  type ImportParseResult,
} from '@/infrastructure/importExport'
import { Modal } from '@/shared/ui/Modal'
import { useToast, ToastContainer } from '@/shared/ui/Toast'

interface SettingsPanelProps {
  onClose: () => void
}

export function SettingsPanel({ onClose }: SettingsPanelProps) {
  const { state, dispatch } = usePrompts()
  const { toasts, show: showToast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importResult, setImportResult] = useState<ImportParseResult | null>(null)
  const [isImporting, setIsImporting] = useState(false)

  // Close on Escape (only when confirmation modal is not open)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !importResult) onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose, importResult])

  // ---------------------------------------------------------------------------
  // Export
  // ---------------------------------------------------------------------------

  const handleExport = async () => {
    try {
      await exportPromptsToJson(state.prompts)
    } catch {
      showToast('Export failed. Please try again.', 'error')
    }
  }

  // ---------------------------------------------------------------------------
  // Import
  // ---------------------------------------------------------------------------

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    // Reset so the same file can be re-selected if needed
    e.target.value = ''
    try {
      const result = await parseImportFile(file)
      setImportResult(result)
    } catch (err) {
      if (err instanceof ImportFormatError) {
        showToast(err.message, 'error')
      } else {
        showToast('Unexpected error reading the file.', 'error')
      }
    }
  }

  const handleConfirmImport = async () => {
    if (!importResult) return
    setIsImporting(true)
    try {
      await promptRepository.deleteAll()
      await promptRepository.bulkImportWithAssets(importResult.valid, importResult.imageAssets)
      const reloaded = await promptRepository.getAll()
      dispatch({ type: 'LOAD', prompts: reloaded })
      const skipped = importResult.errors.length
      const imported = importResult.valid.length
      showToast(
        `${imported} prompt${imported !== 1 ? 's' : ''} imported${skipped > 0 ? ` (${skipped} skipped)` : ''}`,
        'success',
      )
      setImportResult(null)
    } catch {
      showToast('Import failed. Please try again.', 'error')
    } finally {
      setIsImporting(false)
    }
  }

  const handleCancelImport = () => {
    setImportResult(null)
  }

  const currentCount = state.prompts.length
  const validCount = importResult?.valid.length ?? 0
  const errorCount = importResult?.errors.length ?? 0

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <>
      {/* Settings backdrop + panel */}
      <div
        className="fixed inset-0 z-40 flex items-center justify-center bg-black/50"
        onClick={onClose}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Settings"
          className="relative w-full max-w-lg rounded-xl bg-surface p-6 shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text-heading">Settings</h2>
            <button
              onClick={onClose}
              aria-label="Close settings"
              className="rounded p-1 text-text transition-colors hover:bg-surface-muted"
            >
              <svg
                className="size-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* ── Section: Data ── */}
          <section className="mb-6">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-text">
              Data
            </h3>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleExport}
                className="flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-text-heading transition-colors hover:bg-surface-muted"
              >
                <svg
                  className="size-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
                  />
                </svg>
                Export JSON
              </button>

              <button
                onClick={handleImportClick}
                className="flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-text-heading transition-colors hover:bg-surface-muted"
              >
                <svg
                  className="size-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
                  />
                </svg>
                Import JSON
              </button>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleFileChange}
                aria-hidden="true"
              />
            </div>
          </section>

          {/* ── Section: Sync (coming soon) ── */}
          <section className="mb-3 rounded-lg border border-border p-4 opacity-50">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-text-heading">☁ Sync</h3>
              <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs text-text">
                coming soon
              </span>
            </div>
          </section>

          {/* ── Section: API Keys (coming soon) ── */}
          <section className="mb-3 rounded-lg border border-border p-4 opacity-50">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-text-heading">🔑 API Keys</h3>
              <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs text-text">
                coming soon
              </span>
            </div>
          </section>

          {/* ── Section: Auto-backup (coming soon) ── */}
          <section className="rounded-lg border border-border p-4 opacity-50">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-text-heading">⏱ Auto-backup</h3>
              <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs text-text">
                coming soon
              </span>
            </div>
          </section>
        </div>
      </div>

      {/* Import confirmation modal (z-50 — above the settings panel) */}
      {importResult && (
        <Modal
          title="Replace all prompts?"
          onClose={handleCancelImport}
          actions={[
            {
              label: 'Cancel',
              variant: 'secondary',
              onClick: handleCancelImport,
            },
            {
              label: isImporting ? 'Importing…' : 'Import & replace',
              variant: 'danger',
              onClick: handleConfirmImport,
            },
          ]}
        >
          <p className="mb-3 text-text">
            Your{' '}
            <strong className="text-text-heading">
              {currentCount} current prompt{currentCount !== 1 ? 's' : ''}
            </strong>{' '}
            will be permanently replaced by{' '}
            <strong className="text-text-heading">
              {validCount} imported prompt{validCount !== 1 ? 's' : ''}
            </strong>
            .
          </p>

          {errorCount > 0 && (
            <div className="mb-3 rounded-md bg-surface-muted p-3 text-xs">
              <p className="mb-1 font-medium text-text-heading">
                {errorCount} prompt{errorCount !== 1 ? 's' : ''} will be skipped (invalid):
              </p>
              <ul className="list-disc space-y-0.5 pl-4 text-text">
                {importResult.errors.map((e) => (
                  <li key={e.index}>
                    Entry #{e.index + 1}: {e.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-xs text-text">This action cannot be undone.</p>
        </Modal>
      )}

      {/* Toasts */}
      <ToastContainer toasts={toasts} />
    </>
  )
}
