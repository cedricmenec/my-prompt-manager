import { useState, useEffect } from 'react'
import { usePrompts } from './PromptsContext'
import { PromptCard } from './PromptCard'
import { PromptRow } from './PromptRow'
import { useDebounce } from '@/shared/hooks/useDebounce'

type ViewMode = 'grid' | 'list'

function GridIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
    </svg>
  )
}

function ListIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  )
}

export function PromptListView() {
  const { state, dispatch, filteredPrompts, setSearchQuery } = usePrompts()

  const [viewMode, setViewMode] = useState<ViewMode>(
    () => (localStorage.getItem('promptViewMode') as ViewMode) ?? 'grid',
  )
  const [inputValue, setInputValue] = useState('')
  const debouncedQuery = useDebounce(inputValue, 150)

  useEffect(() => {
    localStorage.setItem('promptViewMode', viewMode)
  }, [viewMode])

  useEffect(() => {
    setSearchQuery(debouncedQuery)
  }, [debouncedQuery, setSearchQuery])

  const sorted = [...filteredPrompts].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  )

  const hasPrompts = state.prompts.length > 0
  const hasResults = sorted.length > 0

  return (
    <div className="px-4 py-4">
      {/* Toolbar: search + view-mode toggle */}
      <div className="mb-4 flex items-center gap-2">
        <input
          type="search"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Search prompts…"
          className="flex-1 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          onClick={() => setViewMode('grid')}
          aria-label="Grid view"
          className={[
            'rounded p-1.5 transition-colors',
            viewMode === 'grid'
              ? 'bg-primary-bg text-primary'
              : 'text-text hover:bg-surface-muted',
          ].join(' ')}
        >
          <GridIcon />
        </button>
        <button
          onClick={() => setViewMode('list')}
          aria-label="List view"
          className={[
            'rounded p-1.5 transition-colors',
            viewMode === 'list'
              ? 'bg-primary-bg text-primary'
              : 'text-text hover:bg-surface-muted',
          ].join(' ')}
        >
          <ListIcon />
        </button>
      </div>

      {/* Empty states */}
      {!hasPrompts && (
        <p className="mt-8 text-center text-sm text-text">
          No prompts yet. Create your first one.
        </p>
      )}
      {hasPrompts && !hasResults && (
        <p className="mt-8 text-center text-sm text-text">
          No results for "{inputValue}". Try a different search.
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

