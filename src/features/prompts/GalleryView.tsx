import { useState } from 'react'
import { usePrompts } from './PromptsContext'
import { Badge } from '@/shared/ui/Badge'
import type { Prompt } from '@/domain/promptSchema'

// ---------------------------------------------------------------------------
// GalleryCard
// ---------------------------------------------------------------------------

interface GalleryCardProps {
  prompt: Prompt
  onClick: () => void
}

function GalleryCard({ prompt, onClick }: GalleryCardProps) {
  const [imageError, setImageError] = useState(false)

  return (
    <button
      onClick={onClick}
      className="group relative w-full overflow-hidden rounded-lg border border-border bg-surface text-left transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      aria-label={prompt.title}
    >
      {/* Image or placeholder */}
      {prompt.imageUrl && !imageError ? (
        <img
          src={prompt.imageUrl}
          alt={prompt.title}
          className="w-full h-auto block"
          onError={() => setImageError(true)}
        />
      ) : (
        <div className="w-full aspect-video flex items-center justify-center bg-surface-muted">
          {imageError ? (
            <span className="text-xs text-text opacity-60">Image unavailable</span>
          ) : (
            <span className="text-3xl opacity-30" aria-hidden="true">🖼</span>
          )}
        </div>
      )}

      {/* Hover overlay */}
      <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3">
        <p className="text-sm font-semibold text-white truncate">{prompt.title}</p>
        {prompt.tags && prompt.tags.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {prompt.tags.map((tag) => (
              <Badge key={tag} label={tag} />
            ))}
          </div>
        )}
      </div>
    </button>
  )
}

// ---------------------------------------------------------------------------
// GalleryView
// ---------------------------------------------------------------------------

export function GalleryView() {
  const { filteredPrompts, dispatch } = usePrompts()

  const imagePrompts = filteredPrompts.filter((p) => p.type === 'image')

  if (imagePrompts.length === 0) {
    return (
      <div className="px-4 py-4">
        <p className="mt-8 text-center text-sm text-text">
          No image prompts found. Tag a prompt as "Image" type to see it here.
        </p>
      </div>
    )
  }

  return (
    <div className="px-4 py-4">
      <ul className="columns-2 sm:columns-3 gap-3 space-y-3">
        {imagePrompts.map((prompt) => (
          <li key={prompt.id} className="break-inside-avoid">
            <GalleryCard
              prompt={prompt}
              onClick={() => dispatch({ type: 'SELECT', id: prompt.id })}
            />
          </li>
        ))}
      </ul>
    </div>
  )
}
