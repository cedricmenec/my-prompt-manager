import { usePrompts } from '@/features/prompts/PromptsContext'
import { PromptListView } from '@/features/prompts/PromptListView'
import { PromptView } from '@/features/prompts/PromptView'
import { ImagePromptView } from '@/features/prompts/ImagePromptView'
import { MainLayoutShell } from '@/features/layout/MainLayoutShell'

export function App() {
  const { state, appView } = usePrompts()

  let content
  if (state.selectedPromptId !== null && state.viewMode === 'edit') {
    content = <PromptView />
  } else if (state.selectedPromptId !== null && appView === 'gallery') {
    content = <ImagePromptView />
  } else if (state.selectedPromptId !== null || state.viewMode === 'edit') {
    content = <PromptView />
  } else {
    content = <PromptListView />
  }

  return (
    <MainLayoutShell>
      {content}
    </MainLayoutShell>
  )
}
