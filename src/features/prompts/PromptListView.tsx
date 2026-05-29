import { usePrompts } from './PromptsContext'
import { PromptCard } from './PromptCard'
import { Button } from '@/shared/ui/Button'

export function PromptListView() {
  const { state, dispatch } = usePrompts()
  const sorted = [...state.prompts].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  )

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h1 className="text-lg font-semibold text-text-heading">Prompts</h1>
        <Button onClick={() => dispatch({ type: 'OPEN_CREATE' })}>
          + New Prompt
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        {sorted.length === 0 ? (
          <p className="text-sm text-text mt-8 text-center">
            No prompts yet. Create your first one.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {sorted.map((prompt) => (
              <li key={prompt.id}>
                <PromptCard
                  prompt={prompt}
                  isSelected={state.selectedPromptId === prompt.id}
                  onClick={() => dispatch({ type: 'SELECT', id: prompt.id })}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
