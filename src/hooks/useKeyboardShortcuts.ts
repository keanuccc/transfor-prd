import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

interface ShortcutHandlers {
  onNewConversation?: () => void
  onToggleEdit?: () => void
  onExportMd?: () => void
}

export function useKeyboardShortcuts({ onNewConversation, onToggleEdit, onExportMd }: ShortcutHandlers) {
  const navigate = useNavigate()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMod = e.ctrlKey || e.metaKey
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return

      if (isMod && e.key === 'n') {
        e.preventDefault()
        onNewConversation ? onNewConversation() : navigate('/')
      }
      if (isMod && e.key === 'e') {
        e.preventDefault()
        onToggleEdit?.()
      }
      if (isMod && e.key === 's') {
        e.preventDefault()
        onExportMd?.()
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [navigate, onNewConversation, onToggleEdit, onExportMd])
}
