import { usePrompts } from '@/features/prompts/PromptsContext'
import { PromptListView } from '@/features/prompts/PromptListView'
import { PromptView } from '@/features/prompts/PromptView'
import { MainLayoutShell } from '@/features/layout/MainLayoutShell'

export function App() {
  const { state } = usePrompts()
  const showPromptView = state.selectedPromptId !== null || state.viewMode === 'edit'

  return (
    <MainLayoutShell hideTopBar={showPromptView}>
      {showPromptView ? <PromptView /> : <PromptListView />}
    </MainLayoutShell>
  )
}
