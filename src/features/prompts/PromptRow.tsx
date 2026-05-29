import type { Prompt } from '@/domain/promptSchema'
import { Badge } from '@/shared/ui/Badge'

interface PromptRowProps {
  prompt: Prompt
  isSelected: boolean
  onClick: () => void
}

export function PromptRow({ prompt, isSelected, onClick }: PromptRowProps) {
  return (
    <button
      onClick={onClick}
      className={[
        'w-full text-left flex items-center gap-3 rounded-lg border px-3 py-2 transition-colors',
        isSelected
          ? 'border-primary bg-primary-bg'
          : 'border-border bg-surface hover:bg-surface-muted',
      ].join(' ')}
    >
      <span className="font-semibold text-text-heading truncate shrink-0 max-w-[30%]">
        {prompt.title}
      </span>
      {prompt.description && (
        <span className="flex-1 text-sm text-text truncate min-w-0">
          {prompt.description}
        </span>
      )}
      {prompt.tags && prompt.tags.length > 0 && (
        <span className="flex items-center gap-1 shrink-0 ml-auto">
          {prompt.tags.map((tag) => (
            <Badge key={tag} label={tag} />
          ))}
        </span>
      )}
    </button>
  )
}
