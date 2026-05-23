import { templates, defaultTemplate, type Template } from '@/lib/templates'
import { FileText, Map, Code } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

const iconMap: Record<string, LucideIcon> = {
  FileText,
  Map,
  Code,
}

interface TemplateSelectorProps {
  value: string
  onChange: (id: string) => void
}

function TemplateOption({ template, selected }: { template: Template; selected: boolean }) {
  const Icon = iconMap[template.icon] || FileText

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-lg border px-4 py-3 cursor-pointer transition-colors',
        selected
          ? 'border-primary bg-primary/5'
          : 'border-border hover:border-muted-foreground/30 hover:bg-muted/20',
      )}
    >
      <div
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-md',
          selected ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className={cn('text-sm font-medium', selected && 'text-primary')}>{template.name}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{template.description}</p>
      </div>
    </div>
  )
}

export function TemplateSelector({ value, onChange }: TemplateSelectorProps) {
  const selectedId = value || defaultTemplate.id

  return (
    <div className="space-y-2">
      {templates.map((t) => (
        <button
          key={t.id}
          type="button"
          className="w-full text-left"
          onClick={() => onChange(t.id)}
        >
          <TemplateOption template={t} selected={selectedId === t.id} />
        </button>
      ))}
    </div>
  )
}
