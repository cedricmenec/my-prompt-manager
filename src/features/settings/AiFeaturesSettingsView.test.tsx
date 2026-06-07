import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { IDBFactory } from 'fake-indexeddb'
import { resetDb, type AiProviderModel } from '@/infrastructure/db'
import { aiProviderSettingsRepository } from '@/infrastructure/aiProviderSettingsRepository'
import { AiFeaturesSettingsView } from './AiFeaturesSettingsView'

const fetchedAt = '2026-06-06T12:00:00.000Z'
const models: AiProviderModel[] = [
  {
    id: 'openrouter:openai/gpt-test',
    providerId: 'openrouter',
    name: 'GPT Test',
    originProvider: 'Openai',
    modality: 'text',
    tokenCost: null,
    fetchedAt,
  },
  {
    id: 'openrouter:google/gemini-vision',
    providerId: 'openrouter',
    name: 'Gemini Vision',
    originProvider: 'Google',
    modality: 'multimodal',
    tokenCost: null,
    fetchedAt,
  },
  {
    id: 'openrouter:stability/image-test',
    providerId: 'openrouter',
    name: 'Image Test',
    originProvider: 'Stability',
    modality: 'image',
    tokenCost: null,
    fetchedAt,
  },
]

function cloneForTest<T>(value: T): T {
  return value
}

beforeEach(() => {
  globalThis.structuredClone = cloneForTest
  globalThis.indexedDB = new IDBFactory()
  resetDb()
})

describe('AiFeaturesSettingsView', () => {
  it('shows an actionable empty state when no eligible model is enabled', async () => {
    render(<AiFeaturesSettingsView />)

    expect(await screen.findByText(/No enabled text-capable model is available/)).toBeTruthy()
    expect((screen.getByLabelText('AI Assistant') as HTMLSelectElement).disabled).toBe(true)
  })

  it('lists only enabled text-capable or multimodal models', async () => {
    await aiProviderSettingsRepository.replaceProviderModels('openrouter', models, fetchedAt)
    await aiProviderSettingsRepository.setEnabledModels('openrouter', models.map((model) => model.id))

    render(<AiFeaturesSettingsView />)

    expect(await screen.findByText('GPT Test')).toBeTruthy()
    expect(screen.getByText('Gemini Vision')).toBeTruthy()
    expect(screen.queryByText('Image Test')).toBeNull()
  })

  it('persists and restores the assistant model selection', async () => {
    await aiProviderSettingsRepository.replaceProviderModels('openrouter', models, fetchedAt)
    await aiProviderSettingsRepository.setEnabledModels('openrouter', [models[0].id])

    const { unmount } = render(<AiFeaturesSettingsView />)
    await screen.findByText('GPT Test')
    fireEvent.change(screen.getByLabelText('AI Assistant'), { target: { value: models[0].id } })
    await waitFor(() => expect(screen.getByText('Prompt input assistant model saved.')).toBeTruthy())
    unmount()

    render(<AiFeaturesSettingsView />)

    await waitFor(() => expect((screen.getByLabelText('AI Assistant') as HTMLSelectElement).value).toBe(models[0].id))
  })
})