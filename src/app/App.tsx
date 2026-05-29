import { usePrompts } from '@/features/prompts/PromptsContext'
import { PromptListView } from '@/features/prompts/PromptListView'
import { PromptDetailPanel } from '@/features/prompts/PromptDetailPanel'
import { PromptEditor } from '@/features/prompts/PromptEditor'

export function App() {
  const { state } = usePrompts()
  const showEditor = state.editorMode !== null
  const showDetail = state.selectedPromptId !== null

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left column: list */}
      <div className={`flex flex-col ${showDetail ? 'w-72 shrink-0' : 'flex-1'} border-r border-border`}>
        <PromptListView />
      </div>

      {/* Right column: detail panel */}
      {showDetail && (
        <div className="flex-1 overflow-hidden">
          <PromptDetailPanel />
        </div>
      )}

      {/* Editor overlay */}
      {showEditor && <PromptEditor />}
    </div>
  )
}
