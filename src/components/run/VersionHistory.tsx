import { useState } from 'react'
import { History, X, RotateCcw, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSnapshotStore } from '@/stores/snapshotStore'

interface VersionHistoryProps {
  conversationId: string
  currentContent: string
  onRestore: (content: string) => void
  onClose: () => void
}

function formatTime(ts: number): string {
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function VersionHistory({ conversationId, currentContent, onRestore, onClose }: VersionHistoryProps) {
  const { snapshots, createSnapshot, deleteSnapshot, restoreSnapshot } = useSnapshotStore()
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    if (!currentContent) return
    await createSnapshot(conversationId, currentContent, `保存于 ${formatTime(Date.now())}`)
  }

  const handleRestore = async (id: string) => {
    setLoading(true)
    const snapshot = await restoreSnapshot(id)
    if (snapshot) {
      onRestore(snapshot.content)
    }
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    await deleteSnapshot(id)
  }

  return (
    <div className="flex h-full w-56 shrink-0 flex-col border-l border-border/40 bg-muted/10">
      <div className="flex items-center justify-between border-b border-border/30 px-3 py-2">
        <div className="flex items-center gap-1.5">
          <History className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-medium">版本历史</span>
        </div>
        <Button variant="ghost" size="icon-xs" onClick={onClose}>
          <X className="h-3 w-3" />
        </Button>
      </div>
      <div className="px-2 py-1.5">
        <Button
          variant="outline"
          size="sm"
          className="w-full text-xs"
          onClick={handleSave}
          disabled={!currentContent}
        >
          保存当前版本
        </Button>
      </div>
      <div className="flex-1 overflow-auto px-2">
        {snapshots.length === 0 ? (
          <p className="py-8 text-center text-xs text-muted-foreground">暂无历史版本</p>
        ) : (
          <div className="space-y-1">
            {snapshots.map((sn) => (
              <div
                key={sn.id}
                className="group rounded-lg border border-border/30 bg-background/50 p-2"
              >
                <p className="text-[11px] leading-tight text-foreground/70">{sn.label}</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">{formatTime(sn.createdAt)}</p>
                <div className="mt-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="h-5 w-5"
                    onClick={() => handleRestore(sn.id)}
                    disabled={loading}
                    title="恢复此版本"
                  >
                    <RotateCcw className="h-2.5 w-2.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="h-5 w-5 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(sn.id)}
                    title="删除"
                  >
                    <Trash2 className="h-2.5 w-2.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
