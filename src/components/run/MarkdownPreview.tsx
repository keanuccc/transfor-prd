import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSlug from 'rehype-slug'
import { cn } from '@/lib/utils'
import { MermaidBlock } from '@/components/run/MermaidBlock'

interface MarkdownPreviewProps {
  content: string
  className?: string
}

export function MarkdownPreview({ content, className }: MarkdownPreviewProps) {
  return (
    <div className={cn('prose prose-sm prose-neutral max-w-none dark:prose-invert', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSlug]}
        components={{
          code({ className: codeClassName, children, ...props }) {
            const match = /language-(\w+)/.exec(codeClassName || '')
            if (match && match[1] === 'mermaid') {
              return <MermaidBlock code={String(children).replace(/\n$/, '')} />
            }
            // Default code rendering
            const isInline = !codeClassName && !match
            if (isInline) {
              return (
                <code className={codeClassName} {...props}>
                  {children}
                </code>
              )
            }
            return (
              <pre className={cn(codeClassName, 'overflow-x-auto')}>
                <code className={codeClassName} {...props}>
                  {children}
                </code>
              </pre>
            )
          },
        }}
      >
        {content || ' '}
      </ReactMarkdown>
    </div>
  )
}
