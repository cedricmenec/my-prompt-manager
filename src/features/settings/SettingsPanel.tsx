import { useRef, useState, useEffect } from 'react'
import { usePrompts } from '@/features/prompts/PromptsContext'
import { promptRepository } from '@/infrastructure/promptRepository'
import {
  exportPromptsToJson,
  parseImportFile,
  ImportFormatError,
  type ImportParseResult,
} from '@/infrastructure/importExport'
import {
  connectGoogleDrive,
  disconnectGoogleDrive,
  getGoogleDriveAccessToken,
  hasGoogleDriveSession,
} from '@/infrastructure/googleDriveAuth'
import {
  deriveDriveStatus,
  loadGoogleDriveConfig,
  parseDriveFolderId,
  saveGoogleDriveConfig,
  validateDriveClientId,
  validateSnapshotInterval,
  type GoogleDriveConfig,
} from '@/infrastructure/googleDriveConfig'
import { testDriveFolderAccess, type DriveFile } from '@/infrastructure/googleDriveClient'
import {
  exportPromptsToDrive,
  importPromptsFromDriveFile,
  listDriveImportCandidates,
  listDriveSnapshots,
} from '@/infrastructure/driveImportExport'
import { createPreOperationSnapshot } from '@/infrastructure/driveSnapshots'
import { Modal } from '@/shared/ui/Modal'
import { ToastContainer } from '@/shared/ui/Toast'
import { useToast } from '@/shared/ui/useToast'

interface SettingsPanelProps {
  onClose: () => void
}

type ImportSource = 'local' | 'drive' | 'snapshot'

export function SettingsPanel({ onClose }: SettingsPanelProps) {
  const { state, dispatch } = usePrompts()
  const { toasts, show: showToast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importResult, setImportResult] = useState<ImportParseResult | null>(null)
  const [importSource, setImportSource] = useState<ImportSource>('local')
  const [isImporting, setIsImporting] = useState(false)
  const [config, setConfig] = useState<GoogleDriveConfig>(() => loadGoogleDriveConfig())
  const [clientIdInput, setClientIdInput] = useState(config.clientId)
  const [folderInput, setFolderInput] = useState(config.folderId)
  const [snapshotEnabled, setSnapshotEnabled] = useState(config.snapshots.enabled)
  const [snapshotIntervalInput, setSnapshotIntervalInput] = useState(String(config.snapshots.intervalMinutes))
  const [driveError, setDriveError] = useState<string>()
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([])
  const [snapshotFiles, setSnapshotFiles] = useState<DriveFile[]>([])
  const [selectedDriveFileId, setSelectedDriveFileId] = useState('')
  const [selectedSnapshotId, setSelectedSnapshotId] = useState('')
  const [isBusy, setIsBusy] = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !importResult) onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose, importResult])

  const driveStatus = deriveDriveStatus(config, hasGoogleDriveSession(), driveError)

  const handleExport = async () => {
    try {
      await exportPromptsToJson(state.prompts)
    } catch {
      showToast('Export failed. Please try again.', 'error')
    }
  }

  const handleDriveExport = async () => {
    setIsBusy(true)
    setDriveError(undefined)
    try {
      const file = await exportPromptsToDrive(state.prompts, config)
      showToast(`Uploaded ${file.name} to Google Drive.`, 'success')
    } catch (error) {
      showDriveError(error)
    } finally {
      setIsBusy(false)
    }
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    try {
      const result = await parseImportFile(file)
      setImportSource('local')
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
      if (importSource === 'drive' || importSource === 'snapshot') {
        await createPreOperationSnapshot({
          prompts: state.prompts,
          config,
          reason: importSource === 'snapshot' ? 'pre-restore' : 'pre-import',
        })
      }
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

  const handleSaveDriveConfig = () => {
    const clientError = validateDriveClientId(clientIdInput)
    const folderId = parseDriveFolderId(folderInput)
    const interval = Number(snapshotIntervalInput)
    const intervalError = validateSnapshotInterval(interval)

    if (clientError) {
      showToast(clientError, 'error')
      return
    }
    if (!folderId) {
      showToast('Enter a valid Google Drive folder URL or folder ID.', 'error')
      return
    }
    if (intervalError) {
      showToast(intervalError, 'error')
      return
    }

    const next = saveGoogleDriveConfig({
      clientId: clientIdInput.trim(),
      folderId,
      snapshots: {
        ...config.snapshots,
        enabled: snapshotEnabled,
        intervalMinutes: interval,
      },
    })
    setConfig(next)
    setFolderInput(next.folderId)
    setDriveError(undefined)
    showToast('Google Drive settings saved.', 'success')
  }

  const handleConnect = async () => {
    setIsBusy(true)
    setDriveError(undefined)
    try {
      const clientError = validateDriveClientId(config.clientId)
      if (clientError) throw new Error(clientError)
      await connectGoogleDrive(config.clientId)
      showToast('Google Drive connected for this session.', 'success')
    } catch (error) {
      showDriveError(error)
    } finally {
      setIsBusy(false)
    }
  }

  const handleDisconnect = () => {
    disconnectGoogleDrive()
    setDriveError(undefined)
    showToast('Google Drive disconnected.', 'success')
  }

  const handleTestFolder = async () => {
    setIsBusy(true)
    setDriveError(undefined)
    try {
      const token = getGoogleDriveAccessToken()
      if (!token) throw new Error('Connect Google Drive before testing folder access.')
      await testDriveFolderAccess(token, config.folderId)
      showToast('Folder write access confirmed.', 'success')
    } catch (error) {
      showDriveError(error)
    } finally {
      setIsBusy(false)
    }
  }

  const handleLoadDriveFiles = async () => {
    setIsBusy(true)
    setDriveError(undefined)
    try {
      const files = await listDriveImportCandidates(config)
      setDriveFiles(files)
      setSelectedDriveFileId(files[0]?.id ?? '')
      showToast(files.length > 0 ? 'Drive export files loaded.' : 'No Drive export files found.', 'success')
    } catch (error) {
      showDriveError(error)
    } finally {
      setIsBusy(false)
    }
  }

  const handleDriveImport = async () => {
    if (!selectedDriveFileId) {
      showToast('Select a Drive export file first.', 'error')
      return
    }
    setIsBusy(true)
    try {
      const result = await importPromptsFromDriveFile(config, selectedDriveFileId)
      setImportSource('drive')
      setImportResult(result)
    } catch (error) {
      showDriveError(error)
    } finally {
      setIsBusy(false)
    }
  }

  const handleLoadSnapshots = async () => {
    setIsBusy(true)
    setDriveError(undefined)
    try {
      const files = await listDriveSnapshots(config)
      setSnapshotFiles(files)
      setSelectedSnapshotId(files[0]?.id ?? '')
      showToast(files.length > 0 ? 'Drive snapshots loaded.' : 'No Drive snapshots found.', 'success')
    } catch (error) {
      showDriveError(error)
    } finally {
      setIsBusy(false)
    }
  }

  const handleRestoreSnapshot = async () => {
    if (!selectedSnapshotId) {
      showToast('Select a Drive snapshot first.', 'error')
      return
    }
    setIsBusy(true)
    try {
      const result = await importPromptsFromDriveFile(config, selectedSnapshotId)
      setImportSource('snapshot')
      setImportResult(result)
    } catch (error) {
      showDriveError(error)
    } finally {
      setIsBusy(false)
    }
  }

  const showDriveError = (error: unknown) => {
    const message = error instanceof Error ? error.message : 'Google Drive action failed.'
    setDriveError(message)
    showToast(message, 'error')
  }

  const currentCount = state.prompts.length
  const validCount = importResult?.valid.length ?? 0
  const errorCount = importResult?.errors.length ?? 0
  const importActionLabel = importSource === 'snapshot' ? 'Restore snapshot' : 'Import & replace'

  return (
    <>
      <div
        className="fixed inset-0 z-40 flex items-center justify-center overflow-y-auto bg-black/50 p-4"
        onClick={onClose}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Settings"
          className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-surface p-6 shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-text-heading">Settings</h2>
            <button
              onClick={onClose}
              aria-label="Close settings"
              className="rounded p-1 text-text transition-colors hover:bg-surface-muted"
            >
              <span aria-hidden="true">x</span>
            </button>
          </div>

          <section className="mb-6">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-text">Data</h3>
            <div className="flex flex-wrap gap-3">
              <button onClick={handleExport} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-heading hover:bg-surface-muted">
                Export JSON
              </button>
              <button onClick={handleImportClick} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-heading hover:bg-surface-muted">
                Import JSON
              </button>
              <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleFileChange} aria-hidden="true" />
            </div>
          </section>

          <section className="mb-6 rounded-lg border border-border p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-sm font-medium text-text-heading">Google Drive</h3>
              <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs text-text">{driveStatus.kind}</span>
            </div>
            <p className="mb-4 text-xs text-text">{driveStatus.message}</p>

            <div className="grid gap-3">
              <label className="grid gap-1 text-sm text-text-heading">
                Google OAuth Client ID
                <input
                  value={clientIdInput}
                  onChange={(event) => setClientIdInput(event.target.value)}
                  className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-text"
                  placeholder="1234567890-abc.apps.googleusercontent.com"
                />
              </label>
              <label className="grid gap-1 text-sm text-text-heading">
                Drive folder URL or ID
                <input
                  value={folderInput}
                  onChange={(event) => setFolderInput(event.target.value)}
                  className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-text"
                  placeholder="https://drive.google.com/drive/folders/..."
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-[1fr_10rem]">
                <label className="flex items-center gap-2 text-sm text-text-heading">
                  <input
                    type="checkbox"
                    checked={snapshotEnabled}
                    onChange={(event) => setSnapshotEnabled(event.target.checked)}
                  />
                  Enable visible Drive snapshots
                </label>
                <label className="grid gap-1 text-sm text-text-heading">
                  Interval minutes
                  <input
                    type="number"
                    min={5}
                    max={1440}
                    step={1}
                    value={snapshotIntervalInput}
                    onChange={(event) => setSnapshotIntervalInput(event.target.value)}
                    className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-text"
                  />
                </label>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={handleSaveDriveConfig} disabled={isBusy} className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-text-heading hover:bg-surface-muted disabled:opacity-50">
                  Save
                </button>
                <button onClick={handleConnect} disabled={isBusy || !config.clientId} className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-text-heading hover:bg-surface-muted disabled:opacity-50">
                  Connect
                </button>
                <button onClick={handleDisconnect} disabled={isBusy} className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-text-heading hover:bg-surface-muted disabled:opacity-50">
                  Disconnect
                </button>
                <button onClick={handleTestFolder} disabled={isBusy || !config.folderId} className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-text-heading hover:bg-surface-muted disabled:opacity-50">
                  Test folder
                </button>
              </div>
            </div>
          </section>

          <section className="mb-6 rounded-lg border border-border p-4">
            <h3 className="mb-3 text-sm font-medium text-text-heading">Drive import/export</h3>
            <div className="mb-3 flex flex-wrap gap-2">
              <button onClick={handleDriveExport} disabled={isBusy} className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-text-heading hover:bg-surface-muted disabled:opacity-50">
                Export to Drive
              </button>
              <button onClick={handleLoadDriveFiles} disabled={isBusy} className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-text-heading hover:bg-surface-muted disabled:opacity-50">
                Load Drive exports
              </button>
            </div>
            {driveFiles.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <select
                  value={selectedDriveFileId}
                  onChange={(event) => setSelectedDriveFileId(event.target.value)}
                  className="min-w-0 flex-1 rounded-md border border-border bg-surface px-3 py-2 text-sm text-text"
                  aria-label="Drive export file"
                >
                  {driveFiles.map((file) => (
                    <option key={file.id} value={file.id}>{file.name}</option>
                  ))}
                </select>
                <button onClick={handleDriveImport} disabled={isBusy} className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-text-heading hover:bg-surface-muted disabled:opacity-50">
                  Import selected
                </button>
              </div>
            )}
          </section>

          <section className="mb-3 rounded-lg border border-border p-4">
            <h3 className="mb-3 text-sm font-medium text-text-heading">Drive snapshots</h3>
            <div className="mb-3 flex flex-wrap gap-2">
              <button onClick={handleLoadSnapshots} disabled={isBusy} className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-text-heading hover:bg-surface-muted disabled:opacity-50">
                Load snapshots
              </button>
            </div>
            {snapshotFiles.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <select
                  value={selectedSnapshotId}
                  onChange={(event) => setSelectedSnapshotId(event.target.value)}
                  className="min-w-0 flex-1 rounded-md border border-border bg-surface px-3 py-2 text-sm text-text"
                  aria-label="Drive snapshot"
                >
                  {snapshotFiles.map((file) => (
                    <option key={file.id} value={file.id}>{file.name}</option>
                  ))}
                </select>
                <button onClick={handleRestoreSnapshot} disabled={isBusy} className="rounded-lg border border-border px-3 py-2 text-sm font-medium text-text-heading hover:bg-surface-muted disabled:opacity-50">
                  Restore selected
                </button>
              </div>
            )}
          </section>

          <section className="mb-3 rounded-lg border border-border p-4 opacity-50">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-text-heading">API Keys</h3>
              <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs text-text">coming soon</span>
            </div>
          </section>
        </div>
      </div>

      {importResult && (
        <Modal
          title={importSource === 'snapshot' ? 'Restore snapshot?' : 'Replace all prompts?'}
          onClose={() => setImportResult(null)}
          actions={[
            { label: 'Cancel', variant: 'secondary', onClick: () => setImportResult(null) },
            {
              label: isImporting ? 'Importing...' : importActionLabel,
              variant: 'danger',
              onClick: handleConfirmImport,
            },
          ]}
        >
          <p className="mb-3 text-text">
            Your <strong className="text-text-heading">{currentCount} current prompt{currentCount !== 1 ? 's' : ''}</strong> will be replaced by{' '}
            <strong className="text-text-heading">{validCount} imported prompt{validCount !== 1 ? 's' : ''}</strong>.
          </p>
          {importSource !== 'local' && (
            <p className="mb-3 text-xs text-text">
              If snapshots are enabled and Drive is connected, a pre-operation snapshot is created before replacing local data.
            </p>
          )}
          {errorCount > 0 && (
            <div className="mb-3 rounded-md bg-surface-muted p-3 text-xs">
              <p className="mb-1 font-medium text-text-heading">{errorCount} invalid entr{errorCount === 1 ? 'y' : 'ies'} will be skipped:</p>
              <ul className="list-disc space-y-0.5 pl-4 text-text">
                {importResult.errors.map((error) => (
                  <li key={error.index}>Entry #{error.index + 1}: {error.reason}</li>
                ))}
              </ul>
            </div>
          )}
          <p className="text-xs text-text">This action cannot be undone.</p>
        </Modal>
      )}

      <ToastContainer toasts={toasts} />
    </>
  )
}
