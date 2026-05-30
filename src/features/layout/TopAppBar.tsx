import { useState, useEffect } from 'react'
import { usePrompts } from '@/features/prompts/PromptsContext'
import { useDebounce } from '@/shared/hooks/useDebounce'

export function TopAppBar() {
  const { setSearchQuery, viewMode, setViewMode, appView } = usePrompts()
  const [inputValue, setInputValue] = useState('')
  const debouncedQuery = useDebounce(inputValue, 150)

  useEffect(() => {
    setSearchQuery(debouncedQuery)
  }, [debouncedQuery, setSearchQuery])

  return (
    <div className="sticky top-0 z-10 flex flex-col gap-2 border-b border-border bg-surface px-4 py-3">
      {/* Search input with search icon */}
      <div className="relative">
        <svg
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
          />
        </svg>
        <input
          type="search"
          placeholder="Search prompts..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="w-full rounded-lg border border-border bg-surface-muted py-2 pl-9 pr-4 text-sm text-text-heading placeholder:text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* View toggle — hidden in gallery view */}
      {appView !== 'gallery' && (
      <div className="flex items-center gap-2">
        <div className="ml-auto flex overflow-hidden rounded-md border border-border">
          <button
            aria-label="Grid view"
            onClick={() => setViewMode('grid')}
            className={[
              'flex items-center justify-center p-1.5 transition-colors',
              viewMode === 'grid'
                ? 'bg-primary text-white'
                : 'bg-surface text-text hover:bg-surface-muted',
            ].join(' ')}
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
                d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z"
              />
            </svg>
          </button>
          <button
            aria-label="List view"
            onClick={() => setViewMode('list')}
            className={[
              'flex items-center justify-center border-l border-border p-1.5 transition-colors',
              viewMode === 'list'
                ? 'bg-primary text-white'
                : 'bg-surface text-text hover:bg-surface-muted',
            ].join(' ')}
          >
            <svg
              className="size-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
      )}
    </div>
  )
}
