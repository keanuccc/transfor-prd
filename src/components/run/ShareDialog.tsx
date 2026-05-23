import { useState } from 'react'
import { Copy, Loader2, Link2 } from 'lucide-react'
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
import { encryptForShare, generateShareUrl } from '@/lib/shareUtils'
import { toast } from 'sonner'

interface ShareDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  content: string
}

export function ShareDialog({ open, onOpenChange, content }: ShareDialogProps) {
  const [password, setPassword] = useState('')
  const [shareUrl, setShareUrl] = useState('')
  const [loading, setLoading] = useState(false)

  const handleGenerate = async () => {
    if (!password.trim() || !content) return
    setLoading(true)
    try {
      const encoded = await encryptForShare(content, password.trim())
      const url = generateShareUrl(encoded)
      setShareUrl(url)
    } catch {
      toast.error('加密失败')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(shareUrl)
      toast.success('分享链接已复制到剪贴板')
    } catch {
      toast.error('复制失败')
    }
  }

  const handleClose = () => {
    setPassword('')
    setShareUrl('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>生成分享链接</DialogTitle>
          <DialogDescription>
            设置密码后生成加密分享链接，接收者需要输入密码才能查看文档内容。
          </DialogDescription>
        </DialogHeader>

        {!shareUrl ? (
          <div className="space-y-3">
            <Input
              type="password"
              placeholder="设置访问密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            />
            <Button
              className="w-full"
              onClick={handleGenerate}
              disabled={!password.trim() || loading}
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Link2 className="mr-2 h-4 w-4" />}
              生成链接
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <Input value={shareUrl} readOnly className="text-xs" />
            <p className="text-xs text-muted-foreground">
              链接已加密，接收者需要输入密码 <strong>{password}</strong> 才能查看。
            </p>
          </div>
        )}

        <DialogFooter>
          {shareUrl ? (
            <>
              <Button variant="outline" onClick={handleClose}>关闭</Button>
              <Button onClick={handleCopy}>
                <Copy className="mr-2 h-4 w-4" />
                复制链接
              </Button>
            </>
          ) : (
            <Button variant="outline" onClick={handleClose}>取消</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
