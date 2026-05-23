import { useMemo, useEffect, useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import GithubSlugger from 'github-slugger'

interface TocItem {
  id: string
  text: string
  level: 1 | 2
}

function extractToc(markdown: string): TocItem[] {
  const slugger = new GithubSlugger()
  const items: TocItem[] = []
  const lines = markdown.split('\n')
  for (const line of lines) {
    const h2Match = line.match(/^##\s+(.+)/)
    if (h2Match) {
      const text = h2Match[1].trim()
      items.push({ id: slugger.slug(text), text, level: 2 })
      continue
    }
    const h1Match = line.match(/^#\s+(.+)/)
    if (h1Match) {
      const text = h1Match[1].trim()
      items.push({ id: slugger.slug(text), text, level: 1 })
    }
  }
  return items
}

interface TableOfContentsProps {
  content: string
  className?: string
}

export function TableOfContents({ content, className }: TableOfContentsProps) {
  const toc = useMemo(() => extractToc(content), [content])
  const [activeId, setActiveId] = useState<string>('')

  const handleClick = useCallback((id: string) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setActiveId(id)
    }
  }, [])

  useEffect(() => {
    if (toc.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
            break
          }
        }
      },
      { rootMargin: '-20% 0px -70% 0px' },
    )

    for (const item of toc) {
      const el = document.getElementById(item.id)
      if (el) observer.observe(el)
    }

    return () => observer.disconnect()
  }, [toc])

  if (toc.length === 0) return null

  return (
    <nav className={cn('text-xs', className)}>
      <div className="mb-2 font-medium text-muted-foreground">目录</div>
      <ul className="space-y-0.5">
        {toc.map((item) => (
          <li key={item.id}>
            <button
              onClick={() => handleClick(item.id)}
              className={cn(
                'block w-full truncate rounded px-1.5 py-0.5 text-left transition-colors hover:bg-muted',
                item.level === 2 && 'pl-5',
                activeId === item.id
                  ? 'bg-accent text-accent-foreground font-medium'
                  : 'text-muted-foreground',
              )}
              title={item.text}
            >
              {item.text}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}
