import { useState, type FormEvent } from 'react'

export interface VaultUnlockModalClassNames {
  wrapper?: string
  overlay?: string
  modal?: string
  title?: string
  description?: string
  input?: string
  button?: string
  error?: string
}

export interface VaultUnlockModalProps {
  onUnlock: (passphrase: string) => void | Promise<void>
  error: string | null
  classNames?: VaultUnlockModalClassNames
}

/**
 * Modal form for unlocking an existing encrypted vault.
 */
export function VaultUnlockModal({
  onUnlock,
  error,
  classNames = {},
}: VaultUnlockModalProps) {
  const [passphrase, setPassphrase] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!passphrase) return

    setIsSubmitting(true)
    try {
      await onUnlock(passphrase)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={classNames.wrapper ?? 'fixed inset-0 z-50 flex items-center justify-center bg-black/50'}>
      <div className={classNames.modal ?? 'relative w-full max-w-md rounded-lg bg-surface p-6 shadow-lg'}>
        <h2 className={classNames.title ?? 'mb-2 text-lg font-semibold text-text-heading'}>
          Unlock Vault
        </h2>
        <p className={classNames.description ?? 'mb-4 text-sm text-text-muted'}>
          Enter your passphrase to unlock the encrypted vault and restore your
          API keys.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="unlock-passphrase"
              className="mb-1 block text-sm font-medium text-text"
            >
              Passphrase
            </label>
            <input
              id="unlock-passphrase"
              type="password"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              placeholder="Enter passphrase"
              className={classNames.input ?? 'w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text'}
              autoFocus
            />
          </div>

          {error && (
            <p className={classNames.error ?? 'text-sm text-red-600'}>{error}</p>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting || !passphrase}
              className={classNames.button ?? 'rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50'}
            >
              {isSubmitting ? 'Unlocking...' : 'Unlock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}