# TransforPRD

基于 AI 的 Markdown 思维导图转 PRD（产品需求文档）工具。上传 Markdown 格式的思维导图，选择模型和模板，一键生成结构化的产品需求文档。

## 功能特性

- **思维导图转 PRD** — 上传 `.md` 思维导图，自动解析并生成完整 PRD
- **多模型支持** — 可配置 OpenAI 兼容的 LLM API，灵活切换模型
- **澄清对话** — 生成前自动提出澄清问题，确保 PRD 贴合需求
- **竞赛模式** — 多个模型同时生成 PRD，对比结果择优
- **分段生成** — 支持按章节分段生成，处理大型文档
- **代码骨架** — 基于 PRD 自动生成项目代码骨架
- **版本快照** — 记录 PRD 的多个版本，方便回溯对比
- **对话分组** — 文件夹管理对话记录，保持工作区整洁
- **知识库注入** — 自定义知识库，在生成时注入上下文
- **分享链接** — 生成 PRD 分享链接，团队协作更方便
- **平台同步** — 一键同步 PRD 到飞书等外部平台
- **Issue 同步** — 将 PRD 需求项同步为 GitHub/Linear Issue
- **评审打分** — 对生成的 PRD 进行多维度评分

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | React 19、TypeScript 6 |
| 构建 | Vite 8、Rolldown |
| 样式 | Tailwind CSS 4、Base UI |
| 路由 | React Router 7 |
| 状态管理 | Zustand |
| 本地存储 | Dexie.js (IndexedDB) |
| Markdown | react-markdown、remark-gfm、marked |
| 测试 | Vitest、Testing Library、jsdom |

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 运行测试
npm test
```

## 项目结构

```
src/
├── components/       # UI 组件
│   ├── home/         # 首页相关组件
│   ├── run/          # 生成/运行页组件
│   ├── settings/     # 设置页组件
│   ├── layout/       # 布局组件
│   └── ui/           # 通用 UI 组件
├── pages/            # 页面组件
├── hooks/            # 自定义 Hooks
├── stores/           # Zustand 状态管理
├── services/         # API 服务层
├── lib/              # 工具函数
├── db/               # IndexedDB 数据库
├── types/            # TypeScript 类型定义
├── router/           # 路由配置
└── test/             # 测试配置
```

## 使用说明

1. 在**模型配置**页面添加你的 LLM API（兼容 OpenAI 接口格式）
2. 在首页上传 Markdown 思维导图文件
3. 选择生成模型和 PRD 模板
4. 可选择开启澄清对话，让 AI 先帮你梳理需求
5. 点击生成，等待 PRD 输出
6. 在运行页查看、编辑、分享生成的 PRD
