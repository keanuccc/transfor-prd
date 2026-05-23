import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import defaultPrompt from '../../prompts/将Markdown格式思维导图转换为产品功能描述文档（PRD）系统提示词.md?raw'

interface SettingsState {
  systemPrompt: string
  autoContinue: boolean
  setSystemPrompt: (prompt: string) => void
  restoreDefaultPrompt: () => void
  setAutoContinue: (value: boolean) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      systemPrompt: defaultPrompt,
      autoContinue: true,

      setSystemPrompt: (prompt) => set({ systemPrompt: prompt }),

      restoreDefaultPrompt: () => set({ systemPrompt: defaultPrompt }),

      setAutoContinue: (value) => set({ autoContinue: value }),
    }),
    { name: 'settings-store' },
  ),
)
