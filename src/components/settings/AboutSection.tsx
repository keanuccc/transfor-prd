import {
  Brain,
  ExternalLink,
  Globe,
  Heart,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const techStack = [
  { label: '框架', value: 'React 19 + TypeScript' },
  { label: '构建工具', value: 'Vite' },
  { label: '样式方案', value: 'Tailwind CSS v4' },
  { label: 'UI 组件', value: 'shadcn/ui' },
  { label: '状态管理', value: 'Zustand' },
  { label: '路由', value: 'React Router v7' },
  { label: '加密', value: 'AES-256-GCM (Web Crypto)' },
]

export function AboutSection() {
  return (
    <div>
      <div>
        <h2 className="text-base font-semibold">关于</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          关于本应用的版本和技术信息
        </p>
      </div>

      <div className="mt-4 flex flex-col items-center rounded-xl border bg-card/40 px-6 py-8 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
          <Brain className="h-7 w-7 text-primary" />
        </div>
        <h3 className="mt-4 text-lg font-semibold">Transfor PRD</h3>
        <p className="mt-1 text-xs text-muted-foreground">v0.0.0</p>
        <p className="mt-3 max-w-sm text-xs text-muted-foreground leading-relaxed">
          将 Markdown 格式的思维导图智能转换为结构化的产品功能描述文档（PRD），
          支持多模型协同、自定义模板和知识库增强。
        </p>
        <div className="mt-4 flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            asChild
          >
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Globe className="h-3.5 w-3.5" />
              GitHub
              <ExternalLink className="h-3 w-3" />
            </a>
          </Button>
        </div>
      </div>

      <div className="mt-4 rounded-xl border bg-card/40">
        <div className="border-b px-5 py-3">
          <p className="text-sm font-medium">技术栈</p>
        </div>
        <div className="divide-y">
          {techStack.map(({ label, value }) => (
            <div
              key={label}
              className="flex items-center justify-between px-5 py-2.5"
            >
              <span className="text-xs text-muted-foreground">{label}</span>
              <span className="text-xs font-medium">{value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 flex items-center justify-center gap-1 text-[11px] text-muted-foreground">
        <span>Made with</span>
        <Heart className="h-3 w-3 text-destructive" />
        <span>by the Transfor Team</span>
      </div>
    </div>
  )
}
