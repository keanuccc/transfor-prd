import { useMemo } from 'react'
import { Copy, Download, Eye, Pencil, Sparkles, FileText, ChevronDown } from 'lucide-react'
import { marked } from 'marked'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'

interface EditorToolbarProps {
  content: string
  fileName?: string
  editMode: boolean
  isStreaming: boolean
  onToggleEditMode: () => void
  onRefine: () => void
}

marked.setOptions({ gfm: true, breaks: false })

const EXPORT_STYLES = `
  body {
    font-family: 'Microsoft YaHei', 'PingFang SC', -apple-system, sans-serif;
    line-height: 1.8;
    max-width: 820px;
    margin: 40px auto;
    padding: 0 24px;
    color: #1a1a1a;
  }
  h1 { font-size: 28px; font-weight: 700; border-bottom: 2px solid #e5e5e5; padding-bottom: 10px; margin-top: 32px; margin-bottom: 16px; }
  h2 { font-size: 22px; font-weight: 600; margin-top: 28px; margin-bottom: 12px; }
  h3 { font-size: 18px; font-weight: 600; margin-top: 24px; margin-bottom: 10px; }
  h4 { font-size: 16px; font-weight: 600; margin-top: 20px; margin-bottom: 8px; }
  p { margin: 10px 0; }
  ul, ol { padding-left: 24px; margin: 10px 0; }
  li { margin: 4px 0; }
  pre { background: #f6f8fa; border-radius: 6px; padding: 14px 18px; overflow-x: auto; font-size: 13px; line-height: 1.6; }
  code { background: #f6f8fa; padding: 2px 6px; border-radius: 3px; font-size: 13px; font-family: 'Cascadia Code', 'Fira Code', 'JetBrains Mono', monospace; }
  pre code { background: none; padding: 0; }
  table { border-collapse: collapse; width: 100%; margin: 14px 0; }
  th, td { border: 1px solid #d0d7de; padding: 10px 14px; text-align: left; }
  th { background: #f6f8fa; font-weight: 600; }
  tr:nth-child(even) td { background: #fafbfc; }
  blockquote { border-left: 3px solid #d0d7de; padding-left: 16px; margin: 14px 0; color: #57606a; }
  hr { border: none; border-top: 1px solid #e5e5e5; margin: 24px 0; }
  strong { font-weight: 600; }
  @media print {
    body { margin: 0; padding: 0 20px; }
    pre, blockquote, table { page-break-inside: avoid; }
  }
`

export function EditorToolbar({ content, fileName, editMode, isStreaming, onToggleEditMode, onRefine }: EditorToolbarProps) {
  const renderedHtml = useMemo(() => {
    if (!content) return ''
    try {
      return marked.parse(content) as string
    } catch {
      return `<pre>${content}</pre>`
    }
  }, [content])

  const handleCopy = async () => {
    if (!content) return
    try {
      await navigator.clipboard.writeText(content)
      toast.success('已复制到剪贴板')
    } catch {
      toast.error('复制失败')
    }
  }

  const handleDownloadMd = () => {
    if (!content) return
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName || '文档.md'
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Markdown 下载成功')
  }

  const handleExportWord = () => {
    if (!content) return
    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>${EXPORT_STYLES}</style>
</head>
<body>${renderedHtml}</body>
</html>`
    const blob = new Blob([htmlContent], { type: 'application/msword;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${fileName?.replace(/\.[^.]+$/, '') || '文档'}.doc`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Word 导出成功')
  }

  const handleExportPdf = () => {
    if (!content) return
    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>${EXPORT_STYLES}</style>
</head>
<body>${renderedHtml}</body>
</html>`
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      toast.error('弹窗被浏览器拦截，请允许弹窗后重试')
      return
    }
    printWindow.document.write(htmlContent)
    printWindow.document.close()
    printWindow.focus()
    printWindow.addEventListener('load', () => {
      printWindow.print()
    })
    setTimeout(() => printWindow.print(), 800)
  }

  const baseName = fileName?.replace(/\.[^.]+$/, '') || '文档'

  return (
    <div className="flex items-center gap-1 border-b px-3 py-1">
      <Button variant="ghost" size="xs" className="gap-1" onClick={onToggleEditMode} disabled={!content}>
        {editMode ? (
          <>
            <Eye className="h-3 w-3" />
            预览
          </>
        ) : (
          <>
            <Pencil className="h-3 w-3" />
            编辑
          </>
        )}
      </Button>
      <div className="flex-1" />
      <Button variant="ghost" size="xs" className="gap-1" onClick={onRefine} disabled={!content || isStreaming}>
        <Sparkles className="h-3 w-3" />
        AI 精修
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={(props) => (
            <Button {...props} variant="ghost" size="xs" className="gap-1" disabled={!content}>
              <Download className="h-3 w-3" />
              导出
              <ChevronDown className="h-2.5 w-2.5" />
            </Button>
          )}
        />
        <DropdownMenuContent align="end" className="min-w-[160px]">
          <DropdownMenuItem onClick={handleCopy} disabled={!content}>
            <Copy className="h-3.5 w-3.5" />
            复制 Markdown
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDownloadMd} disabled={!content}>
            <Download className="h-3.5 w-3.5" />
            下载 {baseName}.md
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleExportWord} disabled={!content}>
            <FileText className="h-3.5 w-3.5" />
            导出 Word (.doc)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleExportPdf} disabled={!content}>
            <FileText className="h-3.5 w-3.5" />
            导出 PDF
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
