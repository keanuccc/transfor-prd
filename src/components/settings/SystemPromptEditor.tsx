import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { useSettingsStore } from '@/stores/settingsStore'
import { RotateCcw, Save, MessageSquare } from 'lucide-react'

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
        <div>
          <h2 className="text-base font-semibold">系统提示词</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            自定义全局系统提示词。使用自定义模板时，模板自带的提示词优先。
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRestore}
          className="gap-1.5"
        >
          <RotateCcw className="h-3 w-3" />
          恢复默认
        </Button>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border bg-card/60 shadow-xs transition-all focus-within:border-primary/20 focus-within:shadow-sm">
        <div className="flex items-center gap-2 border-b bg-muted/30 px-4 py-2">
          <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Prompt Editor</span>
          {dirty && (
            <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-400">
              未保存
            </span>
          )}
        </div>
        <Textarea
          className="min-h-[320px] border-0 bg-transparent font-mono text-xs leading-relaxed placeholder:text-muted-foreground/40 focus-visible:ring-0 rounded-none resize-none"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="在此输入系统提示词..."
          spellCheck={false}
        />
      </div>

      <div className="mt-3 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {value.length.toLocaleString()} 字符
        </p>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={!dirty}
          className="gap-1.5"
        >
          <Save className="h-3 w-3" />
          保存修改
        </Button>
      </div>
    </div>
  )
}