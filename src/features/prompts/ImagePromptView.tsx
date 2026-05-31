import { useState } from 'react'
import { usePrompts } from './PromptsContext'
import { Badge } from '@/shared/ui/Badge'

export function ImagePromptView() {
  const { state, dispatch } = usePrompts()
  const [imageError, setImageError] = useState(false)

  const prompt = state.selectedPromptId
    ? state.prompts.find((p) => p.id === state.selectedPromptId)
    : undefined

  if (!prompt) return null

  return (
    <div className="flex flex-col">
      {/* Action bar */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <button
          onClick={() => dispatch({ type: 'DESELECT' })}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-text transition-colors hover:bg-surface-muted"
        >
          <svg
            className="size-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          Back to Gallery
        </button>

        <button
          onClick={() => dispatch({ type: 'OPEN_EDIT' })}
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-text transition-colors hover:bg-surface-muted"
        >
          <svg
            className="size-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125"
            />
          </svg>
          Edit
        </button>
      </div>

      {/* Image area */}
      <div className="flex items-center justify-center bg-surface-muted px-4 py-6">
        {prompt.imageUrl && !imageError ? (
          <img
            src={prompt.imageUrl}
            alt={prompt.title}
            className="max-h-[60vh] w-auto rounded-lg object-contain shadow-md"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex h-60 w-full max-w-2xl items-center justify-center rounded-lg border border-border bg-surface">
            {imageError ? (
              <span className="text-sm text-text opacity-60">Image unavailable</span>
            ) : (
              <span className="text-5xl opacity-20" aria-hidden="true">🖼</span>
            )}
          </div>
        )}
      </div>

      {/* Metadata */}
      <div className="mx-auto w-full max-w-2xl px-4 py-6">
        {/* Title + favorite */}
        <div className="flex items-start gap-3">
          <h1 className="flex-1 text-xl font-semibold text-text-heading">{prompt.title}</h1>
          {prompt.isFavorite && (
            <svg
              className="mt-0.5 size-5 shrink-0 fill-amber-400 text-amber-400"
              viewBox="0 0 24 24"
              aria-label="Favorite"
            >
              <path d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
            </svg>
          )}
        </div>

        {/* Tags */}
        {prompt.tags && prompt.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {prompt.tags.map((tag) => (
              <Badge key={tag} label={tag} />
            ))}
          </div>
        )}

        {/* Prompt content */}
        <div className="mt-4">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-text">Prompt</p>
          <pre className="whitespace-pre-wrap rounded-lg bg-surface-muted px-4 py-3 text-sm text-text-heading">
            {prompt.content}
          </pre>
        </div>

        {/* Description */}
        {prompt.description && (
          <div className="mt-4">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-text">Description</p>
            <p className="text-sm text-text-heading">{prompt.description}</p>
          </div>
        )}

        {/* Model */}
        {prompt.model && (
          <div className="mt-4">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-text">Model</p>
            <p className="text-sm text-text-heading">{prompt.model}</p>
          </div>
        )}

        {/* Notes */}
        {prompt.notes && (
          <div className="mt-4">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-text">Notes</p>
            <p className="whitespace-pre-wrap text-sm text-text-heading">{prompt.notes}</p>
          </div>
        )}
      </div>
    </div>
  )
}
