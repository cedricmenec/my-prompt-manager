import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { MagicInput } from './MagicInput'

describe('MagicInput', () => {
  // ------------------------------------------------------------------
  // 2.1 Render for both variants
  // ------------------------------------------------------------------
  it('renders an <input> element for variant="single"', () => {
    render(<MagicInput variant="single" placeholder="Enter text" />)
    const el = screen.getByPlaceholderText('Enter text')
    expect(el.tagName).toBe('INPUT')
  })

  it('renders a <textarea> element for variant="multi"', () => {
    render(<MagicInput variant="multi" placeholder="Enter description" />)
    const el = screen.getByPlaceholderText('Enter description')
    expect(el.tagName).toBe('TEXTAREA')
  })

  it('defaults to variant="single" when variant is omitted', () => {
    render(<MagicInput placeholder="Default" />)
    const el = screen.getByPlaceholderText('Default')
    expect(el.tagName).toBe('INPUT')
  })

  // ------------------------------------------------------------------
  // 2.2 Click on icon triggers onMagicAction when not generating
  // ------------------------------------------------------------------
  it('calls onMagicAction when the magic icon is clicked and isGenerating is false', async () => {
    const user = userEvent.setup()
    const onMagicAction = vi.fn()
    render(<MagicInput onMagicAction={onMagicAction} />)

    const iconButton = screen.getByRole('button', { name: 'Generate with AI' })
    expect(iconButton.hasAttribute('disabled')).toBe(false)

    await user.click(iconButton)
    expect(onMagicAction).toHaveBeenCalledTimes(1)
  })

  // ------------------------------------------------------------------
  // 2.3 Click on icon does NOT trigger onMagicAction when generating
  // ------------------------------------------------------------------
  it('does not call onMagicAction when isGenerating is true', async () => {
    const user = userEvent.setup()
    const onMagicAction = vi.fn()
    render(<MagicInput onMagicAction={onMagicAction} isGenerating />)

    const iconButton = screen.getByRole('button', { name: 'Generate with AI' })
    expect(iconButton.hasAttribute('disabled')).toBe(true)

    await user.click(iconButton)
    expect(onMagicAction).not.toHaveBeenCalled()
  })

  // ------------------------------------------------------------------
  // 2.4 Native props are forwarded
  // ------------------------------------------------------------------
  it('passes native placeholder and value to the input element', () => {
    render(<MagicInput placeholder="Prompt title" value="Hello" onChange={vi.fn()} />)
    const input = screen.getByPlaceholderText('Prompt title') as HTMLInputElement
    expect(input.value).toBe('Hello')
  })

  it('passes native placeholder and value to the textarea element', () => {
    render(
      <MagicInput
        variant="multi"
        placeholder="Short description"
        value="Some description"
        onChange={vi.fn()}
      />,
    )
    const textarea = screen.getByPlaceholderText('Short description') as HTMLTextAreaElement
    expect(textarea.value).toBe('Some description')
  })

  it('forwards onChange handler to the input', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<MagicInput value="" onChange={onChange} placeholder="Type here" />)

    const input = screen.getByPlaceholderText('Type here')
    await user.type(input, 'a')
    expect(onChange).toHaveBeenCalled()
  })

  // ------------------------------------------------------------------
  // 2.5 aria-label and aria-disabled on the icon button
  // ------------------------------------------------------------------
  it('has a valid aria-label on the magic icon button', () => {
    render(<MagicInput />)
    expect(screen.getByRole('button', { name: 'Generate with AI' })).toBeDefined()
  })

  it('sets aria-disabled on the magic icon button when generating', () => {
    render(<MagicInput isGenerating />)
    const iconButton = screen.getByRole('button', { name: 'Generate with AI' })
    expect(iconButton.getAttribute('aria-disabled')).toBe('true')
  })

  it('does not set aria-disabled on the magic icon button when not generating', () => {
    render(<MagicInput />)
    const iconButton = screen.getByRole('button', { name: 'Generate with AI' })
    expect(iconButton.getAttribute('aria-disabled')).toBeNull()
  })

  // ------------------------------------------------------------------
  // Additional: disabled prop also disables the magic button
  // ------------------------------------------------------------------
  it('disables the magic icon button when the parent input is disabled', () => {
    render(<MagicInput disabled />)
    const btn = screen.getByRole('button', { name: 'Generate with AI' })
    expect(btn.hasAttribute('disabled')).toBe(true)
  })
})
