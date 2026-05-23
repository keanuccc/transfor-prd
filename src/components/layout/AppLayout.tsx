import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Toaster } from '@/components/ui/sonner'

export function AppLayout() {
  return (
    <TooltipProvider>
      <div className="flex h-screen bg-background">
        <Sidebar />
        <main className="animate-[fade-in_0.4s_ease-out] flex-1 overflow-hidden bg-gradient-to-br from-background via-background to-muted/20">
          <Outlet />
        </main>
      </div>
      <Toaster />
    </TooltipProvider>
  )
}
