import type { ReactNode } from 'react'
import { SidebarNav } from './SidebarNav'
import { TopAppBar } from './TopAppBar'

interface MainLayoutShellProps {
  children: ReactNode
}

// 4.1 MainLayoutShell composes SidebarNav + main region with TopAppBar + scrollable canvas
export function MainLayoutShell({ children }: MainLayoutShellProps) {
  return (
    // 4.4 Full viewport height, no body overflow
    <div className="flex h-screen overflow-hidden">
      {/* 4.2 SidebarNav: left, fixed */}
      <SidebarNav />

      {/* 4.2 Main region: right, flex-1, overflow-hidden */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* 4.3 TopAppBar: sticky at top of main region */}
        <TopAppBar />

        {/* 4.3 Scrollable content canvas */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
