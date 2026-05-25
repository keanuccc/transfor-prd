import { useEffect, useRef, useState } from "react"

interface MermaidBlockProps {
  code: string
}

let mermaidPromise: Promise<{ default: { run: (opts: { nodes: HTMLElement[] }) => Promise<void> } }> | null = null

function loadMermaid() {
  if (!mermaidPromise) {
    mermaidPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script")
      script.src = "https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js"
      script.onload = () => {
        const m = (window as unknown as Record<string, unknown>).mermaid as {
          initialize?: (config: Record<string, unknown>) => void
          run: (opts: { nodes: HTMLElement[] }) => Promise<void>
        }
        if (m?.initialize) {
          m.initialize({ startOnLoad: false, theme: "default" })
        }
        resolve({ default: { run: m?.run || (async () => {}) } })
      }
      script.onerror = () => reject(new Error("Failed to load Mermaid"))
      document.head.appendChild(script)
    })
  }
  return mermaidPromise
}

export function MermaidBlock({ code }: MermaidBlockProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [rendered, setRendered] = useState(false)

  useEffect(() => {
    let cancelled = false
    setRendered(false)
    setError(null)

    // Create a detached inner div for Mermaid to render into,
    // so we never touch React-managed DOM nodes.
    const inner = document.createElement("div")
    inner.className = "flex justify-center overflow-x-auto"
    inner.innerHTML = code

    loadMermaid()
      .then(async (mermaid) => {
        if (cancelled) return
        try {
          const id = "mermaid-" + Math.random().toString(36).slice(2, 9)
          const firstChild = inner.firstElementChild as HTMLElement | null
          if (firstChild) firstChild.id = id
          await mermaid.default.run({ nodes: [inner] })
          if (cancelled) return
          // Swap: replace the old inner div inside the React container
          if (containerRef.current) {
            if (innerRef.current) {
              containerRef.current.replaceChild(inner, innerRef.current)
            } else {
              containerRef.current.appendChild(inner)
            }
            innerRef.current = inner
          }
          setRendered(true)
        } catch (e) {
          if (!cancelled) {
            setError(e instanceof Error ? e.message : "Mermaid render error")
          }
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load Mermaid")
      })

    return () => {
      cancelled = true
      // Clean up the detached inner div if never attached
      if (inner.parentNode) {
        inner.parentNode.removeChild(inner)
      }
    }
  }, [code])

  if (error) {
    return (
      <pre className="text-xs text-red-500 dark:text-red-400 p-3 bg-muted rounded">
        Mermaid render error: {error}
        {"\n\n"}{code}
      </pre>
    )
  }

  return (
    <div
      ref={containerRef}
      className={"my-3 flex justify-center overflow-x-auto" + (rendered ? "" : "")}
    >
      {!rendered && (
        <pre className="w-full p-3 bg-muted rounded text-xs">{code}</pre>
      )}
    </div>
  )
}