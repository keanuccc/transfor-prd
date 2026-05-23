# 项目方案文档

## 一、项目概述

### 1.1 产品定位

**Markdown 思维导图 → PRD 转换器** — 面向产品经理的 AI 文档生成工具。将结构化思维导图自动展开为详细、专业的产品功能描述文档。

### 1.2 核心价值

- **效率提升**：将手动撰写 PRD 的数小时工作缩短到分钟级
- **质量保证**：基于系统提示词约束，确保输出格式统一、内容完整
- **灵活可控**：支持多模型切换、自定义提示词、对话式修改

### 1.3 竞品分析

| 维度 | 本工具 | ChatGPT/通用 AI | 专业 PRD 工具 |
|---|---|---|---|
| 输入方式 | Markdown 思维导图 | 自由文本 | 表单式填写 |
| 输出质量 | 结构化 PRD | 依赖 prompt 质量 | 固定模板 |
| 灵活性 | 高（自定义提示词） | 高 | 低 |
| 成本 | API 费用 | 订阅费 | 昂贵 |
| 隐私 | 本地存储 | 云端 | 云端 |

## 二、技术架构

### 2.1 整体架构

```
┌─────────────────────────────────────────────────┐
│                    前端 SPA                       │
│  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │
│  │  HomePage │  │  RunPage  │  │ SettingsPage  │  │
│  └─────┬─────┘  └────┬─────┘  └───────┬───────┘  │
│        │              │                │          │
│  ┌─────┴──────────────┴────────────────┴───────┐  │
│  │              Zustand Stores                  │  │
│  │  appStore / llmStore / settingsStore        │  │
│  │  conversationStore (messages + streamState) │  │
│  └─────────────────────┬───────────────────────┘  │
│        │               │                │          │
│  ┌─────┴───┐  ┌────────┴─────┐  ┌──────┴──────┐  │
│  │ Dexie.js│  │  LLM Service│  │  Hooks      │  │
│  │(IndexedDB)│ │ (SSE Stream)│  │ useLLMStream│  │
│  └─────────┘  └─────────────┘  └─────────────┘  │
└─────────────────────────────────────────────────┘
          │                │
    OpenAI-compatible   本地 IndexedDB
    API (可配置)         (对话 & 消息持久化)
```

### 2.2 数据流

```
用户上传文件 → 读取内容 → 选择模型 → 点击生成
     │
     ├→ 创建 Conversation (IndexedDB)
     ├→ 创建 UserMessage (包含思维导图内容)
     ├→ 创建 AssistantMessage (空, streaming)
     │
     └→ useLLMStream.startGeneration()
          │
          ├→ ping LLM 连通性
          ├→ 构建 ChatMessages [system, user]
          └→ streamWithAutoContinue()
               │
               ├→ SSE 流式读取
               ├→ 实时更新 AssistantMessage.content
               ├→ 检测 finishReason
               │    ├→ 'stop' → 标记 completed
               │    ├→ 'length' + autoContinue → 续写
               │    └→ 'length' + !autoContinue → 标记 stopped
               └→ 更新 Conversation.updatedAt

后续对话：
用户输入 → sendMessage()
     │
     ├→ 创建 UserMessage
     ├→ 创建 AssistantMessage
     ├→ 构建完整历史 [system, ...existing, user]
     └→ streamWithAutoContinue() (同上)
```

### 2.3 存储设计

**IndexedDB (Dexie.js)**

```
conversations                        messages
┌──────────────────────┐            ┌──────────────────────┐
│ id (PK)              │◄───────────│ conversationId (FK)  │
│ title                │            │ id (PK)              │
│ llmConfigId          │            │ role                 │
│ createdAt            │            │ content              │
│ updatedAt            │            │ status               │
│ sourceFileName       │            │ partIndex            │
│ sourceFileContent    │            │ totalParts           │
│ userDescription      │            │ thinkingContent      │
└──────────────────────┘            │ errorMessage         │
                                    │ createdAt            │
localStorage (persist)              └──────────────────────┘
┌──────────────────────┐
│ llm-store (模型配置)  │
│ settings-store (提示词)│
│ app-store (主题)      │
└──────────────────────┘
```

> **注意**：API Key 当前明文存储在 localStorage 中，P2 计划加密存储。

## 三、功能规划

### 3.1 已完成

| 功能 | 说明 |
|---|---|
| 文件上传 | 点击上传 + 拖拽上传，.md/.markdown 格式 |
| 流式生成 | SSE 流式读取，实时展示生成内容 |
| 自动续写 | finishReason=length 时自动继续，最多 5 轮 |
| Thinking 展示 | 支持 reasoning_content 的模型可折叠展示思考过程 |
| 多模型配置 | 添加/编辑/删除/排序多个 OpenAI 兼容模型 |
| 连通性检查 | 生成前 ping 模型可用性 |
| 系统提示词 | 自定义编辑，支持恢复默认 |
| 对话历史 | 新增/删除/搜索/重命名对话 |
| 深色模式 | 浅色/深色/跟随系统 |
| 复制下载 | 复制 Markdown 到剪贴板或下载 .md 文件 |
| PRD 编辑 | 预览/编辑模式切换，支持修改后保存 |
| Error Boundary | 全局错误捕获，防止白屏 |
| 对话交互 | 生成后可发送消息追问、修改 |

### 3.2 待开发 (P1)

| 功能 | 说明 |
|---|---|
| 多模板系统 | 除 PRD 外，支持用户故事、技术规格、测试用例等输出模板 |
| 分段生成 | 选择思维导图特定模块单独生成 |
| AI 精修 | 选中段落进行展开、精简、改写 |
| 对话时间戳 | 侧边栏显示创建/更新时间 |
| 键盘快捷键 | Ctrl+N 新建、Ctrl+S 下载、Esc 停止生成 |
| 导出 PDF/Word | 除 Markdown 外支持更多格式 |

### 3.3 待开发 (P2)

| 功能 | 说明 |
|---|---|
| 多模型对比 | 同一输入并发多个模型，并排比较输出 |
| 版本历史 | 生成/编辑历史，支持回退 |
| 图片输入 | 多模态模型识别思维导图截图 |
| 批量处理 | 一次上传多个文件，批量生成 |
| API Key 加密 | localStorage 加密存储 |
| 单元测试 | services、hooks、stores 测试覆盖 |
| E2E 测试 | 核心流程端到端测试 |
| 虚拟滚动 | 对话列表 100+ 时的性能优化 |
| i18n | 国际化支持（中/英） |
| PWA | Service Worker 离线可用 |

### 3.4 待开发 (P3)

| 功能 | 说明 |
|---|---|
| 分享链接 | 生成只读分享链接 |
| 协作编辑 | 多人实时编辑 PRD |
| 知识库集成 | 喂入领域知识提升生成质量 |
| 项目管理集成 | 导出到 Jira/Linear/Notion |
| 飞书通知 | 长文档生成完成后通知 |

## 四、迭代路线

```
Phase 1 (已完成) ✅
├── 核心功能：上传 → 生成 → 预览
├── 流式输出 + 自动续写
├── 多模型配置 + 自定义提示词
├── 对话历史管理
└── 工程质量：ErrorBoundary、流式逻辑统一

Phase 2 (进行中) 🔄
├── 拖拽上传视觉反馈
├── 对话搜索/重命名
├── PRD 编辑模式
└── 项目文档沉淀

Phase 3 (规划中) 📋
├── 多模板系统
├── 分段生成 + AI 精修
├── 导出 PDF/Word
├── 键盘快捷键
└── 测试覆盖

Phase 4 (远期) 💡
├── 多模型对比
├── 图片输入
├── i18n + PWA
├── API Key 加密
└── 分享与协作
```

## 五、技术决策记录

### 5.1 为什么用 IndexedDB 而不是 localStorage？

- localStorage 有 5-10MB 限制，长 PRD 内容可能超出
- IndexedDB 支持结构化查询、索引、事务
- Dexie.js 提供了简洁的 Promise-based API

### 5.2 为什么流式生成不走 WebSocket？

- OpenAI 兼容 API 使用 SSE (Server-Sent Events) 流式输出
- SSE 比 WebSocket 更简单（单向数据流足够）
- 浏览器原生支持 `fetch` + `ReadableStream`

### 5.3 为什么自动续写最多 5 轮？

- 防止无限循环消耗 tokens
- 5 轮 × ~4K tokens = ~20K tokens 足够覆盖大多数 PRD
- 超出后标记 `stopped`，用户可手动继续

### 5.4 为什么 Zustand 而不是 Redux？

- Zustand 更轻量（~1KB），API 更简洁
- 内置 persist 中间件支持 localStorage
- 不需要 Provider 包裹，TypeScript 支持好

### 5.5 为什么用 Base UI 而不是 shadcn/ui？

- Base UI (Radix 原版) 提供 headless 组件，样式完全可控
- Tailwind CSS 4 直接覆盖样式，不需要 CSS-in-JS
- 自定义 UI 组件薄封装 Base UI，保持一致的组件 API
