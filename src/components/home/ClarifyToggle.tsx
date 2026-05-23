import { Switch } from '@/components/ui/switch'
import { HelpCircle } from 'lucide-react'

interface ClarifyToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
}

export function ClarifyToggle({ checked, onChange }: ClarifyToggleProps) {
  return (
    <div className="flex items-center gap-2">
      <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="text-xs text-muted-foreground">生成前先澄清需求</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  )
}
