import type { ReactNode } from 'react'
import { SidebarNav } from './SidebarNav'
import { TopAppBar } from './TopAppBar'
import { GlobalTopBar } from './GlobalTopBar'
import { usePrompts } from '@/features/prompts/PromptsContext'

interface MainLayoutShellProps {
  children: ReactNode
}

// 4.1 MainLayoutShell composes GlobalTopBar + SidebarNav + main region with TopAppBar + scrollable canvas
export function MainLayoutShell({ children }: MainLayoutShellProps) {
  const { state } = usePrompts()
  const hideTopBar = state.selectedPromptId !== null || state.viewMode === 'edit'

  return (
    // Full viewport height, no body overflow
    <div className="flex h-screen flex-col overflow-hidden">
      {/* GlobalTopBar: full-width, always visible */}
      <GlobalTopBar />

      {/* Sidebar + main region */}
      <div className="flex flex-1 overflow-hidden">
        {/* SidebarNav: left, fixed */}
        <SidebarNav />

        {/* Main region: right, flex-1, overflow-hidden */}
        <main className="flex flex-1 flex-col overflow-hidden">
          {/* TopAppBar: contextual, hidden when PromptView or ImagePromptView is active */}
          {!hideTopBar && <TopAppBar />}

          {/* Scrollable content canvas */}
          <div className="flex-1 overflow-y-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
