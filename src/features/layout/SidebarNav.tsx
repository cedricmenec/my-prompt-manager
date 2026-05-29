import { useState } from 'react'
import { usePrompts } from '@/features/prompts/PromptsContext'

type NavItem = string

export function SidebarNav() {
  const { state, dispatch } = usePrompts()
  const [activeNav, setActiveNav] = useState<NavItem>('all-prompts')

  // 2.5 Compute uncollected count (prompts with no tags)
  const uncollectedCount = state.prompts.filter(
    (p) => !p.tags || p.tags.length === 0,
  ).length

  // 2.7 Derive collections from prompt tags (group by tag, count per tag)
  const collectionsMap = new Map<string, number>()
  for (const prompt of state.prompts) {
    for (const tag of prompt.tags ?? []) {
      collectionsMap.set(tag, (collectionsMap.get(tag) ?? 0) + 1)
    }
  }
  const collections = Array.from(collectionsMap.entries()).sort(([a], [b]) =>
    a.localeCompare(b),
  )

  // 2.9 Active state styling
  const navLinkClass = (id: NavItem) =>
    [
      'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
      activeNav === id
        ? 'bg-primary-bg text-primary font-medium'
        : 'text-text hover:bg-surface-muted',
    ].join(' ')

  return (
    // 2.1 Fixed sidebar container: 260px wide, full viewport height, left-anchored
    <aside className="flex h-screen w-[260px] shrink-0 flex-col border-r border-border bg-surface">
      {/* 2.2 Brand header */}
      <div className="flex items-center gap-3 border-b border-border px-4 py-5">
        <svg
          className="size-7 shrink-0 text-primary"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M9 2a1 1 0 0 0 0 2h6a1 1 0 1 0 0-2H9Zm-4 4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6Zm3 4a1 1 0 1 0 0 2h6a1 1 0 1 0 0-2H8Zm0 4a1 1 0 1 0 0 2h4a1 1 0 1 0 0-2H8Z" />
        </svg>
        <span className="text-base font-semibold text-text-heading">Prompt Vault</span>
      </div>

      {/* 2.3 "New Prompt" CTA button */}
      <div className="px-3 py-3">
        <button
          onClick={() => dispatch({ type: 'OPEN_CREATE' })}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          <svg
            className="size-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Prompt
        </button>
      </div>

      {/* 2.4 Primary nav links */}
      <nav className="flex flex-col gap-0.5 px-3" aria-label="Primary navigation">
        <button className={navLinkClass('all-prompts')} onClick={() => setActiveNav('all-prompts')}>
          <svg
            className="size-4 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          All Prompts
        </button>

        <button className={navLinkClass('favorites')} onClick={() => setActiveNav('favorites')}>
          <svg
            className="size-4 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z"
            />
          </svg>
          Favorites
        </button>

        {/* 2.5 Uncollected with badge */}
        <button
          className={navLinkClass('uncollected')}
          onClick={() => setActiveNav('uncollected')}
        >
          <svg
            className="size-4 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z"
            />
          </svg>
          Uncollected
          {uncollectedCount > 0 && (
            <span className="ml-auto rounded-full bg-primary-bg px-2 py-0.5 text-xs font-medium text-primary ring-1 ring-inset ring-primary-border">
              {uncollectedCount}
            </span>
          )}
        </button>
      </nav>

      {/* 2.6 Collections section header + 2.7 Collections list */}
      <div className="mt-4 flex flex-col gap-0.5 px-3">
        <div className="flex items-center justify-between px-1 py-1">
          <span className="text-xs font-semibold uppercase tracking-wider text-text">
            Collections
          </span>
          {/* Non-functional add button */}
          <button
            className="rounded p-0.5 text-text transition-colors hover:bg-surface-muted"
            aria-label="New collection"
          >
            <svg
              className="size-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        {collections.length === 0 ? (
          <p className="px-1 py-1 text-xs italic text-text">No collections yet</p>
        ) : (
          collections.map(([tag, count]) => (
            <button
              key={tag}
              className={navLinkClass(`col:${tag}`)}
              onClick={() => setActiveNav(`col:${tag}`)}
            >
              <svg
                className="size-4 shrink-0"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 6h.008v.008H6V6Z"
                />
              </svg>
              <span className="truncate">{tag}</span>
              <span className="ml-auto shrink-0 text-xs text-text">{count}</span>
            </button>
          ))
        )}
      </div>

      {/* 2.8 Footer with Dark Mode toggle (non-functional) */}
      <div className="mt-auto border-t border-border px-3 py-3">
        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-text transition-colors hover:bg-surface-muted">
          <svg
            className="size-4 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z"
            />
          </svg>
          Dark Mode
        </button>
      </div>
    </aside>
  )
}
