import { useEffect, useState, useCallback } from 'react'
import type { Vault } from '../core/vault'
import type { VaultPayloadBase } from '../core/types'
import { isWebCryptoAvailable } from '../core/crypto'

export type VaultState = 'loading' | 'no-vault' | 'locked' | 'unlocked' | 'crypto-unavailable'

export interface UseVaultResult<TPayload extends VaultPayloadBase> {
  state: VaultState
  error: string | null
  vault: Vault<TPayload>
  create: (passphrase: string) => Promise<void>
  unlock: (passphrase: string) => Promise<void>
  lock: () => void
  skip: () => void
}

/**
 * React hook that tracks vault state and exposes convenience methods.
 *
 * @example
 * ```tsx
 * const { state, error, create, unlock } = useVault(vault)
 * ```
 */
export function useVault<TPayload extends VaultPayloadBase>(
  vault: Vault<TPayload>,
): UseVaultResult<TPayload> {
  const [state, setState] = useState<VaultState>('loading')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isWebCryptoAvailable()) {
      setState('crypto-unavailable')
      return
    }

    vault.isAvailable()
      .then(async (available) => {
        if (available) {
          if (vault.isUnlocked()) {
            setState('unlocked')
          } else {
            const autoUnlocked = await vault.tryAutoUnlock()
            if (autoUnlocked) {
              setState('unlocked')
            } else {
              setState('locked')
            }
          }
        } else {
          setState('no-vault')
        }
      })
      .catch((err) => {
        console.error('[useVault] Failed to check vault state:', err)
        setState('crypto-unavailable')
      })
  }, [vault])

  const create = useCallback(async (passphrase: string) => {
    try {
      setError(null)
      await vault.create(passphrase)
      setState('unlocked')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create vault')
    }
  }, [vault])

  const unlock = useCallback(async (passphrase: string) => {
    try {
      setError(null)
      await vault.unlock(passphrase)
      setState('unlocked')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unlock vault')
    }
  }, [vault])

  const lock = useCallback(() => {
    vault.lock()
    setState('locked')
  }, [vault])

  const skip = useCallback(() => {
    setState('unlocked')
  }, [])

  return { state, error, vault, create, unlock, lock, skip }
}