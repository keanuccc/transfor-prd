import { useEffect, useRef, useState } from 'react'

interface MermaidBlockProps {
  code: string
}

let mermaidPromise: Promise<{ default: { run: (opts: { nodes: HTMLElement[] }) => Promise<void> } }> | null = null

function loadMermaid() {
  if (!mermaidPromise) {
    mermaidPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js'
      script.onload = () => {
        const m = (window as unknown as Record<string, unknown>).mermaid as {
          initialize?: (config: Record<string, unknown>) => void
          run: (opts: { nodes: HTMLElement[] }) => Promise<void>
        }
        if (m?.initialize) {
          m.initialize({ startOnLoad: false, theme: 'default' })
        }
        resolve({ default: { run: m?.run || (async () => {}) } })
      }
      script.onerror = () => reject(new Error('Failed to load Mermaid'))
      document.head.appendChild(script)
    })
  }
  return mermaidPromise
}

export function MermaidBlock({ code }: MermaidBlockProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [rendered, setRendered] = useState(false)

  useEffect(() => {
    let cancelled = false
    setRendered(false)
    setError(null)

    loadMermaid()
      .then(async (mermaid) => {
        if (cancelled || !containerRef.current) return
        try {
          const id = `mermaid-${Math.random().toString(36).slice(2, 9)}`
          containerRef.current.innerHTML = code
          const el = containerRef.current.firstElementChild as HTMLElement
          if (el) el.id = id
          await mermaid.default.run({ nodes: [containerRef.current] })
          if (!cancelled) setRendered(true)
        } catch (e) {
          if (!cancelled) {
            setError(e instanceof Error ? e.message : 'Mermaid render error')
          }
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load Mermaid')
      })

    return () => { cancelled = true }
  }, [code])

  if (error) {
    return (
      <pre className="text-xs text-red-500 dark:text-red-400 p-3 bg-muted rounded">
        Mermaid render error: {error}
        {'\n\n'}{code}
      </pre>
    )
  }

  return (
    <div
      ref={containerRef}
      className={`my-3 flex justify-center overflow-x-auto ${rendered ? '' : 'text-xs text-muted-foreground'}`}
    >
      {!rendered && (
        <pre className="w-full p-3 bg-muted rounded text-xs">{code}</pre>
      )}
    </div>
  )
}
