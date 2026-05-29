import { type ReactNode } from 'react'
import { Button } from './Button'

interface ModalAction {
  label: string
  variant?: 'primary' | 'secondary' | 'danger'
  onClick: () => void
}

interface ModalProps {
  title: string
  children: ReactNode
  actions?: ModalAction[]
  onClose: () => void
}

export function Modal({ title, children, actions = [], onClose }: ModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md rounded-lg bg-surface p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <h2 className="text-lg font-semibold text-text-heading">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="ml-4 text-text hover:text-text-heading"
          >
            ×
          </button>
        </div>

        <div className="mb-6 text-sm text-text">{children}</div>

        {actions.length > 0 && (
          <div className="flex justify-end gap-2">
            {actions.map((action) => (
              <Button
                key={action.label}
                variant={action.variant ?? 'secondary'}
                onClick={action.onClick}
              >
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
