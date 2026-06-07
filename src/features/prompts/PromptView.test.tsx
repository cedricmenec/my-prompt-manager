import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PromptView } from './PromptView'
import type { Prompt } from '@/domain/promptSchema'
import { generatePromptField } from '@/application/promptFieldGenerationService'
import { promptRepository } from '@/infrastructure/promptRepository'

const prompt: Prompt = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  title: 'Original title',
  description: 'Original description',
  content: 'Original content',
  tags: [],
  isFavorite: false,
  type: 'text',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

const promptState = vi.hoisted(() => ({
  dispatch: vi.fn(),
  state: {
    selectedPromptId: '550e8400-e29b-41d4-a716-446655440000',
    viewMode: 'edit',
    initialType: 'text',
    prompts: [] as Prompt[],
  },
}))

vi.mock('./PromptsContext', () => ({
  usePrompts: () => ({ state: promptState.state, dispatch: promptState.dispatch }),
}))

vi.mock('@/shared/ui/MarkdownEditor', () => ({
  MarkdownEditor: ({ value, onChange, placeholder }: { value: string; onChange: (value: string) => void; placeholder?: string }) => (
    <textarea aria-label="Content" placeholder={placeholder} value={value} onChange={(event) => onChange(event.target.value)} />
  ),
}))

vi.mock('@/application/promptFieldGenerationService', () => ({
  generatePromptField: vi.fn(),
}))

vi.mock('@/infrastructure/promptRepository', () => ({
  promptRepository: {
    update: vi.fn(),
    create: vi.fn(),
    createImageAsset: vi.fn(),
  },
}))

describe('PromptView AI field generation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    promptState.state = {
      selectedPromptId: prompt.id,
      viewMode: 'edit',
      initialType: 'text',
      prompts: [prompt],
    }
  })

  it('uses English interface text for known edited labels', () => {
    render(<PromptView />)

    expect(screen.getByText('Reference image URL')).toBeTruthy()
    expect(screen.queryByText('Image de référence (URL)')).toBeNull()
  })

  it('removes prompt-level model input from edit mode', () => {
    render(<PromptView />)

    expect(screen.queryByText('Model')).toBeNull()
    expect(screen.getByText('Temperature')).toBeTruthy()
  })

  it('generates a title without saving the prompt', async () => {
    vi.mocked(generatePromptField).mockResolvedValue('Generated title')
    render(<PromptView />)

    // MagicInput uses a shared aria-label — first occurrence is the title magic button
    const magicButtons = screen.getAllByRole('button', { name: 'Generate with AI' })
    fireEvent.click(magicButtons[0])

    await waitFor(() => expect(screen.getByDisplayValue('Generated title')).toBeTruthy())
    expect(generatePromptField).toHaveBeenCalledWith(expect.objectContaining({ fieldId: 'title', content: 'Original content' }))
    expect(promptRepository.update).not.toHaveBeenCalled()
  })

  it('generates a description without saving the prompt', async () => {
    vi.mocked(generatePromptField).mockResolvedValue('Generated description')
    render(<PromptView />)

    // Second magic button is the description field
    const magicButtons = screen.getAllByRole('button', { name: 'Generate with AI' })
    fireEvent.click(magicButtons[1])

    await waitFor(() => expect(screen.getByDisplayValue('Generated description')).toBeTruthy())
    expect(generatePromptField).toHaveBeenCalledWith(expect.objectContaining({ fieldId: 'description', content: 'Original content' }))
    expect(promptRepository.update).not.toHaveBeenCalled()
  })

  it('shows a missing content generation error without saving', async () => {
    vi.mocked(generatePromptField).mockRejectedValue(new Error('Enter prompt content before generating this field.'))
    render(<PromptView />)

    fireEvent.change(screen.getByLabelText('Content'), { target: { value: '' } })
    const magicButtons = screen.getAllByRole('button', { name: 'Generate with AI' })
    fireEvent.click(magicButtons[0])

    expect((await screen.findAllByText('Enter prompt content before generating this field.')).length).toBeGreaterThan(0)
    expect(promptRepository.update).not.toHaveBeenCalled()
  })

  it('shows a missing configuration generation error without saving', async () => {
    vi.mocked(generatePromptField).mockRejectedValue(new Error('Select an AI Assistant model in Settings before generating prompt fields.'))
    render(<PromptView />)

    const magicButtons = screen.getAllByRole('button', { name: 'Generate with AI' })
    fireEvent.click(magicButtons[0])

    expect((await screen.findAllByText('Select an AI Assistant model in Settings before generating prompt fields.')).length).toBeGreaterThan(0)
    expect(promptRepository.update).not.toHaveBeenCalled()
  })

  it('redacts API keys from rendered generation errors', async () => {
    vi.mocked(generatePromptField).mockRejectedValue(new Error('Provider failed with sk-or-secret-value'))
    render(<PromptView />)

    const magicButtons = screen.getAllByRole('button', { name: 'Generate with AI' })
    fireEvent.click(magicButtons[0])

    expect((await screen.findAllByText('Provider failed with [redacted-api-key]')).length).toBeGreaterThan(0)
    expect(screen.queryByText(/sk-or-secret-value/)).toBeNull()
  })

  it('shows generation errors while preserving current edit values', async () => {
    vi.mocked(generatePromptField).mockRejectedValue(new Error('Enter prompt content before generating this field.'))
    render(<PromptView />)

    const magicButtons = screen.getAllByRole('button', { name: 'Generate with AI' })
    fireEvent.click(magicButtons[0])

    expect((await screen.findAllByText('Enter prompt content before generating this field.')).length).toBeGreaterThan(0)
    expect(screen.getByDisplayValue('Original title')).toBeTruthy()
  })
})