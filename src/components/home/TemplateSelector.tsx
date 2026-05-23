import { useCallback } from 'react'
import { getAllTemplates, defaultTemplate, type Template } from '@/lib/templates'
import {
  FileText, Map, Code, PenTool, Rocket, Shield, Database,
  Palette, Zap, Globe, Layers, BookOpen, Trash2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'
import { useTemplateStore } from '@/stores/templateStore'
import { toast } from 'sonner'

const iconMap: Record<string, LucideIcon> = {
  FileText, Map, Code, PenTool, Rocket, Shield, Database,
  Palette, Zap, Globe, Layers, BookOpen,
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
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className={cn('text-sm font-medium', selected && 'text-primary')}>{template.name}</p>
          {template.isCustom && (
            <span className="rounded-full bg-purple-50 px-1.5 py-0 text-[9px] text-purple-600 dark:bg-purple-950/40 dark:text-purple-300">自定义</span>
          )}
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">{template.description}</p>
      </div>
    </div>
  )
}

export function TemplateSelector({ value, onChange }: TemplateSelectorProps) {
  const templates = getAllTemplates()
  const selectedId = value || defaultTemplate.id
  const deleteTemplate = useTemplateStore((s) => s.deleteTemplate)

  const builtinTemplates = templates.filter((t) => !t.isCustom)
  const customTemplates = templates.filter((t) => t.isCustom)

  const handleDelete = useCallback(
    (e: React.MouseEvent, id: string) => {
      e.stopPropagation()
      deleteTemplate(id)
      if (selectedId === id) {
        onChange(defaultTemplate.id)
      }
      toast.success('模板已删除')
    },
    [deleteTemplate, onChange, selectedId],
  )

  return (
    <div className="space-y-2">
      {builtinTemplates.map((t) => (
        <button
          key={t.id}
          type="button"
          className="w-full text-left"
          onClick={() => onChange(t.id)}
        >
          <TemplateOption template={t} selected={selectedId === t.id} />
        </button>
      ))}
      {customTemplates.length > 0 && (
        <>
          <p className="pt-1 text-[10px] font-medium text-muted-foreground">自定义模板</p>
          {customTemplates.map((t) => (
            <div key={t.id} className="group relative">
              <button
                type="button"
                className="w-full text-left"
                onClick={() => onChange(t.id)}
              >
                <TemplateOption template={t} selected={selectedId === t.id} />
              </button>
              <button
                className="absolute right-2 top-2 rounded p-1 text-muted-foreground opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                onClick={(e) => handleDelete(e, t.id)}
                title="删除模板"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </>
      )}
    </div>
  )
}
