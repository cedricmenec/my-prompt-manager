import { type ReactNode } from 'react'
import type { VaultPayloadBase } from '../core/types'
import { useVault } from './useVault'
import type { Vault } from '../core/vault'
import { VaultCreateModal } from './VaultCreateModal'
import { VaultUnlockModal } from './VaultUnlockModal'

export interface VaultGateClassNames {
  loading?: string
  banner?: string
  childrenWrapper?: string
}

export interface VaultGateProps<TPayload extends VaultPayloadBase> {
  vault: Vault<TPayload>
  children: ReactNode
  classNames?: VaultGateClassNames
}

/**
 * Guard component that conditionally renders children based on vault state.
 *
 * Shows appropriate modals for create/unlock flows and a banner when
 * Web Crypto is unavailable (session-only mode).
 */
export function VaultGate<TPayload extends VaultPayloadBase>({
  vault,
  children,
  classNames = {},
}: VaultGateProps<TPayload>) {
  const { state, error, create, unlock, skip } = useVault(vault)

  // Loading state
  if (state === 'loading') {
    return (
      <div className={classNames.loading ?? 'flex h-screen items-center justify-center bg-surface'}>
        <p className="text-text-muted text-sm">Checking vault status...</p>
      </div>
    )
  }

  // Web Crypto unavailable — session-only mode
  if (state === 'crypto-unavailable') {
    return (
      <>
        <div className={classNames.banner ?? 'bg-yellow-100 border-b border-yellow-300 px-4 py-2 text-sm text-yellow-800'}>
          Encryption unavailable — keys are session-only
        </div>
        <div className={classNames.childrenWrapper ?? ''}>{children}</div>
      </>
    )
  }

  // No vault — show create modal
  if (state === 'no-vault') {
    return <VaultCreateModal onCreate={create} onSkip={skip} error={error} />
  }

  // Vault exists but locked
  if (state === 'locked') {
    return <VaultUnlockModal onUnlock={unlock} error={error} />
  }

  // Vault unlocked — render children
  return <div className={classNames.childrenWrapper ?? ''}>{children}</div>
}