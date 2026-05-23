import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { useSettingsStore } from '@/stores/settingsStore'

export function SystemPromptEditor() {
  const { systemPrompt, setSystemPrompt, restoreDefaultPrompt } = useSettingsStore()
  const [value, setValue] = useState(systemPrompt)
  const [dirty, setDirty] = useState(false)

  const handleChange = (v: string) => {
    setValue(v)
    setDirty(v !== systemPrompt)
  }

  const handleSave = () => {
    setSystemPrompt(value)
    setDirty(false)
    toast.success('系统提示词已保存')
  }

  const handleRestore = () => {
    restoreDefaultPrompt()
    const defaultPrompt = useSettingsStore.getState().systemPrompt
    setValue(defaultPrompt)
    setDirty(false)
    toast.success('已恢复默认系统提示词')
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-base font-medium">系统提示词</h2>
        <Button variant="outline" size="sm" onClick={handleRestore}>
          恢复默认
        </Button>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        自定义发送给大模型的系统提示词，影响生成内容的格式和风格。
      </p>

      <Textarea
        className="mt-3 min-h-[300px] font-mono text-xs leading-relaxed"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
      />

      <div className="mt-3 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{value.length} 字符</p>
        <Button size="sm" onClick={handleSave} disabled={!dirty}>
          保存
        </Button>
      </div>
    </div>
  )
}
