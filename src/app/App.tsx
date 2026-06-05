import { usePrompts } from '@/features/prompts/PromptsContext'
import { PromptListView } from '@/features/prompts/PromptListView'
import { PromptView } from '@/features/prompts/PromptView'
import { ImagePromptView } from '@/features/prompts/ImagePromptView'
import { MainLayoutShell } from '@/features/layout/MainLayoutShell'
import { useEffect } from 'react'
import { createAutomaticSnapshotIfNeeded } from '@/infrastructure/driveSnapshots'

export function App() {
  const { state, appView } = usePrompts()

  useEffect(() => {
    const timer = window.setInterval(() => {
      createAutomaticSnapshotIfNeeded(state.prompts).catch(console.error)
    }, 60_000)
    return () => window.clearInterval(timer)
  }, [state.prompts])

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
