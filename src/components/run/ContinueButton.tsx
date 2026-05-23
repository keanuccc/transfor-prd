import { Forward } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ContinueButtonProps {
  onClick: () => void
  loading?: boolean
}

export function ContinueButton({ onClick, loading }: ContinueButtonProps) {
  return (
    <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={onClick} disabled={loading}>
      <Forward className="h-3.5 w-3.5" />
      继续生成
    </Button>
  )
}
