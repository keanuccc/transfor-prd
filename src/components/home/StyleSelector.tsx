import { STYLE_OPTIONS } from '@/lib/stylePrompts'
import { cn } from '@/lib/utils'

interface StyleSelectorProps {
  value: string
  onChange: (styleId: string) => void
}

export function StyleSelector({ value, onChange }: StyleSelectorProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {STYLE_OPTIONS.map((style) => (
        <button
          key={style.id}
          type="button"
          onClick={() => onChange(style.id)}
          className={cn(
            'inline-flex cursor-pointer items-center rounded-full border px-2.5 py-1 text-xs font-medium transition-all active:scale-[0.97]',
            value === style.id
              ? 'border-primary/30 bg-primary text-primary-foreground shadow-xs'
              : 'border-border/50 bg-muted/40 text-muted-foreground hover:border-border hover:bg-muted hover:text-foreground',
          )}
          title={style.description}
        >
          {style.label}
        </button>
      ))}
    </div>
  )
}
