import prdPrompt from '../../prompts/将Markdown格式思维导图转换为产品功能描述文档（PRD）系统提示词.md?raw'
import userStoryPrompt from '../../prompts/用户故事地图.md?raw'
import techSpecPrompt from '../../prompts/技术规格文档.md?raw'

export interface Template {
  id: string
  name: string
  description: string
  icon: string
  systemPrompt: string
}

export const templates: Template[] = [
  {
    id: 'prd',
    name: '产品功能描述 (PRD)',
    description: '将思维导图转换为详细的产品功能描述文档',
    icon: 'FileText',
    systemPrompt: prdPrompt,
  },
  {
    id: 'user-story-map',
    name: '用户故事地图',
    description: '转换为用户故事地图，包含验收标准和发布计划',
    icon: 'Map',
    systemPrompt: userStoryPrompt,
  },
  {
    id: 'tech-spec',
    name: '技术规格文档',
    description: '转换为技术规格文档，包含API设计和数据模型',
    icon: 'Code',
    systemPrompt: techSpecPrompt,
  },
]

export function getTemplateById(id: string): Template | undefined {
  return templates.find((t) => t.id === id)
}

export const defaultTemplate = templates[0]
