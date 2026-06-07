import { type InputHTMLAttributes, type TextareaHTMLAttributes, type JSX } from 'react'

// ---------------------------------------------------------------------------
// MagicInput — Reusable input/textarea with integrated AI magic-wand icon.
// ---------------------------------------------------------------------------

type InputVariant = 'single' | 'multi'

interface MagicInputBaseProps {
  /** 'single' renders <input>, 'multi' renders <textarea> */
  variant?: InputVariant
  /** Callback invoked when the magic icon is clicked */
  onMagicAction?: () => void
  /** When true the icon pulses and the magic button is disabled */
  isGenerating?: boolean
}

// Accept either input or textarea native props depending on variant.
export type MagicInputProps = MagicInputBaseProps &
  Omit<InputHTMLAttributes<HTMLInputElement>, 'children'> &
  Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'children'>

// ---------------------------------------------------------------------------
// Inline SVG — magic wand icon
// ---------------------------------------------------------------------------
function MagicWandIcon() {
  return (
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
        d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z"
      />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export function MagicInput({
  variant = 'single',
  onMagicAction,
  isGenerating = false,
  className = '',
  disabled,
  ...rest
}: MagicInputProps): JSX.Element {
  const isDisabled = disabled || isGenerating

  const handleMagicClick = () => {
    if (!isDisabled && onMagicAction) onMagicAction()
  }

  // Shared classes for the native element
  const fieldClasses = [
    'w-full rounded-md border border-border bg-surface px-3 py-1.5 text-sm text-text-heading',
    'focus:border-primary focus:outline-none',
    'placeholder:text-text/50',
    'pr-10', // leave room for the magic icon
    isGenerating ? 'magic-input--generating' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const field =
    variant === 'multi' ? (
      <textarea
        rows={3}
        className={[fieldClasses, 'resize-y'].join(' ')}
        disabled={isDisabled}
        {...(rest as TextareaHTMLAttributes<HTMLTextAreaElement>)}
      />
    ) : (
      <input
        type="text"
        className={fieldClasses}
        disabled={isDisabled}
        {...(rest as InputHTMLAttributes<HTMLInputElement>)}
      />
    )

  return (
    <div className="relative">
      {/* Keyframe animation injected once */}
      <style>{`
        @keyframes pulse-magic {
          0%, 100% { color: var(--accent); opacity: 1; }
          50% { color: #c084fc; opacity: 0.7; }
        }
        .magic-input--generating {
          /* Subtle visual feedback on the field itself */
        }
        .magic-input__icon--pulse {
          animation: pulse-magic 1.4s ease-in-out infinite;
        }
      `}</style>

      {field}

      {/* Magic wand icon button */}
      <button
        type="button"
        onClick={handleMagicClick}
        disabled={isDisabled}
        aria-label="Generate with AI"
        aria-disabled={isDisabled || undefined}
        className={[
          'absolute right-2 top-1/2 -translate-y-1/2',
          'inline-flex items-center justify-center rounded p-0.5',
          'text-text hover:text-accent hover:bg-accent-bg',
          'transition-colors',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary',
          isGenerating ? 'magic-input__icon--pulse' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <MagicWandIcon />
      </button>
    </div>
  )
}
