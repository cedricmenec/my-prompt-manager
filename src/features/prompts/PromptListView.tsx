import { usePrompts } from './PromptsContext'
import { PromptCard } from './PromptCard'

export function PromptListView() {
  // 6.2 Button import removed — "New Prompt" moved to SidebarNav
  const { state, dispatch } = usePrompts()
  const sorted = [...state.prompts].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  )

  return (
    <div className="px-4 py-4">
      {sorted.length === 0 ? (
        <p className="mt-8 text-center text-sm text-text">
          No prompts yet. Create your first one.
        </p>
      ) : (
        // 6.1 Responsive grid: 1 col small, 2 col medium, 3 col large
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
    </div>
  )
}
