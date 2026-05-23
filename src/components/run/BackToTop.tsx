import { useState, useEffect, useCallback } from 'react'
import { ArrowUp } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface BackToTopProps {
  /** The scrollable element to track */
  container: HTMLElement | null
}

export function BackToTop({ container }: BackToTopProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!container) return

    const handler = () => {
      setVisible(container.scrollTop > container.clientHeight)
    }

    container.addEventListener('scroll', handler, { passive: true })
    handler()
    return () => container.removeEventListener('scroll', handler)
  }, [container])

  const handleClick = useCallback(() => {
    container?.scrollTo({ top: 0, behavior: 'smooth' })
  }, [container])

  if (!visible) return null

  return (
    <Button
      variant="outline"
      size="icon"
      className="fixed bottom-6 right-8 z-40 size-9 rounded-full border-border/60 bg-background/80 shadow-md backdrop-blur-sm transition-all hover:bg-muted hover:shadow-lg"
      onClick={handleClick}
    >
      <ArrowUp className="h-4 w-4" />
    </Button>
  )
}
