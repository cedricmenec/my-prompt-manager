import { usePrompts } from '@/features/prompts/PromptsContext'

export function GlobalTopBar() {
  const { appView, setAppView } = usePrompts()

  return (
    <div className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-surface px-4">
      {/* Logo + app name */}
      <div className="flex items-center gap-2.5">
        <svg
          className="size-6 shrink-0 text-primary"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M9 2a1 1 0 0 0 0 2h6a1 1 0 1 0 0-2H9Zm-4 4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6Zm3 4a1 1 0 1 0 0 2h6a1 1 0 1 0 0-2H8Zm0 4a1 1 0 1 0 0 2h4a1 1 0 1 0 0-2H8Z" />
        </svg>
        <span className="text-sm font-semibold text-text-heading">Prompt Vault</span>
      </div>

      {/* Segmented control: Prompts | Gallery */}
      <div className="flex overflow-hidden rounded-lg border border-border">
        <button
          onClick={() => setAppView('prompts')}
          className={[
            'flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium transition-colors',
            appView === 'prompts'
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
          Prompts
        </button>
        <button
          onClick={() => setAppView('gallery')}
          className={[
            'flex items-center gap-1.5 border-l border-border px-4 py-1.5 text-sm font-medium transition-colors',
            appView === 'gallery'
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
              d="M2.25 15.75l5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
            />
          </svg>
          Gallery
        </button>
      </div>
    </div>
  )
}
