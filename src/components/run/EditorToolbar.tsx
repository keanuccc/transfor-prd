import { Copy, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface EditorToolbarProps {
  content: string
  fileName?: string
}

export function EditorToolbar({ content, fileName }: EditorToolbarProps) {
  const handleCopy = async () => {
    if (!content) return
    try {
      await navigator.clipboard.writeText(content)
      toast.success('已复制到剪贴板')
    } catch {
      toast.error('复制失败')
    }
  }

  const handleDownload = () => {
    if (!content) return
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName || '产品功能描述.md'
    a.click()
    URL.revokeObjectURL(url)
    toast.success('下载成功')
  }

  return (
    <div className="flex items-center gap-1 border-b px-3 py-1">
      <Button variant="ghost" size="xs" className="gap-1" onClick={handleCopy} disabled={!content}>
        <Copy className="h-3 w-3" />
        复制
      </Button>
      <Button variant="ghost" size="xs" className="gap-1" onClick={handleDownload} disabled={!content}>
        <Download className="h-3 w-3" />
        下载
      </Button>
    </div>
  )
}
