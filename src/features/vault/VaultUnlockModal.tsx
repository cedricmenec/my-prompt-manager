import { useState, type FormEvent } from 'react'
import { Button } from '@/shared/ui/Button'

interface VaultUnlockModalProps {
  onUnlock: (passphrase: string) => void | Promise<void>
  error: string | null
}

export function VaultUnlockModal({ onUnlock, error }: VaultUnlockModalProps) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-md rounded-lg bg-surface p-6 shadow-lg">
        <h2 className="mb-2 text-lg font-semibold text-text-heading">
          Unlock Vault
        </h2>
        <p className="mb-4 text-sm text-text-muted">
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
              className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text"
              autoFocus
            />
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting || !passphrase}>
              {isSubmitting ? 'Unlocking...' : 'Unlock'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
