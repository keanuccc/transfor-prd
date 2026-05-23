import { useState } from 'react'
import { ExternalLink, Loader2, Copy, CheckCircle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { pushToPlatform, getPlatformContent, type PlatformType, type PlatformConfig } from '@/services/platforms'

interface SyncDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  content: string
  title: string
}

export function SyncDialog({ open, onOpenChange, content, title }: SyncDialogProps) {
  const [platform, setPlatform] = useState<PlatformType>('notion')
  const [token, setToken] = useState('')
  const [notionParentId, setNotionParentId] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ url?: string; copied?: boolean } | null>(null)

  const handlePush = async () => {
    if (!token.trim() || !content) return
    setLoading(true)
    setResult(null)
    const config: PlatformConfig = {
      type: platform,
      token: token.trim(),
      notionParentId: notionParentId.trim() || undefined,
    }
    try {
      const { url } = await pushToPlatform(title || 'PRD 文档', content, config)
      setResult({ url })
      toast.success('推送成功')
    } catch (err) {
      // If API fails (likely CORS in browser), fall back to clipboard
      toast.error(err instanceof Error ? err.message : '推送失败，已复制内容到剪贴板作为备用')
      const platformContent = getPlatformContent(title || 'PRD 文档', content, platform)
      try {
        await navigator.clipboard.writeText(platformContent)
        setResult({ copied: true })
      } catch {
        // clipboard failed too
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    const platformContent = getPlatformContent(title || 'PRD 文档', content, platform)
    try {
      await navigator.clipboard.writeText(platformContent)
      setResult({ copied: true })
      toast.success('已复制到剪贴板')
    } catch {
      toast.error('复制失败')
    }
  }

  const handleClose = () => {
    setToken('')
    setNotionParentId('')
    setResult(null)
    setLoading(false)
    onOpenChange(false)
  }

  const platformLabels: Record<PlatformType, string> = {
    notion: 'Notion',
    feishu: '飞书文档',
    yuque: '语雀',
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>同步到文档平台</DialogTitle>
          <DialogDescription>
            将 PRD 内容推送到外部文档平台（需要 API Token）
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">目标平台</Label>
            <Select value={platform} onValueChange={(v) => setPlatform(v as PlatformType)}>
              <SelectTrigger className="text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="notion">Notion</SelectItem>
                <SelectItem value="feishu">飞书文档</SelectItem>
                <SelectItem value="yuque">语雀</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">
              {platform === 'feishu' ? '飞书 Tenant Access Token' :
               platform === 'yuque' ? '语雀 Access Token' :
               'Notion Internal Integration Token'}
            </Label>
            <Input
              type="password"
              placeholder="输入 API Token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
          </div>

          {platform === 'notion' && (
            <div className="space-y-1.5">
              <Label className="text-xs">父页面 ID（可选，留空则创建为独立页面）</Label>
              <Input
                placeholder="Notion 页面 ID"
                value={notionParentId}
                onChange={(e) => setNotionParentId(e.target.value)}
              />
            </div>
          )}

          {result?.url && (
            <div className="flex items-center gap-2 rounded-lg bg-green-50 dark:bg-green-950/20 p-2.5 text-sm">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <a href={result.url} target="_blank" rel="noreferrer" className="text-primary underline">
                打开文档 <ExternalLink className="inline h-3 w-3" />
              </a>
            </div>
          )}

          {result?.copied && (
            <div className="flex items-center gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/20 p-2.5 text-sm">
              <CheckCircle className="h-4 w-4 text-amber-600" />
              <span className="text-foreground/80">
                API 直推失败，已复制格式化内容到剪贴板，请粘贴到 {platformLabels[platform]}
              </span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>取消</Button>
          <Button variant="outline" onClick={handleCopy} disabled={!content}>
            <Copy className="mr-2 h-3.5 w-3.5" />
            复制内容
          </Button>
          <Button onClick={handlePush} disabled={!token.trim() || loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ExternalLink className="mr-2 h-4 w-4" />}
            推送
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
