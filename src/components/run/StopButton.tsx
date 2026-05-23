import { Square } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface StopButtonProps {
  onClick: () => void
}

export function StopButton({ onClick }: StopButtonProps) {
  return (
    <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs" onClick={onClick}>
      <Square className="h-3 w-3" />
      停止
    </Button>
  )
}
