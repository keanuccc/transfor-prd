import { RouterProvider } from 'react-router-dom'
import { router } from '@/router'
import { useEffect } from 'react'
import { useConversationStore } from '@/stores/conversationStore'
import { useAppStore, applyTheme } from '@/stores/appStore'
import { ErrorBoundary } from '@/components/ErrorBoundary'

export default function App() {
  const loadConversations = useConversationStore((s) => s.loadConversations)
  const theme = useAppStore((s) => s.theme)

  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  // Sync theme class to <html> and listen for system preference changes
  useEffect(() => {
    applyTheme(theme)

    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      const handler = () => applyTheme('system')
      mq.addEventListener('change', handler)
      return () => mq.removeEventListener('change', handler)
    }
  }, [theme])

  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  )
}
