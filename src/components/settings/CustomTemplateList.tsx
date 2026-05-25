import { useState } from 'react'
import {
  Plus,
  Pencil,
  Trash2,
  FileText,
  Map,
  Code,
  PenTool,
  Rocket,
  Shield,
  Database,
  Palette,
  Zap,
  Globe,
  Layers,
  BookOpen,
  LayoutTemplate,
} from 'lucide-react'
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
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">自定义模板</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            创建和编辑自己的 Prompt 模板，不受内置 3 种模板限制
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={handleOpenNew}>
          <Plus className="h-3 w-3" />
          新建模板
        </Button>
      </div>

      {customTemplates.length === 0 ? (
        <div className="mt-6 flex flex-col items-center gap-3 rounded-xl border border-dashed py-10 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <LayoutTemplate className="h-5 w-5 text-muted-foreground/50" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">暂无自定义模板</p>
            <p className="text-xs text-muted-foreground/60">点击"新建模板"创建第一个</p>
          </div>
        </div>
      ) : (
        <div className="mt-4 space-y-2">
          {customTemplates.map((t) => {
            const Icon =
              ICON_OPTIONS.find((io) => io.value === t.icon)?.icon || FileText
            return (
              <div
                key={t.id}
                className="group flex items-center gap-3 rounded-xl border bg-card/60 px-4 py-3 shadow-xs transition-all hover:border-primary/20 hover:shadow-sm"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted/60">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{t.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {t.description || '无描述'}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => handleOpenEdit(t)}
                    className="h-7 w-7 rounded-lg"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => handleDelete(t.id)}
                    className="h-7 w-7 rounded-lg text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
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
              <Label className="text-xs font-medium">模板名称</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="例如：API 接口文档"
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">简短描述</Label>
              <Input
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                placeholder="描述此模板的用途"
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">图标</Label>
              <Select
                value={form.icon}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, icon: v || 'FileText' }))
                }
              >
                <SelectTrigger className="h-9 text-sm">
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
              <Label className="text-xs font-medium">系统提示词</Label>
              <Textarea
                value={form.systemPrompt}
                onChange={(e) =>
                  setForm((f) => ({ ...f, systemPrompt: e.target.value }))
                }
                placeholder="编写 Prompt 模板，使用 {{fileContent}} 作为思维导图内容占位符..."
                rows={8}
                className="resize-none font-mono text-xs"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
              取消
            </Button>
            <Button size="sm" onClick={handleSave}>
              {editing ? '保存' : '创建'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}