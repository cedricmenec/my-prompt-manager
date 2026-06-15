import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import 'fake-indexeddb/auto'
import { IDBFactory } from 'fake-indexeddb'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { resetDb } from '@/infrastructure/db'
import { VaultCreateModal } from './VaultCreateModal'
import { VaultUnlockModal } from './VaultUnlockModal'
import { VaultGate } from './VaultGate'
import {
  lockVault,
  deleteVault,
  createVault,
} from '@/infrastructure/vault'

function cloneForTest<T>(value: T): T {
  return value
}

beforeEach(async () => {
  globalThis.indexedDB = new IDBFactory()
  globalThis.structuredClone = cloneForTest
  resetDb()
  sessionStorage.clear()
  localStorage.clear()
  await deleteVault()
  lockVault()
})

describe('VaultCreateModal', () => {
  it('renders passphrase inputs and buttons', () => {
    render(
      <VaultCreateModal onCreate={vi.fn()} onSkip={vi.fn()} error={null} />,
    )

    expect(screen.getByLabelText('Passphrase')).toBeTruthy()
    expect(screen.getByLabelText('Confirm passphrase')).toBeTruthy()
    expect(screen.getByText('Create vault')).toBeTruthy()
    expect(screen.getByText('Skip — session only')).toBeTruthy()
  })

  it('shows validation error for short passphrase', async () => {
    const onCreate = vi.fn()
    render(<VaultCreateModal onCreate={onCreate} onSkip={vi.fn()} error={null} />)

    fireEvent.change(screen.getByLabelText('Passphrase'), {
      target: { value: 'short' },
    })
    fireEvent.change(screen.getByLabelText('Confirm passphrase'), {
      target: { value: 'short' },
    })
    fireEvent.click(screen.getByText('Create vault'))

    expect(screen.getByText('Passphrase must be at least 8 characters')).toBeTruthy()
    expect(onCreate).not.toHaveBeenCalled()
  })

  it('shows validation error for mismatched passphrases', () => {
    const onCreate = vi.fn()
    render(<VaultCreateModal onCreate={onCreate} onSkip={vi.fn()} error={null} />)

    fireEvent.change(screen.getByLabelText('Passphrase'), {
      target: { value: 'passphrase-one' },
    })
    fireEvent.change(screen.getByLabelText('Confirm passphrase'), {
      target: { value: 'passphrase-two' },
    })
    fireEvent.click(screen.getByText('Create vault'))

    expect(screen.getByText('Passphrases do not match')).toBeTruthy()
    expect(onCreate).not.toHaveBeenCalled()
  })

  it('calls onCreate with valid passphrase', async () => {
    const onCreate = vi.fn().mockResolvedValue(undefined)
    render(<VaultCreateModal onCreate={onCreate} onSkip={vi.fn()} error={null} />)

    fireEvent.change(screen.getByLabelText('Passphrase'), {
      target: { value: 'secure-passphrase' },
    })
    fireEvent.change(screen.getByLabelText('Confirm passphrase'), {
      target: { value: 'secure-passphrase' },
    })
    fireEvent.click(screen.getByText('Create vault'))

    await waitFor(() => {
      expect(onCreate).toHaveBeenCalledWith('secure-passphrase')
    })
  })

  it('calls onSkip when Skip button is clicked', () => {
    const onSkip = vi.fn()
    render(<VaultCreateModal onCreate={vi.fn()} onSkip={onSkip} error={null} />)

    fireEvent.click(screen.getByText('Skip — session only'))
    expect(onSkip).toHaveBeenCalled()
  })

  it('displays error from parent', () => {
    render(
      <VaultCreateModal onCreate={vi.fn()} onSkip={vi.fn()} error="Vault creation failed" />,
    )

    expect(screen.getByText('Vault creation failed')).toBeTruthy()
  })
})

describe('VaultUnlockModal', () => {
  it('renders passphrase input and unlock button', () => {
    render(<VaultUnlockModal onUnlock={vi.fn()} error={null} />)

    expect(screen.getByLabelText('Passphrase')).toBeTruthy()
    expect(screen.getByText('Unlock')).toBeTruthy()
  })

  it('disables unlock button when passphrase is empty', () => {
    render(<VaultUnlockModal onUnlock={vi.fn()} error={null} />)

    const unlockButton = screen.getByRole('button', { name: 'Unlock' })
    expect(unlockButton.hasAttribute('disabled')).toBe(true)
  })

  it('enables unlock button when passphrase is entered', () => {
    render(<VaultUnlockModal onUnlock={vi.fn()} error={null} />)

    fireEvent.change(screen.getByLabelText('Passphrase'), {
      target: { value: 'my-pass' },
    })

    const unlockButton = screen.getByRole('button', { name: 'Unlock' })
    expect(unlockButton.hasAttribute('disabled')).toBe(false)
  })

  it('calls onUnlock with passphrase', async () => {
    const onUnlock = vi.fn().mockResolvedValue(undefined)
    render(<VaultUnlockModal onUnlock={onUnlock} error={null} />)

    fireEvent.change(screen.getByLabelText('Passphrase'), {
      target: { value: 'correct-passphrase' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Unlock' }))

    await waitFor(() => {
      expect(onUnlock).toHaveBeenCalledWith('correct-passphrase')
    })
  })

  it('displays error from parent', () => {
    render(<VaultUnlockModal onUnlock={vi.fn()} error="Wrong password, try again" />)

    expect(screen.getByText('Wrong password, try again')).toBeTruthy()
  })
})

describe('VaultGate', () => {
  it('shows loading state initially', () => {
    render(<VaultGate>App content</VaultGate>)

    expect(screen.getByText('Checking vault status...')).toBeTruthy()
  })

  it('shows create modal when no vault exists', async () => {
    render(<VaultGate>App content</VaultGate>)

    await waitFor(() => {
      expect(screen.getByText('Create Encrypted Vault')).toBeTruthy()
    })
  })

  it('renders children when Skip is clicked', async () => {
    render(<VaultGate>App content</VaultGate>)

    await waitFor(() => {
      expect(screen.getByText('Create Encrypted Vault')).toBeTruthy()
    })

    fireEvent.click(screen.getByText('Skip — session only'))

    await waitFor(() => {
      expect(screen.getByText('App content')).toBeTruthy()
    })
  })

  it('auto-unlocks vault when valid session cache exists', async () => {
    // Create a vault first (uses real Web Crypto + fake IndexedDB)
    await createVault('test-passphrase-here')
    lockVault()

    // Manually populate the session cache with the correct passphrase
    sessionStorage.setItem(
      'vault-session-cache',
      JSON.stringify({ passphrase: 'test-passphrase-here', unlockedAt: Date.now() }),
    )

    render(<VaultGate>App content</VaultGate>)

    // Should render children directly without showing unlock modal
    await waitFor(() => {
      expect(screen.getByText('App content')).toBeTruthy()
      expect(screen.queryByText('Unlock Vault')).toBeNull()
    })
  })

  it('shows unlock modal when session cache passphrase is wrong', async () => {
    await createVault('test-passphrase-here')
    lockVault()

    // Cache a wrong passphrase
    sessionStorage.setItem(
      'vault-session-cache',
      JSON.stringify({ passphrase: 'wrong-passphrase', unlockedAt: Date.now() }),
    )

    render(<VaultGate>App content</VaultGate>)

    // Auto-unlock fails → should show the unlock modal
    await waitFor(() => {
      expect(screen.getByText('Unlock Vault')).toBeTruthy()
    })
  })

  it('shows unlock modal when session cache TTL has expired', async () => {
    localStorage.setItem('vault-session-ttl', '15') // 15 minute TTL
    await createVault('test-passphrase-here')
    lockVault()

    // Cache passphrase but with an old timestamp (20 min ago)
    sessionStorage.setItem(
      'vault-session-cache',
      JSON.stringify({
        passphrase: 'test-passphrase-here',
        unlockedAt: Date.now() - 20 * 60 * 1000,
      }),
    )

    render(<VaultGate>App content</VaultGate>)

    await waitFor(() => {
      expect(screen.getByText('Unlock Vault')).toBeTruthy()
    })
  })
})
