import { useState } from 'react'
import { usePrompts } from './PromptsContext'
import { promptRepository } from '@/infrastructure/promptRepository'
import { Badge } from '@/shared/ui/Badge'
import { Button } from '@/shared/ui/Button'
import { Modal } from '@/shared/ui/Modal'
import { useToast, ToastContainer } from '@/shared/ui/Toast'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Minimal Markdown → HTML (headers, bold, italic, code blocks, inline code). */
function renderMarkdown(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, (block) => {
      const code = block.replace(/^```[^\n]*\n?/, '').replace(/```$/, '')
      return `<pre><code>${escHtml(code)}</code></pre>`
    })
    .replace(/`([^`]+)`/g, (_, c) => `<code>${escHtml(c)}</code>`)
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(?!<[h|p|u|o|l|c|p])/gm, '')
    .trim()
    .replace(/^(.)/s, '<p>$1')
    .replace(/(.)$/s, '$1</p>')
}

function escHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

export function PromptDetailPanel() {
  const { state, dispatch } = usePrompts()
  const { toasts, show: showToast } = useToast()
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const prompt = state.prompts.find((p) => p.id === state.selectedPromptId)

  if (!prompt) return null

  async function handleDelete() {
    if (!prompt) return
    await promptRepository.delete(prompt.id)
    dispatch({ type: 'REMOVE', id: prompt.id })
    setShowDeleteModal(false)
  }

  async function handleCopy() {
    if (!prompt) return
    await navigator.clipboard.writeText(prompt.content)
    showToast('Copied to clipboard!')
  }

  async function handleToggleFavorite() {
    if (!prompt) return
    const updated = await promptRepository.update(prompt.id, { isFavorite: !prompt.isFavorite })
    dispatch({ type: 'UPDATE', prompt: updated })
  }

  function handleEdit() {
    dispatch({ type: 'OPEN_EDIT' })
  }

  return (
    <>
      <div className="flex h-full flex-col border-l border-border bg-surface">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border px-6 py-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-semibold text-text-heading truncate">
              {prompt.title}
            </h2>
            {prompt.description && (
              <p className="mt-0.5 text-sm text-text">{prompt.description}</p>
            )}
          </div>
          <div className="ml-4 flex gap-2 shrink-0">
            <button
              onClick={() => dispatch({ type: 'DESELECT' })}
              aria-label="Close detail panel"
              className="inline-flex items-center justify-center rounded-md px-2 py-1.5 text-sm transition-colors border border-border hover:bg-surface-muted"
              title="Close"
            >
              ×
            </button>
            <button
              onClick={handleToggleFavorite}
              aria-label={prompt.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              className="inline-flex items-center justify-center rounded-md px-2 py-1.5 text-sm transition-colors border border-border hover:bg-surface-muted"
              title={prompt.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              {prompt.isFavorite ? (
                <svg className="size-4 text-amber-400 fill-amber-400" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                </svg>
              ) : (
                <svg className="size-4 text-text" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                </svg>
              )}
            </button>
            <Button variant="secondary" onClick={handleCopy}>Copy</Button>
            <Button variant="secondary" onClick={handleEdit}>Edit</Button>
            <Button variant="danger" onClick={() => setShowDeleteModal(true)}>Delete</Button>
          </div>
        </div>

        {/* Tags */}
        {prompt.tags && prompt.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 border-b border-border px-6 py-2">
            {prompt.tags.map((tag) => (
              <Badge key={tag} label={tag} />
            ))}
          </div>
        )}

        {/* Content — rendered Markdown */}
        <div
          className="flex-1 overflow-y-auto px-6 py-4 prose prose-sm max-w-none text-text"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: renderMarkdown(prompt.content) }}
        />

        {/* Notes section */}
        {prompt.notes && (
          <div className="border-t border-border px-6 py-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text mb-2">Notes</h3>
            <p className="whitespace-pre-wrap text-sm text-text">{prompt.notes}</p>
          </div>
        )}

        {/* Metadata footer */}
        <div className="border-t border-border px-6 py-3 text-xs text-text space-y-1">
          {prompt.model && (
            <div><span className="font-medium">Model:</span> {prompt.model}</div>
          )}
          {prompt.temperature !== undefined && (
            <div><span className="font-medium">Temperature:</span> {prompt.temperature}</div>
          )}
          <div><span className="font-medium">Created:</span> {formatDate(prompt.createdAt)}</div>
          <div><span className="font-medium">Updated:</span> {formatDate(prompt.updatedAt)}</div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <Modal
          title="Delete prompt"
          onClose={() => setShowDeleteModal(false)}
          actions={[
            { label: 'Cancel', variant: 'secondary', onClick: () => setShowDeleteModal(false) },
            { label: 'Delete', variant: 'danger', onClick: handleDelete },
          ]}
        >
          Are you sure you want to delete <strong>{prompt.title}</strong>? This cannot be undone.
        </Modal>
      )}

      <ToastContainer toasts={toasts} />
    </>
  )
}
