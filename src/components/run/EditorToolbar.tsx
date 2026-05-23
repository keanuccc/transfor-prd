import { useMemo } from 'react'
import { Copy, Download, Eye, Pencil, Sparkles, FileText, FileCode, Moon, ChevronDown, ClipboardCheck, BarChart3, Clock, GitFork } from 'lucide-react'
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
  onReview: () => void
  onScoreReview: () => void
  onEstimateTimeline: () => void
  onReverseToMindMap: () => void
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

const EXPORT_STYLES_DARK = `
  body {
    font-family: 'Microsoft YaHei', 'PingFang SC', -apple-system, sans-serif;
    line-height: 1.8;
    max-width: 820px;
    margin: 40px auto;
    padding: 0 24px;
    color: #e5e5e5;
    background: #1a1a2e;
  }
  h1 { font-size: 28px; font-weight: 700; border-bottom: 2px solid #333; padding-bottom: 10px; margin-top: 32px; margin-bottom: 16px; color: #f0f0f0; }
  h2 { font-size: 22px; font-weight: 600; margin-top: 28px; margin-bottom: 12px; color: #e0e0e0; }
  h3 { font-size: 18px; font-weight: 600; margin-top: 24px; margin-bottom: 10px; color: #d0d0d0; }
  h4 { font-size: 16px; font-weight: 600; margin-top: 20px; margin-bottom: 8px; color: #c8c8c8; }
  p { margin: 10px 0; }
  ul, ol { padding-left: 24px; margin: 10px 0; }
  li { margin: 4px 0; }
  pre { background: #16213e; border-radius: 6px; padding: 14px 18px; overflow-x: auto; font-size: 13px; line-height: 1.6; border: 1px solid #2a2a4a; }
  code { background: #16213e; padding: 2px 6px; border-radius: 3px; font-size: 13px; font-family: 'Cascadia Code', 'Fira Code', 'JetBrains Mono', monospace; color: #c9d1d9; }
  pre code { background: none; padding: 0; }
  table { border-collapse: collapse; width: 100%; margin: 14px 0; }
  th, td { border: 1px solid #333; padding: 10px 14px; text-align: left; }
  th { background: #16213e; font-weight: 600; color: #c9d1d9; }
  tr:nth-child(even) td { background: rgba(255,255,255,0.02); }
  blockquote { border-left: 3px solid #444; padding-left: 16px; margin: 14px 0; color: #8b949e; }
  hr { border: none; border-top: 1px solid #333; margin: 24px 0; }
  strong { font-weight: 600; color: #f0f0f0; }
  a { color: #58a6ff; }
  @media print {
    body { background: #fff; color: #000; margin: 0; padding: 0 20px; }
    pre, blockquote, table { page-break-inside: avoid; }
  }
`

function convertToLatex(md: string): string {
  let result = md
    // Escapes
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/&/g, '\\&')
    .replace(/%/g, '\\%')
    .replace(/\$/g, '\\$')
    .replace(/#/g, '\\#')
    .replace(/_/g, '\\_')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}')
    .replace(/~/g, '\\textasciitilde{}')
    .replace(/\^/g, '\\textasciicircum{}')

  // Headings
  result = result.replace(/^#### (.+)$/gm, '\\paragraph{$1}')
  result = result.replace(/^### (.+)$/gm, '\\subsubsection{$1}')
  result = result.replace(/^## (.+)$/gm, '\\subsection{$1}')
  result = result.replace(/^# (.+)$/gm, '\\section{$1}')

  // Bold and italic
  result = result.replace(/\*\*\*(.+?)\*\*\*/g, '\\textbf{\\textit{$1}}')
  result = result.replace(/\*\*(.+?)\*\*/g, '\\textbf{$1}')
  result = result.replace(/\*(.+?)\*/g, '\\textit{$1}')

  // Inline code
  result = result.replace(/`([^`]+)`/g, '\\texttt{$1}')

  // Code blocks
  result = result.replace(/```[\s\S]*?```/g, (match) => {
    const code = match.replace(/```\w*\n?/, '').replace(/```$/, '').trim()
    return `\\begin{verbatim}\n${code}\n\\end{verbatim}`
  })

  // Links
  result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '\\href{$2}{$1}')

  // Horizontal rules
  result = result.replace(/^---$/gm, '\\hrulefill')

  // Blockquotes (simple)
  result = result.replace(/^> (.+)$/gm, '\\begin{quote}$1\\end{quote}')

  // Unordered lists - collect consecutive items
  result = result.replace(/((?:^- .+\n?)+)/gm, (match) => {
    const items = match.trim().split('\n').map(line => `  \\item ${line.replace(/^- /, '')}`).join('\n')
    return `\\begin{itemize}\n${items}\n\\end{itemize}\n`
  })

  // Ordered lists
  result = result.replace(/((?:^\d+\. .+\n?)+)/gm, (match) => {
    const items = match.trim().split('\n').map(line => `  \\item ${line.replace(/^\d+\. /, '')}`).join('\n')
    return `\\begin{enumerate}\n${items}\n\\end{enumerate}\n`
  })

  return result
}

export function EditorToolbar({ content, fileName, editMode, isStreaming, onToggleEditMode, onRefine, onReview, onScoreReview, onEstimateTimeline, onReverseToMindMap }: EditorToolbarProps) {
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

  const handleExportHtml = () => {
    if (!content) return
    const htmlContent = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${baseName}</title>
  <style>${EXPORT_STYLES}</style>
</head>
<body>${renderedHtml}</body>
</html>`
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${baseName}.html`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('HTML 导出成功')
  }

  const handleExportLatex = () => {
    if (!content) return
    const latex = convertToLatex(content)
    const latexDoc = `\\documentclass[12pt,a4paper]{article}
\\usepackage[UTF8]{ctex}
\\usepackage{hyperref}
\\usepackage{geometry}
\\geometry{margin=2.5cm}
\\usepackage{enumitem}
\\usepackage{listings}
\\usepackage{tabularx}
\\usepackage{booktabs}

\\title{${baseName}}
\\author{Generated by transfor-prd}
\\date{\\today}

\\begin{document}
\\maketitle
\\tableofcontents
\\newpage

${latex}

\\end{document}`
    const blob = new Blob([latexDoc], { type: 'application/x-latex;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${baseName}.tex`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('LaTeX 导出成功')
  }

  const handleExportHtmlDark = () => {
    if (!content) return
    const htmlContent = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${baseName}</title>
  <style>${EXPORT_STYLES_DARK}</style>
</head>
<body>${renderedHtml}</body>
</html>`
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${baseName}-暗色.html`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('暗色 HTML 导出成功')
  }

  const handleExportPdfDark = () => {
    if (!content) return
    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>${EXPORT_STYLES_DARK}</style>
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
      <Button variant="ghost" size="xs" className="gap-1" onClick={onReview} disabled={!content || isStreaming}>
        <ClipboardCheck className="h-3 w-3" />
        AI 审阅
      </Button>
      <Button variant="ghost" size="xs" className="gap-1" onClick={onScoreReview} disabled={!content || isStreaming}>
        <BarChart3 className="h-3 w-3" />
        评审打分
      </Button>
      <Button variant="ghost" size="xs" className="gap-1" onClick={onEstimateTimeline} disabled={!content || isStreaming}>
        <Clock className="h-3 w-3" />
        时间轴预估
      </Button>
      <Button variant="ghost" size="xs" className="gap-1" onClick={onReverseToMindMap} disabled={!content || isStreaming}>
        <GitFork className="h-3 w-3" />
        反向生成思维导图
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
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleExportHtml} disabled={!content}>
            <FileCode className="h-3.5 w-3.5" />
            导出 HTML (.html)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleExportLatex} disabled={!content}>
            <FileCode className="h-3.5 w-3.5" />
            导出 LaTeX (.tex)
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleExportHtmlDark} disabled={!content}>
            <Moon className="h-3.5 w-3.5" />
            导出暗色 HTML
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleExportPdfDark} disabled={!content}>
            <Moon className="h-3.5 w-3.5" />
            导出暗色 PDF
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
