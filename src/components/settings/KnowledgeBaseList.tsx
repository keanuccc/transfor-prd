import { useState } from 'react'
import { Plus, Pencil, Trash2, BookOpen, ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useKnowledgeStore } from '@/stores/knowledgeStore'
import { cn } from '@/lib/utils'

export function KnowledgeBaseList() {
  const { docs, addDoc, updateDoc, deleteDoc } = useKnowledgeStore()
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [content, setContent] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const resetForm = () => {
    setShowForm(false)
    setEditId(null)
    setName('')
    setContent('')
  }

  const handleSave = () => {
    const trimmedName = name.trim()
    const trimmedContent = content.trim()
    if (!trimmedName || !trimmedContent) return
    if (editId) {
      updateDoc(editId, trimmedName, trimmedContent)
    } else {
      addDoc(trimmedName, trimmedContent)
    }
    resetForm()
  }

  const handleStartEdit = (id: string, docName: string, docContent: string) => {
    setEditId(id)
    setName(docName)
    setContent(docContent)
    setShowForm(true)
  }

  const handleCancel = () => {
    resetForm()
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <span className="block size-1.5 rounded-full bg-foreground/30" />
          知识库
        </h2>
        {!showForm && (
          <Button variant="outline" size="sm" className="text-xs" onClick={() => setShowForm(true)}>
            <Plus className="mr-1 h-3 w-3" />
            添加文档
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        上传项目背景文档、术语表、架构文档等，生成 PRD 时将自动作为上下文注入。
      </p>

      {showForm && (
        <div className="space-y-3 rounded-lg border bg-card/70 p-4">
          <Input
            placeholder="文档名称，如「项目架构说明」"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="text-sm"
          />
          <Textarea
            placeholder="粘贴文档内容..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={6}
            className="resize-none text-sm"
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={handleCancel}>取消</Button>
            <Button size="sm" onClick={handleSave} disabled={!name.trim() || !content.trim()}>
              {editId ? '保存修改' : '添加'}
            </Button>
          </div>
        </div>
      )}

      {docs.length > 0 && (
        <div className="space-y-1.5">
          {docs.map((doc) => (
            <div
              key={doc.id}
              className="rounded-lg border bg-card/70 p-3 shadow-xs transition-shadow hover:shadow-sm"
            >
              <div
                className="flex cursor-pointer items-center gap-2"
                onClick={() => setExpandedId(expandedId === doc.id ? null : doc.id)}
              >
                <BookOpen className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="flex-1 text-sm font-medium truncate">{doc.name}</span>
                <span className="text-[11px] text-muted-foreground">
                  {doc.content.length > 200 ? `${doc.content.slice(0, 200)}...` : doc.content}
                </span>
                <span className={cn(
                  'shrink-0 text-muted-foreground transition-transform',
                  expandedId === doc.id && 'rotate-90'
                )}>
                  {expandedId === doc.id ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                </span>
              </div>
              {expandedId === doc.id && (
                <div className="mt-2 space-y-2">
                  <pre className="whitespace-pre-wrap rounded bg-muted/50 p-2 text-xs text-muted-foreground max-h-32 overflow-auto">
                    {doc.content}
                  </pre>
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs"
                      onClick={() => handleStartEdit(doc.id, doc.name, doc.content)}
                    >
                      <Pencil className="mr-1 h-3 w-3" />
                      编辑
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-destructive hover:text-destructive"
                      onClick={() => deleteDoc(doc.id)}
                    >
                      <Trash2 className="mr-1 h-3 w-3" />
                      删除
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {docs.length === 0 && !showForm && (
        <p className="py-6 text-center text-xs text-muted-foreground">暂无知识库文档，点击上方按钮添加</p>
      )}
    </section>
  )
}
