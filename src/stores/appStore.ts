import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Theme = 'light' | 'dark' | 'system'

interface AppState {
  sidebarCollapsed: boolean
  theme: Theme
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setTheme: (theme: Theme) => void
  resolvedTheme: () => 'light' | 'dark'
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      sidebarCollapsed: false,
      theme: 'system',

      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

      setTheme: (theme) => {
        set({ theme })
        applyTheme(theme)
      },

      resolvedTheme: () => {
        const { theme } = get()
        if (theme === 'system') {
          return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
        }
        return theme
      },
    }),
    {
      name: 'app-store',
      partialize: (state) => ({ theme: state.theme }),
    },
  ),
)

export function applyTheme(theme: Theme) {
  const root = document.documentElement
  const isDark =
    theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

  root.classList.toggle('dark', isDark)
}

// Call once on import to sync with persisted value
if (typeof window !== 'undefined') {
  const stored = localStorage.getItem('app-store')
  if (stored) {
    try {
      const parsed = JSON.parse(stored)
      const theme = parsed?.state?.theme as Theme | undefined
      applyTheme(theme || 'system')
    } catch {
      applyTheme('system')
    }
  }
}
