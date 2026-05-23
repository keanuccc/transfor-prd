import { Copy, Download, Eye, Pencil, Sparkles, FileText, ChevronDown } from 'lucide-react'
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

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function EditorToolbar({ content, fileName, editMode, isStreaming, onToggleEditMode, onRefine }: EditorToolbarProps) {
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
  <style>
    body { font-family: 'Microsoft YaHei', sans-serif; line-height: 1.8; max-width: 800px; margin: 40px auto; padding: 0 20px; }
    h1 { font-size: 24px; border-bottom: 1px solid #eee; padding-bottom: 8px; }
    h2 { font-size: 20px; }
    h3 { font-size: 16px; }
    pre { background: #f5f5f5; padding: 12px; border-radius: 4px; overflow-x: auto; }
    code { background: #f5f5f5; padding: 2px 4px; border-radius: 2px; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background: #f5f5f5; }
  </style>
</head>
<body>
<pre style="white-space: pre-wrap; font-family: inherit; background: none; padding: 0;">${escapeHtml(content)}</pre>
</body>
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
  <style>
    body { font-family: 'Microsoft YaHei', sans-serif; line-height: 1.8; max-width: 800px; margin: 40px auto; padding: 0 20px; color: #333; }
    h1 { font-size: 24px; border-bottom: 1px solid #eee; padding-bottom: 8px; }
    h2 { font-size: 20px; }
    h3 { font-size: 16px; }
    pre { background: #f5f5f5; padding: 12px; border-radius: 4px; overflow-x: auto; font-size: 13px; }
    code { background: #f5f5f5; padding: 2px 4px; border-radius: 2px; font-size: 13px; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background: #f5f5f5; }
    @media print { body { margin: 0; padding: 0 20px; } }
  </style>
</head>
<body>
<pre style="white-space: pre-wrap; font-family: inherit; background: none; padding: 0;">${escapeHtml(content)}</pre>
</body>
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
    // Fallback if load event doesn't fire
    setTimeout(() => printWindow.print(), 500)
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
          render={
            <Button variant="ghost" size="xs" className="gap-1" disabled={!content}>
              <Download className="h-3 w-3" />
              导出
              <ChevronDown className="h-2.5 w-2.5" />
            </Button>
          }
        />
        <DropdownMenuContent align="end" className="min-w-[160px]">
          <DropdownMenuItem onSelect={handleCopy}>
            <Copy className="h-3.5 w-3.5" />
            复制 Markdown
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={handleDownloadMd}>
            <Download className="h-3.5 w-3.5" />
            下载 {baseName}.md
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={handleExportWord}>
            <FileText className="h-3.5 w-3.5" />
            导出 Word (.doc)
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={handleExportPdf}>
            <FileText className="h-3.5 w-3.5" />
            导出 PDF
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
