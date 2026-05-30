import type { Prompt } from '@/domain/promptSchema'
import { Badge } from '@/shared/ui/Badge'

interface PromptCardProps {
  prompt: Prompt
  isSelected: boolean
  onClick: () => void
}

export function PromptCard({ prompt, isSelected, onClick }: PromptCardProps) {
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
      <div className="p-3">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-text-heading truncate flex-1">{prompt.title}</p>
          {prompt.type === 'image' && (
            <span className="shrink-0 text-base" title="Image prompt" aria-label="Image prompt">🖼</span>
          )}
        </div>
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
