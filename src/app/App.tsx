import { usePrompts } from '@/features/prompts/PromptsContext'
import { PromptListView } from '@/features/prompts/PromptListView'
import { PromptDetailPanel } from '@/features/prompts/PromptDetailPanel'
import { PromptEditor } from '@/features/prompts/PromptEditor'
import { MainLayoutShell } from '@/features/layout/MainLayoutShell'

export function App() {
  const { state } = usePrompts()
  const showEditor = state.editorMode !== null
  const showDetail = state.selectedPromptId !== null

  return (
    // 5.1-5.3 Use MainLayoutShell as the top-level layout wrapper
    <MainLayoutShell>
      {/* 5.4 Content canvas: list grid + detail panel side by side */}
      <div className="flex h-full overflow-hidden">
        <div className={`flex flex-col ${showDetail ? 'w-auto flex-1' : 'flex-1'}`}>
          <PromptListView />
        </div>

        {showDetail && (
          <div className="w-96 shrink-0 border-l border-border overflow-hidden">
            <PromptDetailPanel />
          </div>
        )}
      </div>

      {/* Editor overlay */}
      {showEditor && <PromptEditor />}
    </MainLayoutShell>
  )
}
