import { useState, type FormEvent } from 'react'

export interface VaultCreateModalClassNames {
  wrapper?: string
  overlay?: string
  modal?: string
  title?: string
  description?: string
  input?: string
  button?: string
  error?: string
  skipLink?: string
}

export interface VaultCreateModalProps {
  onCreate: (passphrase: string) => void | Promise<void>
  onSkip: () => void
  error: string | null
  classNames?: VaultCreateModalClassNames
}

/**
 * Modal form for creating a new encrypted vault.
 * Validates passphrase length and confirmation match before calling `onCreate`.
 */
export function VaultCreateModal({
  onCreate,
  onSkip,
  error,
  classNames = {},
}: VaultCreateModalProps) {
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
    <div className={classNames.wrapper ?? 'fixed inset-0 z-50 flex items-center justify-center bg-black/50'}>
      <div className={classNames.modal ?? 'relative w-full max-w-md rounded-lg bg-surface p-6 shadow-lg'}>
        <h2 className={classNames.title ?? 'mb-2 text-lg font-semibold text-text-heading'}>
          Create Encrypted Vault
        </h2>
        <p className={classNames.description ?? 'mb-4 text-sm text-text-muted'}>
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
              className={classNames.input ?? 'w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text'}
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
              className={classNames.input ?? 'w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text'}
            />
          </div>

          {(validationError || error) && (
            <p className={classNames.error ?? 'text-sm text-red-600'}>
              {validationError || error}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onSkip}
              className={classNames.skipLink ?? 'rounded-md px-3 py-2 text-sm text-text-muted hover:text-text'}
            >
              Skip — session only
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={classNames.button ?? 'rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50'}
            >
              {isSubmitting ? 'Creating...' : 'Create vault'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}