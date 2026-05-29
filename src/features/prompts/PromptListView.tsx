import { usePrompts } from './PromptsContext'
import { PromptCard } from './PromptCard'
import { PromptRow } from './PromptRow'

export function PromptListView() {
  const { state, dispatch, filteredPrompts, viewMode } = usePrompts()

  const sorted = [...filteredPrompts].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  )

  const hasPrompts = state.prompts.length > 0
  const hasResults = sorted.length > 0

  return (
    <div className="px-4 py-4">
      {/* Empty states */}
      {!hasPrompts && (
        <p className="mt-8 text-center text-sm text-text">
          No prompts yet. Create your first one.
        </p>
      )}
      {hasPrompts && !hasResults && (
        <p className="mt-8 text-center text-sm text-text">
          No results. Try a different search.
        </p>
      )}

      {/* Grid view */}
      {hasResults && viewMode === 'grid' && (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
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

      {/* List view */}
      {hasResults && viewMode === 'list' && (
        <ul className="flex flex-col gap-1.5">
          {sorted.map((prompt) => (
            <li key={prompt.id}>
              <PromptRow
                prompt={prompt}
                isSelected={state.selectedPromptId === prompt.id}
                onClick={() => dispatch({ type: 'SELECT', id: prompt.id })}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
