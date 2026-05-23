import { useState } from 'react'
import { Plus, Pencil, Trash2, FileText, Map, Code, PenTool, Rocket, Shield, Database, Palette, Zap, Globe, Layers, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useTemplateStore, type CustomTemplate } from '@/stores/templateStore'
import { toast } from 'sonner'
import type { LucideIcon } from 'lucide-react'

const ICON_OPTIONS: { value: string; icon: LucideIcon; label: string }[] = [
  { value: 'FileText', icon: FileText, label: '文档' },
  { value: 'Map', icon: Map, label: '地图' },
  { value: 'Code', icon: Code, label: '代码' },
  { value: 'PenTool', icon: PenTool, label: '设计' },
  { value: 'Rocket', icon: Rocket, label: '火箭' },
  { value: 'Shield', icon: Shield, label: '盾牌' },
  { value: 'Database', icon: Database, label: '数据库' },
  { value: 'Palette', icon: Palette, label: '调色板' },
  { value: 'Zap', icon: Zap, label: '闪电' },
  { value: 'Globe', icon: Globe, label: '全球' },
  { value: 'Layers', icon: Layers, label: '图层' },
  { value: 'BookOpen', icon: BookOpen, label: '书本' },
]

function emptyTemplate(): CustomTemplate {
  return {
    id: crypto.randomUUID(),
    name: '',
    description: '',
    icon: 'FileText',
    systemPrompt: '',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
}

export function CustomTemplateList() {
  const { customTemplates, addTemplate, updateTemplate, deleteTemplate } = useTemplateStore()
  const [editing, setEditing] = useState<CustomTemplate | null>(null)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<CustomTemplate>(emptyTemplate())

  const handleOpenNew = () => {
    setForm(emptyTemplate())
    setEditing(null)
    setOpen(true)
  }

  const handleOpenEdit = (t: CustomTemplate) => {
    setForm({ ...t })
    setEditing(t)
    setOpen(true)
  }

  const handleSave = () => {
    if (!form.name.trim()) {
      toast.error('请输入模板名称')
      return
    }
    if (!form.systemPrompt.trim()) {
      toast.error('请输入系统提示词')
      return
    }
    if (editing) {
      updateTemplate(editing.id, { ...form, updatedAt: Date.now() })
      toast.success('模板已更新')
    } else {
      addTemplate({ ...form, createdAt: Date.now(), updatedAt: Date.now() })
      toast.success('模板已创建')
    }
    setOpen(false)
  }

  const handleDelete = (id: string) => {
    deleteTemplate(id)
    toast.success('模板已删除')
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold">自定义模板</h2>
          <p className="text-xs text-muted-foreground">创建和编辑自己的 Prompt 模板，不受内置 3 种模板限制</p>
        </div>
        <Button variant="outline" size="xs" className="gap-1" onClick={handleOpenNew}>
          <Plus className="h-3 w-3" />
          新建模板
        </Button>
      </div>

      {customTemplates.length === 0 ? (
        <p className="py-4 text-center text-xs text-muted-foreground">暂无自定义模板，点击"新建模板"创建</p>
      ) : (
        <div className="space-y-2">
          {customTemplates.map((t) => {
            const Icon = ICON_OPTIONS.find((io) => io.value === t.icon)?.icon || FileText
            return (
              <div
                key={t.id}
                className="flex items-center gap-3 rounded-lg border px-3 py-2.5"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted">
                  <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium truncate">{t.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{t.description || '无描述'}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => handleOpenEdit(t)}
                >
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => handleDelete(t.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            )
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? '编辑模板' : '新建模板'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">模板名称</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="例如：API 接口文档"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">简短描述</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="描述此模板的用途"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">图标</Label>
              <Select
                value={form.icon}
                onValueChange={(v) => setForm((f) => ({ ...f, icon: v || 'FileText' }))}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ICON_OPTIONS.map((io) => (
                    <SelectItem key={io.value} value={io.value}>
                      <div className="flex items-center gap-2">
                        <io.icon className="h-3.5 w-3.5" />
                        <span>{io.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">系统提示词</Label>
              <Textarea
                value={form.systemPrompt}
                onChange={(e) => setForm((f) => ({ ...f, systemPrompt: e.target.value }))}
                placeholder="编写 Prompt 模板，使用 {{fileContent}} 作为思维导图内容占位符..."
                rows={8}
                className="resize-none font-mono text-xs"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="xs" onClick={() => setOpen(false)}>取消</Button>
            <Button size="xs" onClick={handleSave}>{editing ? '保存' : '创建'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
