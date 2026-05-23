import { useEffect, useState } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useLLMStore } from '@/stores/llmStore'

interface ModelSelectorProps {
  value?: string
  onChange?: (value: string) => void
}

export function ModelSelector({ value, onChange }: ModelSelectorProps) {
  const { configs } = useLLMStore()
  const sorted = [...configs].sort((a, b) => a.displayOrder - b.displayOrder)
  const defaultId = configs.find((c) => c.isDefault)?.id || sorted[0]?.id

  const [internal, setInternal] = useState(defaultId || '')
  const selected = value ?? internal

  // Sync with store defaults when configs change
  useEffect(() => {
    if (!value && !configs.find((c) => c.id === internal)) {
      setInternal(defaultId || '')
    }
  }, [value, configs, defaultId, internal])

  const handleChange = (v: string | null) => {
    if (v === null) return
    setInternal(v)
    onChange?.(v)
  }

  return (
    <div>
      <Select value={selected || ''} onValueChange={handleChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={sorted.length === 0 ? '请先在设置中添加模型' : '选择模型'} />
        </SelectTrigger>
        <SelectContent>
          {sorted.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              <span className="flex items-center gap-2">
                <span
                  className={`inline-block h-1.5 w-1.5 rounded-full ${
                    c.lastPingSuccess === true
                      ? 'bg-green-500'
                      : c.lastPingSuccess === false
                        ? 'bg-red-500'
                        : 'bg-muted-foreground/40'
                  }`}
                />
                {c.modelName}
                {c.isDefault && ' (默认)'}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {sorted.length === 0 && (
        <p className="mt-1 text-xs text-muted-foreground">
          还没有配置模型，请先前往设置添加
        </p>
      )}
    </div>
  )
}
