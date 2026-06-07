import { useState, type FormEvent } from 'react'
import { Button } from '@/shared/ui/Button'

interface VaultCreateModalProps {
  onCreate: (passphrase: string) => void | Promise<void>
  onSkip: () => void
  error: string | null
}

export function VaultCreateModal({ onCreate, onSkip, error }: VaultCreateModalProps) {
  const [passphrase, setPassphrase] = useState('')
  const [confirmPassphrase, setConfirmPassphrase] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setValidationError(null)

    if (passphrase.length < 8) {
      setValidationError('Passphrase must be at least 8 characters')
      return
    }

    if (passphrase !== confirmPassphrase) {
      setValidationError('Passphrases do not match')
      return
    }

    setIsSubmitting(true)
    try {
      await onCreate(passphrase)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-md rounded-lg bg-surface p-6 shadow-lg">
        <h2 className="mb-2 text-lg font-semibold text-text-heading">
          Create Encrypted Vault
        </h2>
        <p className="mb-4 text-sm text-text-muted">
          Protect your API keys with a passphrase. The encryption key stays in
          memory only — it is never written to disk.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="vault-passphrase"
              className="mb-1 block text-sm font-medium text-text"
            >
              Passphrase
            </label>
            <input
              id="vault-passphrase"
              type="password"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              placeholder="At least 8 characters"
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text"
              autoFocus
            />
          </div>

          <div>
            <label
              htmlFor="vault-confirm-passphrase"
              className="mb-1 block text-sm font-medium text-text"
            >
              Confirm passphrase
            </label>
            <input
              id="vault-confirm-passphrase"
              type="password"
              value={confirmPassphrase}
              onChange={(e) => setConfirmPassphrase(e.target.value)}
              placeholder="Re-enter passphrase"
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text"
            />
          </div>

          {(validationError || error) && (
            <p className="text-sm text-red-600">
              {validationError || error}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="secondary" type="button" onClick={onSkip}>
              Skip — session only
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create vault'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
