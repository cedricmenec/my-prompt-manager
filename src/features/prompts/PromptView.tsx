import { useState, useEffect, useRef, type KeyboardEvent } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import { usePrompts } from './PromptsContext'
import { promptRepository } from '@/infrastructure/promptRepository'
import type { Prompt } from '@/domain/promptSchema'
import { optimizeReferenceImage, type OptimizedImage } from '@/infrastructure/imageOptimization'
import { Badge } from '@/shared/ui/Badge'
import { Button } from '@/shared/ui/Button'
import { MarkdownEditor } from '@/shared/ui/MarkdownEditor'
import { Modal } from '@/shared/ui/Modal'
import { ToastContainer } from '@/shared/ui/Toast'
import { useToast } from '@/shared/ui/useToast'
import { MagicInput } from '@/shared/ui/MagicInput'
import { usePromptImageSource } from './usePromptImageSource'
import { generatePromptField } from '@/application/promptFieldGenerationService'
import type { PromptGeneratedFieldId } from '@/domain/promptGeneratedFields'
import { redactApiSecrets } from '@/infrastructure/secretRedaction'

// ---------------------------------------------------------------------------
// Preserve leading whitespace (spaces/tabs) in Markdown rendering.
// The Markdown parser normally strips leading spaces; converting them to
// non-breaking spaces before parsing keeps indentation visible (e.g. JSON).
// Code fences are left untouched — <pre> already handles their indentation.
// ---------------------------------------------------------------------------

function preserveLeadingWhitespace(md: string): string {
  let inCodeBlock = false
  return md
    .split('\n')
    .map((line) => {
      if (/^```/.test(line)) {
        inCodeBlock = !inCodeBlock
        return line
      }
      if (inCodeBlock) return line
      return line.replace(/^[ \t]+/, (ws) =>
        ws.replace(/ /g, '\u00A0').replace(/\t/g, '\u00A0\u00A0\u00A0\u00A0'),
      )
    })
    .join('\n')
}

// ---------------------------------------------------------------------------
// Tag chip input helpers (reused from PromptEditor)
// ---------------------------------------------------------------------------

interface TagInputProps {
  tags: string[]
  onChange: (tags: string[]) => void
}

function TagInput({ tags, onChange }: TagInputProps) {
  const [tagInput, setTagInput] = useState('')

  function commitTagInput(raw: string) {
    const newTags = raw
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0 && !tags.includes(t))
    if (newTags.length > 0) onChange([...tags, ...newTags])
    setTagInput('')
  }

  function handleTagKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault()
      commitTagInput(tagInput)
    } else if (e.key === 'Backspace' && tagInput === '' && tags.length > 0) {
      onChange(tags.slice(0, -1))
    }
  }

  function removeTag(tag: string) {
    onChange(tags.filter((t) => t !== tag))
  }

  return (
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
  )
}

// ---------------------------------------------------------------------------
// PromptView
// ---------------------------------------------------------------------------

interface FormErrors {
  title?: string
  content?: string
  image?: string
  assistant?: string
}

interface PendingImageAttachment {
  optimized: OptimizedImage
  source: 'upload' | 'remote-url'
  originalName?: string
  originalUrl?: string
}

function clearFormError(errors: FormErrors, key: keyof FormErrors): FormErrors {
  const next = { ...errors }
  delete next[key]
  return next
}

export function PromptView() {
  const { state, dispatch } = usePrompts()
  const { toasts, show: showToast } = useToast()

  const isCreate = state.selectedPromptId === null
  const prompt = isCreate
    ? undefined
    : state.prompts.find((p) => p.id === state.selectedPromptId)

  // Internal edit mode: true when editing inline (distinct from context viewMode)
  const [isEditing, setIsEditing] = useState(state.viewMode === 'edit')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showOverflow, setShowOverflow] = useState(false)
  const overflowRef = useRef<HTMLDivElement>(null)

  // Form state
  const [title, setTitle] = useState(prompt?.title ?? '')
  const [content, setContent] = useState(prompt?.content ?? '')
  const [description, setDescription] = useState(prompt?.description ?? '')
  const [tags, setTags] = useState<string[]>(prompt?.tags ?? [])
  const [notes, setNotes] = useState(prompt?.notes ?? '')

  const [imageUrl, setImageUrl] = useState(prompt?.imageUrl ?? '')
  const [imageAssetId, setImageAssetId] = useState(prompt?.imageAssetId ?? '')
  const [pendingImage, setPendingImage] = useState<PendingImageAttachment | null>(null)
  const [imageBusy, setImageBusy] = useState(false)
  const [type, setType] = useState<'text' | 'image'>(prompt?.type ?? state.initialType ?? 'text')
  const [temperature, setTemperature] = useState<string>(
    prompt?.temperature !== undefined ? String(prompt.temperature) : '',
  )
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [generatingField, setGeneratingField] = useState<PromptGeneratedFieldId | null>(null)
  const generationAbortRef = useRef<AbortController | null>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const readImage = usePromptImageSource(prompt)

  useEffect(() => {
    setTitle(prompt?.title ?? '')
    setContent(prompt?.content ?? '')
    setDescription(prompt?.description ?? '')
    setTags(prompt?.tags ?? [])
    setNotes(prompt?.notes ?? '')

    setImageUrl(prompt?.imageUrl ?? '')
    setImageAssetId(prompt?.imageAssetId ?? '')
    setPendingImage(null)
    setType(prompt?.type ?? state.initialType ?? 'text')
    setTemperature(prompt?.temperature !== undefined ? String(prompt.temperature) : '')
    setErrors({})
  }, [
    prompt?.id,
    prompt?.title,
    prompt?.content,
    prompt?.description,
    prompt?.tags,
    prompt?.notes,

    prompt?.imageUrl,
    prompt?.imageAssetId,
    prompt?.type,
    prompt?.temperature,
    state.initialType,
  ])

  // Esc key listener — read mode only
  useEffect(() => {
    if (isEditing) return
    function handleKeyDown(e: globalThis.KeyboardEvent) {
      if (e.key === 'Escape') {
        dispatch({ type: 'DESELECT' })
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isEditing, dispatch])

  // Close overflow menu on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (overflowRef.current && !overflowRef.current.contains(e.target as Node)) {
        setShowOverflow(false)
      }
    }
    if (showOverflow) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showOverflow])

  // ---------------------------------------------------------------------------
  // Read-mode actions
  // ---------------------------------------------------------------------------

  function handleBack() {
    dispatch({ type: 'DESELECT' })
  }

  async function handleToggleFavorite() {
    if (!prompt) return
    const updated = await promptRepository.update(prompt.id, {
      isFavorite: !prompt.isFavorite,
    })
    dispatch({ type: 'UPDATE', prompt: updated })
  }

  function handleEdit() {
    setIsEditing(true)
  }

  async function handleCopy() {
    const raw = prompt?.content ?? content
    await navigator.clipboard.writeText(raw)
    showToast('Copied to clipboard!')
  }

  async function handleDelete() {
    if (!prompt) return
    await promptRepository.delete(prompt.id)
    dispatch({ type: 'REMOVE', id: prompt.id })
    dispatch({ type: 'DESELECT' })
    setShowDeleteModal(false)
  }

  async function prepareImageAttachment(
    blob: Blob,
    source: 'upload' | 'remote-url',
    metadata: { originalName?: string; originalUrl?: string } = {},
  ) {
    setImageBusy(true)
    setErrors((current) => clearFormError(current, 'image'))
    try {
      const optimized = await optimizeReferenceImage(blob)
      setPendingImage({
        optimized,
        source,
        ...(metadata.originalName !== undefined ? { originalName: metadata.originalName } : {}),
        ...(metadata.originalUrl !== undefined ? { originalUrl: metadata.originalUrl } : {}),
      })
      setImageAssetId('')
    } catch (error) {
      setPendingImage(null)
      setErrors((current) => ({
        ...current,
        image: error instanceof Error ? error.message : 'Could not prepare this image.',
      }))
    } finally {
      setImageBusy(false)
    }
  }

  async function handleImageFile(file: File | undefined) {
    if (!file) return
    await prepareImageAttachment(file, 'upload', { originalName: file.name })
  }

  async function handleImportImageUrl() {
    const url = imageUrl.trim()
    if (!url) {
      setErrors((current) => ({ ...current, image: 'Enter a public image URL before importing it locally.' }))
      return
    }

    setImageBusy(true)
    setErrors((current) => clearFormError(current, 'image'))
    try {
      const response = await fetch(url, { mode: 'cors' })
      if (!response.ok) throw new Error('The image URL could not be downloaded.')
      const blob = await response.blob()
      await prepareImageAttachment(blob, 'remote-url', { originalUrl: url })
    } catch (error) {
      setPendingImage(null)
      setErrors((current) => ({
        ...current,
        image:
          error instanceof Error
            ? `${error.message} You can still save the URL as a remote image reference.`
            : 'Local import failed. You can still save the URL as a remote image reference.',
      }))
      setImageBusy(false)
    }
  }

  function handleRemoveLocalImage() {
    setPendingImage(null)
    setImageAssetId('')
    setErrors((current) => clearFormError(current, 'image'))
  }

  // ---------------------------------------------------------------------------
  // Edit/Create mode actions
  // ---------------------------------------------------------------------------

  async function handleSave(e: React.FormEvent) {
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
      const baseData = {
        title: title.trim(),
        content: content.trim(),
        description: description.trim() || undefined,
        tags,
        notes: notes.trim() || undefined,

        imageUrl: imageUrl.trim() || undefined,
        imageAssetId: pendingImage ? (prompt?.imageAssetId ?? undefined) : imageAssetId || undefined,
        temperature: tempValue,
        type,
      }
      let saved: Prompt

      if (!isCreate && prompt) {
        // Edit mode
        saved = await promptRepository.update(prompt.id, baseData)
        if (pendingImage) {
          const asset = await promptRepository.createImageAsset({
            promptId: saved.id,
            blob: pendingImage.optimized.blob,
            mimeType: pendingImage.optimized.mimeType,
            width: pendingImage.optimized.width,
            height: pendingImage.optimized.height,
            sizeBytes: pendingImage.optimized.sizeBytes,
            source: pendingImage.source,
            ...(pendingImage.originalName !== undefined ? { originalName: pendingImage.originalName } : {}),
            ...(pendingImage.originalUrl !== undefined ? { originalUrl: pendingImage.originalUrl } : {}),
          })
          saved = await promptRepository.update(saved.id, { imageAssetId: asset.id })
        }
        dispatch({ type: 'UPDATE', prompt: saved })
        setIsEditing(false)
      } else {
        // Create mode
        saved = await promptRepository.create({
          ...baseData,
          isFavorite: false,
        })
        if (pendingImage) {
          const asset = await promptRepository.createImageAsset({
            promptId: saved.id,
            blob: pendingImage.optimized.blob,
            mimeType: pendingImage.optimized.mimeType,
            width: pendingImage.optimized.width,
            height: pendingImage.optimized.height,
            sizeBytes: pendingImage.optimized.sizeBytes,
            source: pendingImage.source,
            ...(pendingImage.originalName !== undefined ? { originalName: pendingImage.originalName } : {}),
            ...(pendingImage.originalUrl !== undefined ? { originalUrl: pendingImage.originalUrl } : {}),
          })
          saved = await promptRepository.update(saved.id, { imageAssetId: asset.id })
        }
        dispatch({ type: 'ADD', prompt: saved })
        dispatch({ type: 'SELECT', id: saved.id })
        setIsEditing(false)
      }
      setPendingImage(null)
      setImageAssetId(saved.imageAssetId ?? '')
    } catch (error) {
      setErrors((current) => ({
        ...current,
        image: error instanceof Error ? error.message : 'Prompt save failed. Local image data was not attached.',
      }))
    } finally {
      setSubmitting(false)
    }
  }

  function handleCancel() {
    if (isCreate) {
      dispatch({ type: 'DESELECT' })
    } else {
      // Restore original values
      setTitle(prompt?.title ?? '')
      setContent(prompt?.content ?? '')
      setDescription(prompt?.description ?? '')
      setTags(prompt?.tags ?? [])
      setNotes(prompt?.notes ?? '')

      setImageUrl(prompt?.imageUrl ?? '')
      setImageAssetId(prompt?.imageAssetId ?? '')
      setPendingImage(null)
      setType(prompt?.type ?? 'text')
      setTemperature(prompt?.temperature !== undefined ? String(prompt.temperature) : '')
      setErrors({})
      setIsEditing(false)
    }
  }
  async function handleGenerateField(fieldId: PromptGeneratedFieldId) {
    if (generatingField) return
    generationAbortRef.current?.abort()
    const controller = new AbortController()
    generationAbortRef.current = controller
    setGeneratingField(fieldId)
    setErrors((current) => clearFormError(current, 'assistant'))
    try {
      const generated = await generatePromptField({ fieldId, content, signal: controller.signal })
      if (fieldId === 'title') {
        setTitle(generated)
        setErrors((current) => clearFormError(current, 'title'))
      } else {
        setDescription(generated)
      }
      const generatedLabel = fieldId === 'title' ? 'Title' : 'Description'
      showToast(generatedLabel + ' generated. Review it before saving.', 'success')
    } catch (error) {
      const message = error instanceof Error ? redactApiSecrets(error.message) : 'Prompt field generation failed.'
      setErrors((current) => ({ ...current, assistant: message }))
      showToast(message, 'error')
    } finally {
      if (generationAbortRef.current === controller) {
        generationAbortRef.current = null
      }
      setGeneratingField(null)
    }
  }

  useEffect(() => {
    return () => generationAbortRef.current?.abort()
  }, [])

  // ---------------------------------------------------------------------------
  // Read mode render
  // ---------------------------------------------------------------------------

  function renderReadMode(p: Prompt) {
    return (
      <div className="flex h-full flex-col">
        {/* Action bar */}
        <div className="flex items-center gap-2 border-b border-border px-4 py-2 shrink-0">
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-text hover:bg-surface-muted transition-colors"
            aria-label="Back to list"
          >
            <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>

          <div className="flex-1" />

          {/* Favorite toggle */}
          <button
            onClick={handleToggleFavorite}
            aria-label={p.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            className="inline-flex items-center justify-center rounded-md px-2 py-1.5 text-sm transition-colors border border-border hover:bg-surface-muted"
            title={p.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            {p.isFavorite ? (
              <svg className="size-4 text-amber-400 fill-amber-400" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
              </svg>
            ) : (
              <svg className="size-4 text-text" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
              </svg>
            )}
          </button>

          {/* Edit button */}
          <button
            onClick={handleEdit}
            aria-label="Edit prompt"
            className="inline-flex items-center justify-center rounded-md px-2 py-1.5 text-sm transition-colors border border-border hover:bg-surface-muted"
            title="Edit"
          >
            <svg className="size-4 text-text" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
            </svg>
          </button>

          {/* Overflow menu */}
          <div ref={overflowRef} className="relative">
            <button
              onClick={() => setShowOverflow((v) => !v)}
              aria-label="More actions"
              className="inline-flex items-center justify-center rounded-md px-2 py-1.5 text-sm transition-colors border border-border hover:bg-surface-muted"
              title="More actions"
            >
              <svg className="size-4 text-text" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm0 7a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm0 7a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />
              </svg>
            </button>
            {showOverflow && (
              <div className="absolute right-0 top-full mt-1 w-36 rounded-md border border-border bg-surface shadow-lg z-10">
                <button
                  onClick={() => { setShowOverflow(false); setShowDeleteModal(true) }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-surface-muted"
                >
                  <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                  </svg>
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl px-6 py-8 space-y-4">
            {/* Title */}
            <h1 className="text-2xl font-bold text-text-heading">{p.title}</h1>

            {/* Tags */}
            {p.tags && p.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {p.tags.map((tag) => (
                  <Badge key={tag} label={tag} />
                ))}
              </div>
            )}

            {/* Description */}
            {p.description && (
              <div className="prose prose-sm max-w-none italic text-text">
                <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>{preserveLeadingWhitespace(p.description)}</ReactMarkdown>
              </div>
            )}

            {/* Image preview — image-type prompts only */}
            {p.type === 'image' && readImage.src && (
              <div>
                <img src={readImage.src} alt={p.title} className="w-full h-auto rounded-lg" />
              </div>
            )}

            {/* Copy CTA — above content */}
            <div className="flex justify-end">
              <Button variant="secondary" onClick={handleCopy}>
                <svg className="size-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
                </svg>
                Copy
              </Button>
            </div>

            {/* Content block — terminal/code-block style */}
            <div className="rounded-lg border-2 border-border bg-surface-muted p-4 text-sm">
              <div className="prose prose-sm max-w-none text-text">
                <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>{preserveLeadingWhitespace(p.content)}</ReactMarkdown>
              </div>
            </div>

            {/* Copy CTA — below content */}
            <div className="flex justify-end">
              <Button variant="secondary" onClick={handleCopy}>
                <svg className="size-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
                </svg>
                Copy
              </Button>
            </div>

            {/* Notes */}
            {p.notes && (
              <div className="rounded-lg border border-border bg-surface p-4">
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-text opacity-60">Notes</p>
                <div className="prose prose-sm max-w-none text-text">
                  <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>{preserveLeadingWhitespace(p.notes)}</ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Edit / Create mode render
  // ---------------------------------------------------------------------------

  function renderEditMode() {
    return (
      <div className="flex h-full flex-col">
        {/* Action bar */}
        <div className="flex items-center gap-2 border-b border-border px-4 py-2 shrink-0">
          <span className="text-sm font-semibold text-text-heading">
            {isCreate ? 'New Prompt' : 'Edit Prompt'}
          </span>
          <div className="flex-1" />
          <Button type="button" variant="secondary" onClick={handleCancel}>
            Cancel
          </Button>
          <Button type="submit" form="prompt-edit-form" disabled={submitting}>
            {submitting ? 'Saving…' : 'Save'}
          </Button>
        </div>

        {/* Scrollable form */}
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl px-6 py-8">
            <form id="prompt-edit-form" onSubmit={handleSave} noValidate className="space-y-5">
              {/* Title */}
              <div>
                <label className="block mb-1 text-sm font-medium text-text-heading">
                  Title <span className="text-red-500">*</span>
                </label>
                <MagicInput
                  value={title}
                  onChange={(e) => { setTitle(e.target.value); setErrors((current) => clearFormError(current, 'title')) }}
                  onMagicAction={() => void handleGenerateField('title')}
                  isGenerating={generatingField === 'title'}
                  placeholder="Prompt title"
                />
                {errors.title && <p className="mt-1 text-xs text-red-600">{errors.title}</p>}
              </div>

              {/* Description */}
              <div>
                <label className="block mb-1 text-sm font-medium text-text-heading">Description</label>
                <MagicInput
                  variant="multi"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onMagicAction={() => void handleGenerateField('description')}
                  isGenerating={generatingField === 'description'}
                  placeholder="Short description (optional)"
                />
              </div>

              {/* Type selector */}
              <div>
                <label className="block text-sm font-medium text-text-heading mb-1">Type</label>
                <div className="flex gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="prompt-type"
                      value="text"
                      checked={type === 'text'}
                      onChange={() => setType('text')}
                      className="accent-primary"
                    />
                    <span className="text-sm text-text-heading">Text</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="prompt-type"
                      value="image"
                      checked={type === 'image'}
                      onChange={() => setType('image')}
                      className="accent-primary"
                    />
                    <span className="text-sm text-text-heading">Image</span>
                  </label>
                </div>
              </div>

              {type === 'image' && (
                <div>
                  <label className="block text-sm font-medium text-text-heading mb-1">Local reference image</label>
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault()
                      void handleImageFile(e.dataTransfer.files[0])
                    }}
                    className="flex flex-col gap-2 rounded-md border border-dashed border-border bg-surface-muted p-3"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Button type="button" variant="secondary" onClick={() => imageInputRef.current?.click()} disabled={imageBusy}>
                        {imageBusy ? 'Preparing...' : pendingImage || imageAssetId ? 'Replace image' : 'Upload image'}
                      </Button>
                      {(pendingImage || imageAssetId) && (
                        <Button type="button" variant="secondary" onClick={handleRemoveLocalImage} disabled={imageBusy}>
                          Remove local image
                        </Button>
                      )}
                      <span className="text-xs text-text">
                        {pendingImage
                          ? `Ready: ${pendingImage.optimized.width}x${pendingImage.optimized.height}, ${Math.ceil(pendingImage.optimized.sizeBytes / 1024)} KB`
                          : imageAssetId
                            ? 'A local image is attached.'
                            : 'Drop an image here or choose a file.'}
                      </span>
                    </div>
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        void handleImageFile(e.target.files?.[0])
                        e.target.value = ''
                      }}
                    />
                    {errors.image && <p className="text-xs text-red-600">{errors.image}</p>}
                  </div>
                </div>
              )}

              {/* Image URL */}
              <div>
                <label className="block text-sm font-medium text-text-heading mb-1">Reference image URL</label>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-text-heading focus:border-primary focus:outline-none"
                  placeholder="https://example.com/image.png (optional)"
                />
                {type === 'image' && (
                  <div className="mt-2">
                    <Button type="button" variant="secondary" onClick={handleImportImageUrl} disabled={imageBusy || !imageUrl.trim()}>
                      Import URL locally
                    </Button>
                  </div>
                )}
              </div>

              {/* Tags */}
              <div>
                <label className="block text-sm font-medium text-text-heading mb-1">Tags</label>
                <TagInput tags={tags} onChange={setTags} />
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-text-heading mb-1">
                  Content <span className="text-red-500">*</span>
                </label>
                <MarkdownEditor
                  value={content}
                  onChange={(v) => { setContent(v); setErrors((current) => clearFormError(current, 'content')) }}
                  rows={8}
                  placeholder="Write your prompt here…"
                  error={!!errors.content}
                />
                {errors.content && <p className="mt-1 text-xs text-red-600">{errors.content}</p>}
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-text-heading mb-1">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-text-heading focus:border-primary focus:outline-none resize-y"
                  placeholder="Usage tips, origin, context… (optional)"
                />
              </div>

              {/* Temperature */}
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
                  placeholder="0-2 (optional)"
                />
              </div>
              {errors.assistant && <p className="text-xs text-red-600">{errors.assistant}</p>}
            </form>
          </div>
        </div>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Main render
  // ---------------------------------------------------------------------------

  return (
    <>
      <div className="flex h-full flex-col bg-surface">
        {isEditing || isCreate ? renderEditMode() : prompt ? renderReadMode(prompt) : null}
      </div>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <Modal
          title="Delete Prompt"
          onClose={() => setShowDeleteModal(false)}
          actions={[
            { label: 'Cancel', variant: 'secondary', onClick: () => setShowDeleteModal(false) },
            { label: 'Delete', variant: 'danger', onClick: handleDelete },
          ]}
        >
          Are you sure you want to delete <strong>{prompt?.title}</strong>? This cannot be undone.
        </Modal>
      )}

      <ToastContainer toasts={toasts} />
    </>
  )
}
