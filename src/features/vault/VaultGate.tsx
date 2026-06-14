import { type ReactNode, useEffect, useState } from 'react'
import {
  isVaultAvailable,
  isUnlocked,
  createVault,
  unlockVault,
  tryAutoUnlock,
} from '@/infrastructure/vault'
import { isWebCryptoAvailable } from '@/infrastructure/vault/vaultCrypto'
import { VaultCreateModal } from './VaultCreateModal'
import { VaultUnlockModal } from './VaultUnlockModal'

interface VaultGateProps {
  children: ReactNode
}

type VaultState = 'loading' | 'no-vault' | 'locked' | 'unlocked' | 'crypto-unavailable'

export function VaultGate({ children }: VaultGateProps) {
  const [vaultState, setVaultState] = useState<VaultState>('loading')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check Web Crypto availability first
    if (!isWebCryptoAvailable()) {
      setVaultState('crypto-unavailable')
      return
    }

    // Check vault state
    isVaultAvailable()
      .then(async (available) => {
        if (available) {
          if (isUnlocked()) {
            setVaultState('unlocked')
          } else {
            // Try auto-unlock with cached passphrase before showing modal
            const autoUnlocked = await tryAutoUnlock()
            if (autoUnlocked) {
              setVaultState('unlocked')
            } else {
              setVaultState('locked')
            }
          }
        } else {
          setVaultState('no-vault')
        }
      })
      .catch((err) => {
        console.error('[VaultGate] Failed to check vault state:', err)
        // Fall back to session-only mode on DB errors
        setVaultState('crypto-unavailable')
      })
  }, [])

  const handleCreateVault = async (passphrase: string) => {
    try {
      setError(null)
      await createVault(passphrase)
      setVaultState('unlocked')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create vault')
    }
  }

  const handleSkip = () => {
    setVaultState('unlocked')
  }

  const handleUnlock = async (passphrase: string) => {
    try {
      setError(null)
      await unlockVault(passphrase)
      setVaultState('unlocked')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unlock vault')
    }
  }

  // Loading state
  if (vaultState === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center bg-surface">
        <p className="text-text-muted text-sm">Checking vault status...</p>
      </div>
    )
  }

  // Web Crypto unavailable — session-only mode
  if (vaultState === 'crypto-unavailable') {
    return (
      <>
        <div className="bg-yellow-100 border-b border-yellow-300 px-4 py-2 text-sm text-yellow-800">
          Encryption unavailable — keys are session-only
        </div>
        {children}
      </>
    )
  }

  // No vault — show create modal or allow skip
  if (vaultState === 'no-vault') {
    return (
      <VaultCreateModal
        onCreate={handleCreateVault}
        onSkip={handleSkip}
        error={error}
      />
    )
  }

  // Vault exists but locked — show unlock modal
  if (vaultState === 'locked') {
    return (
      <VaultUnlockModal
        onUnlock={handleUnlock}
        error={error}
      />
    )
  }

  // Vault unlocked — render children
  return <>{children}</>
}
