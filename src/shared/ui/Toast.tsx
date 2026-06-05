import type { Toast } from './useToast'

interface ToastContainerProps {
  toasts: Toast[]
}

export function ToastContainer({ toasts }: ToastContainerProps) {
  if (toasts.length === 0) return null
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={[
            'rounded-md px-4 py-2 text-sm font-medium text-white shadow-lg',
            t.variant === 'error' ? 'bg-red-600' : 'bg-green-600',
          ].join(' ')}
        >
          {t.message}
        </div>
      ))}
    </div>
  )
}
