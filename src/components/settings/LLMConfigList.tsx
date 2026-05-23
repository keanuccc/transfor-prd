import { useState } from 'react'
import { Plus, Pencil, Trash2, Star, ChevronUp, ChevronDown } from 'lucide-react'
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
        <h2 className="text-base font-medium">大模型配置</h2>
        <Button size="sm" className="gap-1" onClick={handleAdd}>
          <Plus className="h-4 w-4" />
          添加模型
        </Button>
      </div>

      {sorted.length === 0 && (
        <p className="mt-3 text-sm text-muted-foreground">
          还没有配置模型，点击上方按钮添加。
        </p>
      )}

      <div className="mt-3 space-y-2">
        {sorted.map((config, index) => (
          <div
            key={config.id}
            className="flex items-center gap-2 rounded-lg border px-3 py-2"
          >
            <div className="flex flex-col">
              <Button variant="ghost" size="icon-xs" onClick={() => moveUp(index)} disabled={index === 0}>
                <ChevronUp className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="icon-xs" onClick={() => moveDown(index)} disabled={index === sorted.length - 1}>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {config.modelName}
                {config.isDefault && (
                  <span className="ml-2 text-xs text-primary">(默认)</span>
                )}
              </p>
              <p className="truncate text-xs text-muted-foreground">{config.baseUrl}</p>
            </div>

            <Button variant="ghost" size="icon-xs" onClick={() => setDefault(config.id)} disabled={config.isDefault}>
              <Star className={`h-3.5 w-3.5 ${config.isDefault ? 'fill-primary text-primary' : ''}`} />
            </Button>
            <Button variant="ghost" size="icon-xs" onClick={() => handleEdit(config)}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon-xs" className="text-destructive" onClick={() => deleteConfig(config.id)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
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
