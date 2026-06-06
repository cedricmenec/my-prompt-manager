import { useState, useEffect, useCallback, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { Markdown } from 'tiptap-markdown'
import './MarkdownEditor.css'

// ---------------------------------------------------------------------------
// MarkdownEditor — WYSIWYG Markdown editing component
// ---------------------------------------------------------------------------

/** Safely extract Markdown from tiptap-markdown storage */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getMarkdown(editor: any): string {
  return editor.storage.markdown.getMarkdown() as string
}

export interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
  error?: boolean
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder = 'Write your prompt here…',
  rows = 8,
  error = false,
}: MarkdownEditorProps) {
  const [isSourceMode, setIsSourceMode] = useState(false)

  // Track whether we're still processing the initial content load.
  // While true, onUpdate callbacks are suppressed to prevent the editor's
  // initial empty content from overwriting the parent's value.
  const isInitializing = useRef(true)
  // Track the last value we pushed into the editor to avoid echo loops
  const lastSetValue = useRef(value)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Placeholder.configure({
        placeholder,
      }),
      Markdown.configure({
        html: false,
        tightLists: true,
        bulletListMarker: '-',
        transformPastedText: true,
        transformCopiedText: true,
      }),
    ],
    // Initialize with the real value so ProseMirror never starts empty
    content: value || '',
    onUpdate: ({ editor: e }) => {
      // Suppress the initial transaction that fires when content is set.
      // Once we've processed the initial load, future updates propagate normally.
      if (isInitializing.current) return
      if (isSourceMode) return
      const md = getMarkdown(e)
      lastSetValue.current = md
      onChange(md)
    },
  })

  // After the editor mounts, open the onUpdate gate so future edits propagate.
  // The content is already loaded via `content: value || ''` in useEditor,
  // so no setContent call is needed on mount.
  useEffect(() => {
    if (!editor) return
    if (isInitializing.current) {
      isInitializing.current = false
      return
    }
    // For subsequent external changes (e.g. cancel restoring original value)
    if (value !== lastSetValue.current) {
      editor.commands.setContent(value)
      lastSetValue.current = value
    }
  }, [editor, value])

  // Cleanup editor on unmount
  useEffect(() => {
    return () => {
      editor?.destroy()
    }
  }, [editor])

  const handleToggleSource = useCallback(() => {
    if (!editor) return

    if (!isSourceMode) {
      // WYSIWYG → Source: serialize current doc to markdown
      const md = getMarkdown(editor)
      lastSetValue.current = md
      onChange(md)
      setIsSourceMode(true)
    } else {
      // Source → WYSIWYG: re-parse the current value into ProseMirror
      setIsSourceMode(false)
      // Use the last known value from the textarea
      editor.commands.setContent(lastSetValue.current)
    }
  }, [editor, isSourceMode, onChange])

  const handleSourceChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      lastSetValue.current = e.target.value
      onChange(e.target.value)
    },
    [onChange],
  )

  const lineHeight = 1.5 // rem approx for text-sm
  const minHeight = `${rows * lineHeight}rem`

  return (
    <div className="md-editor-wrapper">
      {/* Toggle button */}
      <div className="md-editor-toolbar">
        <button
          type="button"
          onClick={handleToggleSource}
          className="md-editor-toggle"
          title={isSourceMode ? 'Switch to visual editor' : 'Switch to Markdown source'}
        >
          MD
        </button>
      </div>

      {/* Editor area */}
      {isSourceMode ? (
        <textarea
          value={lastSetValue.current}
          onChange={handleSourceChange}
          className={`md-editor-source ${error ? 'md-editor-error' : ''}`}
          style={{ minHeight }}
          spellCheck={false}
        />
      ) : (
        <div
          className={`md-editor-prosemirror ${error ? 'md-editor-error' : ''}`}
          style={{ minHeight }}
        >
          {editor && <EditorContent editor={editor} />}
        </div>
      )}
    </div>
  )
}
