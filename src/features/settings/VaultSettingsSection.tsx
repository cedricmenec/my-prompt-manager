import { useEffect, useState, useRef } from 'react'
import { Button } from '@/shared/ui/Button'
import { useToast } from '@/shared/ui/useToast'
import {
  isVaultAvailable,
  isUnlocked,
  exportVault,
  importVault,
  changePassphrase,
  deleteVault,
  createVault,
  lockVault,
} from '@/infrastructure/vault'
import { isWebCryptoAvailable } from '@/infrastructure/vault/vaultCrypto'
import { getTTLConfig, setTTLConfig, type TTLMinutes } from '@/infrastructure/vault/vaultSession'

interface VaultStatus {
  available: boolean
  unlocked: boolean
}

const TTL_OPTIONS: { value: TTLMinutes; label: string; description: string }[] = [
  { value: 0, label: 'Disabled', description: 'Prompt every time (most secure)' },
  { value: 15, label: '15 minutes', description: 'Higher security' },
  { value: 60, label: '1 hour', description: 'Balanced (recommended)' },
  { value: 240, label: '4 hours', description: 'Extended convenience' },
  { value: -1, label: 'Session', description: 'No auto-lock (until tab closed)' },
]

export function VaultSettingsSection() {
  const { show: showToast } = useToast()
  const [status, setStatus] = useState<VaultStatus>({ available: false, unlocked: false })
  const [isBusy, setIsBusy] = useState(false)
  const [showChangePassphrase, setShowChangePassphrase] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [currentPassphrase, setCurrentPassphrase] = useState('')
  const [newPassphrase, setNewPassphrase] = useState('')
  const [confirmNewPassphrase, setConfirmNewPassphrase] = useState('')
  const [_deletePassphrase, setDeletePassphrase] = useState('')
  const [ttlConfig, setTtlConfig] = useState<TTLMinutes>(getTTLConfig)
  const importInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    isVaultAvailable().then((available) => {
      setStatus({ available, unlocked: isUnlocked() })
    })
  }, [])

  // Refresh status after operations
  const refreshStatus = async () => {
    const available = await isVaultAvailable()
    setStatus({ available, unlocked: isUnlocked() })
  }

  // --- Export ---
  const handleExport = async () => {
    setIsBusy(true)
    try {
      const data = await exportVault()
      if (!data) {
        showToast('No vault to export.', 'error')
        return
      }

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const date = new Date().toISOString().slice(0, 10)
      a.href = url
      a.download = `byo-vault-${date}.json`
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

      // Prompt for passphrase
      const passphrase = window.prompt('Enter the passphrase for the imported vault:')
      if (!passphrase) {
        showToast('Import cancelled.', 'error')
        return
      }

      await importVault(jsonData, passphrase)
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
      await changePassphrase(currentPassphrase, newPassphrase)
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
      await deleteVault()
      lockVault()
      setShowDeleteConfirm(false)
      setDeletePassphrase('')
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
      await createVault(passphrase)
      await refreshStatus()
      showToast('Vault created.', 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed.', 'error')
    } finally {
      setIsBusy(false)
    }
  }

  if (!isWebCryptoAvailable()) {
    return (
      <div className="grid gap-5">
        <p className="text-sm text-text-muted">
          Encryption is not available in this browser context. Vault features
          require a secure context (HTTPS or localhost).
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-5">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-text">Encrypted Vault</h3>

      {/* Warning */}
      <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-800">
        If you lose your passphrase, your encrypted data cannot be recovered.
        Consider keeping a secure backup of your vault file.
      </div>

      {/* Status */}
      <div className="text-sm text-text">
        <strong>Status:</strong>{' '}
        {status.available
          ? status.unlocked
            ? 'Unlocked ✓'
            : 'Locked'
          : 'No vault configured'}
      </div>

      {/* Actions when no vault */}
      {!status.available && (
        <div className="flex gap-3">
          <Button onClick={handleCreateVault} disabled={isBusy}>
            Create vault
          </Button>
        </div>
      )}

      {/* Actions when vault exists */}
      {status.available && (
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={handleExport} disabled={isBusy}>
            Export vault
          </Button>

          <Button variant="secondary" onClick={handleImportClick} disabled={isBusy}>
            Import vault
          </Button>
          <input
            ref={importInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImportFile}
          />

          <Button
            variant="secondary"
            onClick={() => setShowChangePassphrase(!showChangePassphrase)}
            disabled={isBusy}
          >
            Change passphrase
          </Button>

          <Button
            variant="danger"
            onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
            disabled={isBusy}
          >
            Delete vault
          </Button>
        </div>
      )}

      {/* Change passphrase form */}
      {showChangePassphrase && (
        <div className="rounded-lg border border-border p-4 space-y-3">
          <h4 className="text-sm font-medium text-text-heading">Change passphrase</h4>

          <div>
            <label htmlFor="current-passphrase" className="mb-1 block text-xs text-text-muted">
              Current passphrase
            </label>
            <input
              id="current-passphrase"
              type="password"
              value={currentPassphrase}
              onChange={(e) => setCurrentPassphrase(e.target.value)}
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text"
            />
          </div>

          <div>
            <label htmlFor="new-passphrase" className="mb-1 block text-xs text-text-muted">
              New passphrase
            </label>
            <input
              id="new-passphrase"
              type="password"
              value={newPassphrase}
              onChange={(e) => setNewPassphrase(e.target.value)}
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text"
            />
          </div>

          <div>
            <label htmlFor="confirm-new-passphrase" className="mb-1 block text-xs text-text-muted">
              Confirm new passphrase
            </label>
            <input
              id="confirm-new-passphrase"
              type="password"
              value={confirmNewPassphrase}
              onChange={(e) => setConfirmNewPassphrase(e.target.value)}
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setShowChangePassphrase(false)
                setCurrentPassphrase('')
                setNewPassphrase('')
                setConfirmNewPassphrase('')
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleChangePassphrase} disabled={isBusy}>
              Change passphrase
            </Button>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <div className="rounded-lg border border-red-300 bg-red-50 p-4 space-y-3">
          <h4 className="text-sm font-medium text-red-800">Delete vault?</h4>
          <p className="text-sm text-red-700">
            This will permanently remove the encrypted vault. API keys will
            revert to session-only mode.
          </p>
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setShowDeleteConfirm(false)
                setDeletePassphrase('')
              }}
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteVault} disabled={isBusy}>
              Delete vault
            </Button>
          </div>
        </div>
      )}

      {/* Session timeout — only visible when a vault exists */}
      {status.available && (
        <div className="rounded-lg border border-border p-4 space-y-3">
          <h4 className="text-sm font-medium text-text-heading">Session timeout</h4>
          <p className="text-xs text-text-muted">
            Controls how long the vault stays unlocked after a page reload.
            Longer intervals are more convenient but less secure.
          </p>
          <div className="space-y-2" role="radiogroup" aria-label="Session timeout">
            {TTL_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className="flex cursor-pointer items-center gap-2 text-sm text-text"
              >
                <input
                  type="radio"
                  name="vault-ttl"
                  value={opt.value}
                  checked={ttlConfig === opt.value}
                  onChange={() => {
                    setTtlConfig(opt.value)
                    setTTLConfig(opt.value)
                  }}
                  className="accent-primary"
                />
                <span className="font-medium">{opt.label}</span>
                <span className="text-xs text-text-muted">— {opt.description}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
