import { useState, useRef, useEffect } from 'react'
import type { Vault } from '../core/vault'
import type { VaultPayloadBase, TTLMinutes } from '../core/types'
import { getTTLConfig } from '../core/session'
import { isWebCryptoAvailable } from '../core/crypto'

export interface VaultSettingsClassNames {
  section?: string
  title?: string
  status?: string
  button?: string
  dangerButton?: string
  ttlGroup?: string
  ttlOption?: string
  passphraseForm?: string
}

export interface VaultSettingsProps<TPayload extends VaultPayloadBase> {
  vault: Vault<TPayload>
  classNames?: VaultSettingsClassNames
}

const TTL_OPTIONS: { value: TTLMinutes; label: string; description: string }[] = [
  { value: 0, label: 'Disabled', description: 'Prompt every time (most secure)' },
  { value: 15, label: '15 minutes', description: 'Higher security' },
  { value: 60, label: '1 hour', description: 'Balanced (recommended)' },
  { value: 240, label: '4 hours', description: 'Extended convenience' },
  { value: -1, label: 'Session', description: 'No auto-lock (until tab closed)' },
]

/**
 * Comprehensive vault management panel.
 *
 * Provides status display, export/import, change passphrase,
 * delete vault, and session TTL configuration.
 */
export function VaultSettings<TPayload extends VaultPayloadBase>({
  vault,
  classNames = {},
}: VaultSettingsProps<TPayload>) {
  const [status, setStatus] = useState<{ available: boolean; unlocked: boolean }>({
    available: false,
    unlocked: false,
  })
  const [isBusy, setIsBusy] = useState(false)
  const [showChangePassphrase, setShowChangePassphrase] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [currentPassphrase, setCurrentPassphrase] = useState('')
  const [newPassphrase, setNewPassphrase] = useState('')
  const [confirmNewPassphrase, setConfirmNewPassphrase] = useState('')
  const [ttlConfig, setTtlConfig] = useState<TTLMinutes>(getTTLConfig)
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const importInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    vault.isAvailable().then((available) => {
      setStatus({ available, unlocked: vault.isUnlocked() })
    })
  }, [vault])

  const refreshStatus = async () => {
    const available = await vault.isAvailable()
    setStatus({ available, unlocked: vault.isUnlocked() })
  }

  const showToast = (text: string, type: 'success' | 'error') => {
    setToastMessage({ text, type })
    setTimeout(() => setToastMessage(null), 3000)
  }

  // --- Export ---
  const handleExport = async () => {
    setIsBusy(true)
    try {
      const data = await vault.export()
      if (!data) {
        showToast('No vault to export.', 'error')
        return
      }

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const date = new Date().toISOString().slice(0, 10)
      a.href = url
      a.download = `vault-${date}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      showToast('Vault exported.', 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Export failed.', 'error')
    } finally {
      setIsBusy(false)
    }
  }

  // --- Import ---
  const handleImportClick = () => {
    importInputRef.current?.click()
  }

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    setIsBusy(true)
    try {
      const text = await file.text()
      const jsonData = JSON.parse(text)

      const passphrase = window.prompt('Enter the passphrase for the imported vault:')
      if (!passphrase) {
        showToast('Import cancelled.', 'error')
        return
      }

      await vault.import(jsonData, passphrase)
      await refreshStatus()
      showToast('Vault imported and unlocked.', 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Import failed.', 'error')
    } finally {
      setIsBusy(false)
    }
  }

  // --- Change passphrase ---
  const handleChangePassphrase = async () => {
    if (!newPassphrase || newPassphrase.length < 8) {
      showToast('New passphrase must be at least 8 characters.', 'error')
      return
    }
    if (newPassphrase !== confirmNewPassphrase) {
      showToast('New passphrases do not match.', 'error')
      return
    }

    setIsBusy(true)
    try {
      await vault.changePassphrase(currentPassphrase, newPassphrase)
      setShowChangePassphrase(false)
      setCurrentPassphrase('')
      setNewPassphrase('')
      setConfirmNewPassphrase('')
      showToast('Passphrase changed.', 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed.', 'error')
    } finally {
      setIsBusy(false)
    }
  }

  // --- Delete vault ---
  const handleDeleteVault = async () => {
    setIsBusy(true)
    try {
      await vault.delete()
      vault.lock()
      setShowDeleteConfirm(false)
      await refreshStatus()
      showToast('Vault deleted. Keys are now session-only.', 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed.', 'error')
    } finally {
      setIsBusy(false)
    }
  }

  // --- Create vault ---
  const handleCreateVault = async () => {
    const passphrase = window.prompt('Enter a passphrase for the new vault (at least 8 characters):')
    if (!passphrase) return
    if (passphrase.length < 8) {
      showToast('Passphrase must be at least 8 characters.', 'error')
      return
    }

    const confirm = window.prompt('Confirm passphrase:')
    if (confirm !== passphrase) {
      showToast('Passphrases do not match.', 'error')
      return
    }

    setIsBusy(true)
    try {
      await vault.create(passphrase)
      await refreshStatus()
      showToast('Vault created.', 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed.', 'error')
    } finally {
      setIsBusy(false)
    }
  }

  // --- TTL ---
  const handleTTLChange = (value: TTLMinutes) => {
    setTtlConfig(value)
    vault.setSessionTTL(value)
    showToast(`Session timeout set to ${TTL_OPTIONS.find((o) => o.value === value)?.label ?? value}`, 'success')
  }

  if (!isWebCryptoAvailable()) {
    return (
      <div className={classNames.section ?? 'grid gap-5'}>
        <p className="text-sm text-text-muted">
          Encryption is not available in this browser context. Vault features
          require a secure context (HTTPS or localhost).
        </p>
      </div>
    )
  }

  const sectionClass = classNames.section ?? 'grid gap-5'
  const titleClass = classNames.title ?? 'text-sm font-semibold uppercase tracking-wider text-text'
  const buttonClass = classNames.button ?? 'rounded-md border border-border bg-surface px-4 py-2 text-sm text-text hover:bg-surface-hover disabled:opacity-50'
  const dangerBtnClass = classNames.dangerButton ?? 'rounded-md bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50'

  return (
    <div className={sectionClass}>
      <h3 className={titleClass}>Encrypted Vault</h3>

      {/* Warning */}
      <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-800">
        If you lose your passphrase, your encrypted data cannot be recovered.
        Consider keeping a secure backup of your vault file.
      </div>

      {/* Status */}
      <div className={classNames.status ?? 'text-sm text-text'}>
        <strong>Status:</strong>{' '}
        {status.available
          ? status.unlocked
            ? 'Unlocked ✓'
            : 'Locked'
          : 'No vault configured'}
      </div>

      {/* Toast */}
      {toastMessage && (
        <div
          className={`rounded-md px-3 py-2 text-sm ${
            toastMessage.type === 'success'
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {toastMessage.text}
        </div>
      )}

      {/* Actions when no vault */}
      {!status.available && (
        <div className="flex gap-3">
          <button onClick={handleCreateVault} disabled={isBusy} className={buttonClass}>
            Create vault
          </button>
        </div>
      )}

      {/* Actions when vault exists */}
      {status.available && (
        <div className="flex flex-wrap gap-3">
          <button onClick={handleExport} disabled={isBusy} className={buttonClass}>
            Export vault
          </button>

          <button onClick={handleImportClick} disabled={isBusy} className={buttonClass}>
            Import vault
          </button>
          <input
            ref={importInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImportFile}
          />

          <button
            onClick={() => setShowChangePassphrase(!showChangePassphrase)}
            disabled={isBusy}
            className={buttonClass}
          >
            Change passphrase
          </button>

          <button
            onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
            disabled={isBusy}
            className={dangerBtnClass}
          >
            Delete vault
          </button>
        </div>
      )}

      {/* Change passphrase form */}
      {showChangePassphrase && (
        <div className={classNames.passphraseForm ?? 'rounded-lg border border-border p-4 space-y-3'}>
          <h4 className="text-sm font-medium text-text-heading">Change passphrase</h4>

          <div>
            <label htmlFor="sdk-current-passphrase" className="mb-1 block text-xs text-text-muted">
              Current passphrase
            </label>
            <input
              id="sdk-current-passphrase"
              type="password"
              value={currentPassphrase}
              onChange={(e) => setCurrentPassphrase(e.target.value)}
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text"
            />
          </div>

          <div>
            <label htmlFor="sdk-new-passphrase" className="mb-1 block text-xs text-text-muted">
              New passphrase
            </label>
            <input
              id="sdk-new-passphrase"
              type="password"
              value={newPassphrase}
              onChange={(e) => setNewPassphrase(e.target.value)}
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text"
            />
          </div>

          <div>
            <label htmlFor="sdk-confirm-new-passphrase" className="mb-1 block text-xs text-text-muted">
              Confirm new passphrase
            </label>
            <input
              id="sdk-confirm-new-passphrase"
              type="password"
              value={confirmNewPassphrase}
              onChange={(e) => setConfirmNewPassphrase(e.target.value)}
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text"
            />
          </div>

          <button onClick={handleChangePassphrase} disabled={isBusy} className={buttonClass}>
            Change passphrase
          </button>
        </div>
      )}

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-4 space-y-3">
          <h4 className="text-sm font-medium text-red-800">Delete vault?</h4>
          <p className="text-sm text-red-700">
            This will permanently delete your encrypted vault and all stored API keys.
            This action cannot be undone.
          </p>
          <button onClick={handleDeleteVault} disabled={isBusy} className={dangerBtnClass}>
            {isBusy ? 'Deleting...' : 'Confirm delete vault'}
          </button>
        </div>
      )}

      {/* Session TTL configuration */}
      {status.available && (
        <div className={classNames.ttlGroup ?? 'grid gap-2'}>
          <h4 className="text-sm font-medium text-text-heading">Session timeout</h4>
          <div className="flex flex-wrap gap-2">
            {TTL_OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => handleTTLChange(option.value)}
                className={
                  classNames.ttlOption ??
                  `rounded-md border px-3 py-1.5 text-xs transition-colors ${
                    ttlConfig === option.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-border bg-surface text-text-muted hover:bg-surface-hover'
                  }`
                }
                title={option.description}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}