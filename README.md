# Markdown 思维导图 → PRD 转换器

将产品功能结构思维导图（Markdown 格式）自动转换为详细的产品功能描述文档（PRD），基于大语言模型生成。

## 功能

- **智能转换**：上传 Markdown 思维导图，LLM 自动展开为结构化 PRD
- **多模型支持**：配置任意 OpenAI 兼容 API 的模型
- **流式生成**：实时查看生成进度，支持自动续写长文档
- **对话交互**：生成后可持续追问、补充、修改
- **编辑导出**：预览/编辑 Markdown 源码，一键复制或下载 .md 文件
- **历史管理**：对话历史持久化存储，支持搜索、重命名

## 技术栈

| 层 | 技术 |
|---|---|
| 框架 | React 19 + TypeScript |
| 构建 | Vite 8 (Rolldown) |
| 样式 | Tailwind CSS 4 |
| 状态管理 | Zustand |
| 路由 | React Router v7 |
| 本地存储 | Dexie.js (IndexedDB) |
| UI 组件 | Base UI (Radix) + 自定义组件 |
| Markdown | react-markdown + remark-gfm |

## 项目结构

```
src/
├── components/
│   ├── home/           # 首页：文件上传、模型选择、生成按钮
│   ├── run/            # 运行页：消息气泡、思维面板、编辑器工具栏
│   ├── layout/         # 布局：侧边栏、主题切换
│   ├── settings/       # 设置：模型配置、系统提示词
│   └── ui/             # 基础 UI 组件
├── hooks/              # useLLMStream, useFileUpload
├── services/           # LLM 流式调用, 连通性检查
├── stores/             # Zustand stores (app, conversation, llm, settings)
├── db/                 # IndexedDB schema
├── lib/                # 工具函数、常量
├── pages/              # 页面组件
├── router/             # 路由配置
└── types/              # TypeScript 类型定义
```

## 开发

```bash
npm install
npm run dev      # 启动开发服务器
npm run build    # 构建生产版本
npm run lint     # ESLint 检查
```
