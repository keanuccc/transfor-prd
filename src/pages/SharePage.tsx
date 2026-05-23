import { useState } from 'react'
import { Lock, Eye, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { MarkdownPreview } from '@/components/run/MarkdownPreview'
import { decryptFromShare } from '@/lib/shareUtils'

export function SharePage() {
  const [password, setPassword] = useState('')
  const [decrypted, setDecrypted] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const hash = window.location.hash.slice(1)

  const handleDecrypt = async () => {
    if (!password || !hash) return
    setLoading(true)
    setError('')
    try {
      const content = await decryptFromShare(hash, password)
      setDecrypted(content)
    } catch {
      setError('密码错误或链接已失效')
    } finally {
      setLoading(false)
    }
  }

  if (!hash) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <Lock className="mx-auto h-12 w-12 text-muted-foreground" />
          <h2 className="mt-4 text-lg font-medium">无效的分享链接</h2>
          <p className="mt-2 text-sm text-muted-foreground">链接格式不正确，请检查链接是否完整。</p>
        </div>
      </div>
    )
  }

  if (decrypted) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-2 border-b border-border/30 px-4 py-2 bg-muted/20">
          <Eye className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">分享文档（只读）</span>
        </div>
        <div className="flex-1 overflow-auto px-10 py-8">
          <MarkdownPreview content={decrypted} />
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full items-center justify-center">
      <div className="w-full max-w-sm space-y-4 rounded-xl border bg-card p-6 shadow-sm">
        <div className="text-center">
          <Lock className="mx-auto h-8 w-8 text-muted-foreground" />
          <h2 className="mt-2 text-lg font-medium">加密文档</h2>
          <p className="mt-1 text-sm text-muted-foreground">请输入密码查看分享的 PRD 文档</p>
        </div>
        <Input
          type="password"
          placeholder="输入访问密码"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleDecrypt()}
        />
        {error && <p className="text-xs text-destructive">{error}</p>}
        <Button className="w-full" onClick={handleDecrypt} disabled={!password || loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          解锁查看
        </Button>
      </div>
    </div>
  )
}
