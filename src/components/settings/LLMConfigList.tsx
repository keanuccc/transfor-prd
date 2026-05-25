import { useState } from 'react'
import {
  Plus,
  Pencil,
  Trash2,
  Star,
  ChevronUp,
  ChevronDown,
  Cpu,
  CheckCircle2,
  XCircle,
  GripVertical,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LLMConfigForm } from './LLMConfigForm'
import { useLLMStore } from '@/stores/llmStore'
import type { LLMConfig } from '@/types'

export function LLMConfigList() {
  const { configs, addConfig, updateConfig, deleteConfig, setDefault } = useLLMStore()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<LLMConfig | null>(null)

  const sorted = [...configs].sort((a, b) => a.displayOrder - b.displayOrder)

  const handleSave = (config: LLMConfig) => {
    if (editing) {
      updateConfig(config.id, config)
    } else {
      addConfig(config)
    }
    setEditing(null)
  }

  const handleEdit = (config: LLMConfig) => {
    setEditing(config)
    setFormOpen(true)
  }

  const handleAdd = () => {
    setEditing(null)
    setFormOpen(true)
  }

  const moveUp = (index: number) => {
    if (index <= 0) return
    const ids = sorted.map((c) => c.id)
    ;[ids[index - 1], ids[index]] = [ids[index], ids[index - 1]]
    useLLMStore.getState().reorderConfigs(ids)
  }

  const moveDown = (index: number) => {
    if (index >= sorted.length - 1) return
    const ids = sorted.map((c) => c.id)
    ;[ids[index], ids[index + 1]] = [ids[index + 1], ids[index]]
    useLLMStore.getState().reorderConfigs(ids)
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">大模型配置</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            管理多个 LLM 连接，支持排序与连通性测试
          </p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={handleAdd}>
          <Plus className="h-3.5 w-3.5" />
          添加模型
        </Button>
      </div>

      {sorted.length === 0 && (
        <div className="mt-6 flex flex-col items-center gap-3 rounded-xl border border-dashed py-10 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <Cpu className="h-5 w-5 text-muted-foreground/50" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">尚未配置模型</p>
            <p className="text-xs text-muted-foreground/60">点击上方按钮添加第一个模型连接</p>
          </div>
        </div>
      )}

      <div className="mt-4 space-y-2">
        {sorted.map((config, index) => (
          <div
            key={config.id}
            className="group flex items-center gap-3 rounded-xl border bg-card/60 px-4 py-3 shadow-xs transition-all hover:border-primary/20 hover:shadow-sm"
          >
            <div className="flex shrink-0 flex-col gap-0.5">
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => moveUp(index)}
                disabled={index === 0}
                className="h-5 w-5 rounded"
              >
                <ChevronUp className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => moveDown(index)}
                disabled={index === sorted.length - 1}
                className="h-5 w-5 rounded"
              >
                <ChevronDown className="h-3 w-3" />
              </Button>
            </div>

            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted/60">
              <Cpu className="h-4 w-4 text-muted-foreground" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-medium">{config.modelName}</p>
                {config.isDefault && (
                  <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                    默认
                  </span>
                )}
              </div>
              <div className="mt-0.5 flex items-center gap-2">
                <p className="truncate text-xs text-muted-foreground">{config.baseUrl}</p>
                {config.lastPingSuccess !== undefined && (
                  <span className="shrink-0">
                    {config.lastPingSuccess ? (
                      <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                    ) : (
                      <XCircle className="h-3 w-3 text-destructive/60" />
                    )}
                  </span>
                )}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => setDefault(config.id)}
                disabled={config.isDefault}
                className="h-7 w-7 rounded-lg"
              >
                <Star
                  className={`h-3.5 w-3.5 ${config.isDefault ? 'fill-amber-400 text-amber-400' : ''}`}
                />
              </Button>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => handleEdit(config)}
                className="h-7 w-7 rounded-lg"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon-xs"
                className="h-7 w-7 rounded-lg text-destructive hover:text-destructive"
                onClick={() => deleteConfig(config.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <LLMConfigForm
        open={formOpen}
        onOpenChange={setFormOpen}
        editingConfig={editing}
        onSave={handleSave}
      />
    </div>
  )
}