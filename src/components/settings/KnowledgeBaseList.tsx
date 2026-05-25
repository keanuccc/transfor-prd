import { useState } from 'react'
import {
  Plus,
  Pencil,
  Trash2,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Library,
} from 'lucide-react'
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
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">知识库</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            上传项目背景文档、术语表、架构文档等，生成 PRD 时将自动作为上下文注入。
          </p>
        </div>
        {!showForm && (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => setShowForm(true)}
          >
            <Plus className="h-3 w-3" />
            添加文档
          </Button>
        )}
      </div>

      {showForm && (
        <div className="mt-4 space-y-3 rounded-xl border bg-card/60 p-5 shadow-xs">
          <Input
            placeholder="文档名称，如「项目架构说明」"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-9 text-sm"
          />
          <Textarea
            placeholder="粘贴文档内容..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={6}
            className="resize-none text-sm"
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={handleCancel}>
              取消
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!name.trim() || !content.trim()}
            >
              {editId ? '保存修改' : '添加'}
            </Button>
          </div>
        </div>
      )}

      {docs.length > 0 && (
        <div className="mt-4 space-y-1.5">
          {docs.map((doc) => (
            <div
              key={doc.id}
              className={cn(
                'rounded-xl border bg-card/60 shadow-xs transition-all hover:border-primary/20 hover:shadow-sm',
                expandedId === doc.id && 'border-primary/20 shadow-sm'
              )}
            >
              <button
                className="flex w-full items-center gap-3 px-4 py-3 text-left"
                onClick={() =>
                  setExpandedId(expandedId === doc.id ? null : doc.id)
                }
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted/60">
                  <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{doc.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {doc.content.length > 80
                      ? `${doc.content.slice(0, 80)}...`
                      : doc.content}
                  </p>
                </div>
                <span
                  className={cn(
                    'shrink-0 text-muted-foreground transition-transform duration-200',
                    expandedId === doc.id && 'rotate-90'
                  )}
                >
                  {expandedId === doc.id ? (
                    <ChevronDown className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5" />
                  )}
                </span>
              </button>
              {expandedId === doc.id && (
                <div className="border-t px-4 py-3">
                  <pre className="max-h-40 overflow-auto whitespace-pre-wrap rounded-lg bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground">
                    {doc.content}
                  </pre>
                  <div className="mt-3 flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1 text-xs"
                      onClick={() =>
                        handleStartEdit(doc.id, doc.name, doc.content)
                      }
                    >
                      <Pencil className="h-3 w-3" />
                      编辑
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1 text-xs text-destructive hover:text-destructive"
                      onClick={() => deleteDoc(doc.id)}
                    >
                      <Trash2 className="h-3 w-3" />
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
        <div className="mt-6 flex flex-col items-center gap-3 rounded-xl border border-dashed py-10 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <Library className="h-5 w-5 text-muted-foreground/50" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">暂无知识库文档</p>
            <p className="text-xs text-muted-foreground/60">点击上方按钮添加文档</p>
          </div>
        </div>
      )}
    </div>
  )
}