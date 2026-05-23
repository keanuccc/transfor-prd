import { Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface GenerateButtonProps {
  loading: boolean
  disabled: boolean
  onClick: () => void
}

export function GenerateButton({ loading, disabled, onClick }: GenerateButtonProps) {
  return (
    <Button
      className="w-full"
      size="lg"
      disabled={disabled || loading}
      onClick={onClick}
    >
      {loading ? (
        <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
      ) : (
        <Sparkles className="mr-1.5 h-4 w-4" />
      )}
      {loading ? '生成中...' : '生成功能描述'}
    </Button>
  )
}
