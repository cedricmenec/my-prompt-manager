import { useState, type KeyboardEvent } from 'react'
import { usePrompts } from './PromptsContext'
import { promptRepository } from '@/infrastructure/promptRepository'
import type { Prompt } from '@/domain/promptSchema'
import { Button } from '@/shared/ui/Button'
import { Badge } from '@/shared/ui/Badge'

interface FormErrors {
  title?: string
  content?: string
}

export function PromptEditor() {
  const { state, dispatch } = usePrompts()
  const isEdit = state.editorMode === 'edit'
  const existing: Prompt | undefined = isEdit
    ? state.prompts.find((p) => p.id === state.selectedPromptId)
    : undefined

  const [title, setTitle] = useState(existing?.title ?? '')
  const [content, setContent] = useState(existing?.content ?? '')
  const [description, setDescription] = useState(existing?.description ?? '')
  const [tags, setTags] = useState<string[]>(existing?.tags ?? [])
  const [tagInput, setTagInput] = useState('')
  const [model, setModel] = useState(existing?.model ?? '')
  const [temperature, setTemperature] = useState<string>(
    existing?.temperature !== undefined ? String(existing.temperature) : '',
  )
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitting, setSubmitting] = useState(false)

  // -------------------------------------------------------------------------
  // Tag chip input helpers
  // -------------------------------------------------------------------------

  function commitTagInput(raw: string) {
    const newTags = raw
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0 && !tags.includes(t))
    if (newTags.length > 0) setTags((prev) => [...prev, ...newTags])
    setTagInput('')
  }

  function handleTagKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault()
      commitTagInput(tagInput)
    } else if (e.key === 'Backspace' && tagInput === '' && tags.length > 0) {
      setTags((prev) => prev.slice(0, -1))
    }
  }

  function removeTag(tag: string) {
    setTags((prev) => prev.filter((t) => t !== tag))
  }

  // -------------------------------------------------------------------------
  // Submit
  // -------------------------------------------------------------------------

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const newErrors: FormErrors = {}
    if (!title.trim()) newErrors.title = 'Title is required'
    if (!content.trim()) newErrors.content = 'Content is required'
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setSubmitting(true)
    try {
      const tempValue = temperature !== '' ? parseFloat(temperature) : undefined
      if (isEdit && existing) {
        const updated = await promptRepository.update(existing.id, {
          title: title.trim(),
          content: content.trim(),
          description: description.trim() || undefined,
          tags,
          model: model.trim() || undefined,
          temperature: tempValue,
        })
        dispatch({ type: 'UPDATE', prompt: updated })
      } else {
        const created = await promptRepository.create({
          title: title.trim(),
          content: content.trim(),
          description: description.trim() || undefined,
          tags,
          model: model.trim() || undefined,
          temperature: tempValue,
        })
        dispatch({ type: 'ADD', prompt: created })
        dispatch({ type: 'SELECT', id: created.id })
      }
      dispatch({ type: 'CLOSE_EDITOR' })
    } catch {
      // surface error visually if needed
    } finally {
      setSubmitting(false)
    }
  }

  function handleCancel() {
    dispatch({ type: 'CLOSE_EDITOR' })
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-lg bg-surface shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-lg font-semibold text-text-heading">
            {isEdit ? 'Edit Prompt' : 'New Prompt'}
          </h2>
          <button onClick={handleCancel} aria-label="Close" className="text-text hover:text-text-heading text-xl">
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="space-y-4 px-6 py-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-text-heading mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => { setTitle(e.target.value); setErrors(({ title: _t, ...rest }) => rest) }}
                className="w-full rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-text-heading focus:border-primary focus:outline-none"
                placeholder="Prompt title"
              />
              {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title}</p>}
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-medium text-text-heading mb-1">
                Content <span className="text-red-500">*</span>
              </label>
              <textarea
                value={content}
                onChange={(e) => { setContent(e.target.value); setErrors(({ content: _c, ...rest }) => rest) }}
                rows={8}
                className="w-full rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-text-heading focus:border-primary focus:outline-none resize-y"
                placeholder="Write your prompt here..."
              />
              {errors.content && <p className="mt-1 text-xs text-red-600">{errors.content}</p>}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-text-heading mb-1">Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-text-heading focus:border-primary focus:outline-none"
                placeholder="Short description (optional)"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-text-heading mb-1">Tags</label>
              <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-border bg-surface px-3 py-1.5 min-h-[36px] focus-within:border-primary">
                {tags.map((tag) => (
                  <span key={tag} className="flex items-center gap-1">
                    <Badge label={tag} />
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="text-text hover:text-text-heading text-xs leading-none"
                      aria-label={`Remove ${tag}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  onBlur={() => { if (tagInput) commitTagInput(tagInput) }}
                  placeholder={tags.length === 0 ? 'Add tags (comma or Enter)' : ''}
                  className="flex-1 min-w-[120px] bg-transparent text-sm text-text-heading focus:outline-none"
                />
              </div>
            </div>

            {/* Model + Temperature */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-heading mb-1">Model</label>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-text-heading focus:border-primary focus:outline-none"
                  placeholder="e.g. gpt-4o (optional)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-heading mb-1">Temperature</label>
                <input
                  type="number"
                  value={temperature}
                  onChange={(e) => setTemperature(e.target.value)}
                  min={0}
                  max={2}
                  step={0.1}
                  className="w-full rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-text-heading focus:border-primary focus:outline-none"
                  placeholder="0–2 (optional)"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 border-t border-border px-6 py-4">
            <Button type="button" variant="secondary" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
