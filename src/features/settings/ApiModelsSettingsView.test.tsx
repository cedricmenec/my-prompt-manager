import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import 'fake-indexeddb/auto'
import { IDBFactory } from 'fake-indexeddb'
import { resetDb } from '@/infrastructure/db'
import { ApiModelsSettingsView } from './ApiModelsSettingsView'

function cloneForTest<T>(value: T): T {
  return value
}

beforeEach(() => {
  globalThis.structuredClone = cloneForTest
  globalThis.indexedDB = new IDBFactory()
  resetDb()
  vi.restoreAllMocks()
})

describe('ApiModelsSettingsView', () => {
  it('validates missing OpenRouter keys before loading models', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    render(<ApiModelsSettingsView />)

    fireEvent.click(screen.getByText('Load models'))

    expect(await screen.findByText('Enter an OpenRouter API key before loading models.')).toBeTruthy()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('loads, searches, selects multiple models, and restores selections after reload', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            data: [
              { id: 'openai/gpt-alpha', name: 'GPT Alpha', architecture: { input_modalities: ['text'] } },
              { id: 'anthropic/claude-beta', name: 'Claude Beta', architecture: { input_modalities: ['text'] } },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      ),
    )

    const { unmount } = render(<ApiModelsSettingsView />)
    fireEvent.change(screen.getByLabelText('API key'), { target: { value: 'sk-or-session' } })
    fireEvent.click(screen.getByText('Load models'))

    expect(await screen.findByText('GPT Alpha')).toBeTruthy()
    fireEvent.change(screen.getByLabelText('Search models'), { target: { value: 'claude' } })
    expect(screen.getByText('Claude Beta')).toBeTruthy()
    expect(screen.queryByText('GPT Alpha')).toBeNull()

    fireEvent.click(screen.getByLabelText('Enable Claude Beta'))
    fireEvent.change(screen.getByLabelText('Search models'), { target: { value: '' } })
    fireEvent.click(screen.getByLabelText('Enable GPT Alpha'))

    await waitFor(() => expect(screen.getByText('2 enabled models')).toBeTruthy())
    unmount()

    render(<ApiModelsSettingsView />)
    expect(await screen.findByText('Claude Beta')).toBeTruthy()
    await waitFor(() => expect((screen.getByLabelText('Enable Claude Beta') as HTMLInputElement).checked).toBe(true))
    expect((screen.getByLabelText('Enable GPT Alpha') as HTMLInputElement).checked).toBe(true)
  })

  it('filters to show only enabled models when toggle is checked', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            data: [
              { id: 'openai/gpt-alpha', name: 'GPT Alpha', architecture: { input_modalities: ['text'] } },
              { id: 'anthropic/claude-beta', name: 'Claude Beta', architecture: { input_modalities: ['text'] } },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      ),
    )

    render(<ApiModelsSettingsView />)
    fireEvent.change(screen.getByLabelText('API key'), { target: { value: 'sk-or-session' } })
    fireEvent.click(screen.getByText('Load models'))

    await waitFor(() => expect(screen.getByText('GPT Alpha')).toBeTruthy())

    // Enable only Claude Beta
    fireEvent.click(screen.getByLabelText('Enable Claude Beta'))

    // Toggle "Only enabled"
    fireEvent.click(screen.getByLabelText('Only enabled'))

    // Only Claude Beta should be visible
    expect(screen.getByText('Claude Beta')).toBeTruthy()
    expect(screen.queryByText('GPT Alpha')).toBeNull()
  })

  it('combines enabled-only toggle with text search', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            data: [
              { id: 'openai/gpt-alpha', name: 'GPT Alpha', architecture: { input_modalities: ['text'] } },
              { id: 'anthropic/claude-beta', name: 'Claude Beta', architecture: { input_modalities: ['text'] } },
              { id: 'openai/gpt-beta', name: 'GPT Beta', architecture: { input_modalities: ['text'] } },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      ),
    )

    render(<ApiModelsSettingsView />)
    fireEvent.change(screen.getByLabelText('API key'), { target: { value: 'sk-or-session' } })
    fireEvent.click(screen.getByText('Load models'))

    await waitFor(() => expect(screen.getByText('GPT Alpha')).toBeTruthy())

    // Enable Claude Beta and GPT Beta
    fireEvent.click(screen.getByLabelText('Enable Claude Beta'))
    fireEvent.click(screen.getByLabelText('Enable GPT Beta'))

    // Toggle "Only enabled" and search for "gpt"
    fireEvent.click(screen.getByLabelText('Only enabled'))
    fireEvent.change(screen.getByLabelText('Search models'), { target: { value: 'gpt' } })

    // Only GPT Beta should be visible (GPT Alpha is not enabled, Claude doesn't match "gpt")
    expect(screen.getByText('GPT Beta')).toBeTruthy()
    expect(screen.queryByText('GPT Alpha')).toBeNull()
    expect(screen.queryByText('Claude Beta')).toBeNull()
  })

  it('resets only-enabled toggle when component re-mounts', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(
          JSON.stringify({
            data: [
              { id: 'openai/gpt-alpha', name: 'GPT Alpha', architecture: { input_modalities: ['text'] } },
              { id: 'anthropic/claude-beta', name: 'Claude Beta', architecture: { input_modalities: ['text'] } },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      ),
    )

    const { unmount } = render(<ApiModelsSettingsView />)
    fireEvent.change(screen.getByLabelText('API key'), { target: { value: 'sk-or-session' } })
    fireEvent.click(screen.getByText('Load models'))

    await waitFor(() => expect(screen.getByText('GPT Alpha')).toBeTruthy())

    // Enable Claude Beta and toggle "Only enabled"
    fireEvent.click(screen.getByLabelText('Enable Claude Beta'))
    fireEvent.click(screen.getByLabelText('Only enabled'))

    // Verify filter is active
    expect(screen.queryByText('GPT Alpha')).toBeNull()

    // Unmount and remount
    unmount()
    render(<ApiModelsSettingsView />)

    // Toggle should be unchecked — all models shown again
    await waitFor(() => expect(screen.getByText('GPT Alpha')).toBeTruthy())
    expect(screen.getByText('Claude Beta')).toBeTruthy()
    expect((screen.getByLabelText('Only enabled') as HTMLInputElement).checked).toBe(false)
  })
})




