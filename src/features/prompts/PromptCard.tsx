import type { Prompt } from '@/domain/promptSchema'
import { Badge } from '@/shared/ui/Badge'
import { useState } from 'react'

interface PromptCardProps {
  prompt: Prompt
  isSelected: boolean
  onClick: () => void
}

export function PromptCard({ prompt, isSelected, onClick }: PromptCardProps) {
  const [imageError, setImageError] = useState(false)

  return (
    <button
      onClick={onClick}
      className={[
        'w-full text-left rounded-lg border transition-colors overflow-hidden flex flex-col',
        isSelected
          ? 'border-primary bg-primary-bg'
          : 'border-border bg-surface hover:bg-surface-muted',
      ].join(' ')}
    >
      {prompt.imageUrl && !imageError && (
        <div className="w-full h-32 overflow-hidden border-b border-border bg-surface-muted">
          <img
            src={prompt.imageUrl}
            alt={prompt.title}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        </div>
      )}
      {prompt.imageUrl && imageError && (
        <div className="w-full h-12 bg-primary-bg flex items-center justify-center border-b border-border opacity-50">
          <span className="text-[10px] uppercase font-bold text-primary tracking-wider">Image non disponible</span>
        </div>
      )}
      <div className="p-3">
        <p className="font-semibold text-text-heading truncate">{prompt.title}</p>
        {/* 6.3 Truncate description to two lines */}
        {prompt.description && (
          <p className="mt-0.5 text-sm text-text line-clamp-2">{prompt.description}</p>
        )}
        {prompt.tags && prompt.tags.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {prompt.tags.map((tag) => (
              <Badge key={tag} label={tag} />
            ))}
          </div>
        )}
      </div>
    </button>
  )
}
