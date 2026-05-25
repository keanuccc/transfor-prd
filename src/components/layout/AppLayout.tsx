import { Outlet } from "react-router-dom"
import { Sidebar } from "./Sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"

export function AppLayout() {
  return (
    <TooltipProvider>
      <div className="relative flex h-screen bg-background overflow-hidden">
        {/* Ambient background texture */}
        <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(32_38%_88%/0.25),transparent_55%),radial-gradient(ellipse_at_bottom_left,hsl(34_14%_93%/0.2),transparent_55%)] dark:bg-[radial-gradient(ellipse_at_top_right,hsl(32_25%_18%/0.3),transparent_55%),radial-gradient(ellipse_at_bottom_left,hsl(30_10%_11%/0.3),transparent_55%)]" />
        <Sidebar />
        <main className="animate-[fade-in_0.5s_ease-out] relative flex-1 min-h-0 overflow-hidden">
          <Outlet />
        </main>
      </div>
      <Toaster />
    </TooltipProvider>
  )
}
