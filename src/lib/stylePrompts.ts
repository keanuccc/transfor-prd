export interface StyleOption {
  id: string
  label: string
  description: string
  prompt: string
}

export const STYLE_OPTIONS: StyleOption[] = [
  {
    id: 'default',
    label: '默认',
    description: '标准技术文档风格',
    prompt: '',
  },
  {
    id: 'formal',
    label: '正式严谨',
    description: '技术评审、研发团队使用',
    prompt: '\n\n请使用正式严谨的技术文档风格撰写，注重术语准确性和逻辑严密性。',
  },
  {
    id: 'plain',
    label: '通俗易懂',
    description: '新人入职、跨部门协作',
    prompt: '\n\n请使用通俗易懂的语言风格撰写，减少专业术语，让非技术背景读者也能理解。',
  },
  {
    id: 'geek',
    label: '技术极客',
    description: '架构设计、深度技术讨论',
    prompt: '\n\n请使用技术极客风格撰写，深入技术实现细节，适当包含代码示例和架构说明。',
  },
  {
    id: 'boss',
    label: '面向老板',
    description: '项目汇报、管理层决策',
    prompt: '\n\n请使用面向管理层汇报的风格撰写，突出业务价值、ROI 和项目里程碑。',
  },
]
