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
            'inline-flex cursor-pointer items-center rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200 active:scale-[0.97]',
            value === style.id
              ? 'border-primary/40 bg-primary text-primary-foreground shadow-sm'
              : 'border-border/60 bg-muted/50 text-muted-foreground hover:border-primary/30 hover:bg-accent/60 hover:text-foreground',
          )}
          title={style.description}
        >
          {style.label}
        </button>
      ))}
    </div>
  )
}
