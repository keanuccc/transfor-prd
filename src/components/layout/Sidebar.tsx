import { useNavigate } from 'react-router-dom'
import {
  Plus,
  Settings,
  PanelLeftClose,
  PanelLeft,
  MessageSquare,
  Trash2,
  Sun,
  Moon,
  Monitor,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useAppStore, type Theme } from '@/stores/appStore'
import { useConversationStore } from '@/stores/conversationStore'
import { cn } from '@/lib/utils'

const themeOptions: { value: Theme; icon: typeof Sun; label: string }[] = [
  { value: 'light', icon: Sun, label: '浅色' },
  { value: 'dark', icon: Moon, label: '深色' },
  { value: 'system', icon: Monitor, label: '跟随系统' },
]

function ThemeToggle({ collapsed }: { collapsed: boolean }) {
  const { theme, setTheme } = useAppStore()

  const cycleTheme = () => {
    const order: Theme[] = ['light', 'dark', 'system']
    const next = order[(order.indexOf(theme) + 1) % order.length]
    setTheme(next)
  }

  const current = themeOptions.find((o) => o.value === theme) || themeOptions[2]
  const Icon = current.icon

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger
          render={<Button variant="ghost" size="icon-sm" onClick={cycleTheme} />}
        >
          <Icon className="h-4 w-4" />
        </TooltipTrigger>
        <TooltipContent side="right">{current.label}</TooltipContent>
      </Tooltip>
    )
  }

  return (
    <div className="flex items-center gap-1">
      {themeOptions.map(({ value, icon: ThemeIcon }) => (
        <Button
          key={value}
          variant={theme === value ? 'secondary' : 'ghost'}
          size="icon-xs"
          onClick={() => setTheme(value)}
        >
          <ThemeIcon className="h-3.5 w-3.5" />
        </Button>
      ))}
    </div>
  )
}

export function Sidebar() {
  const navigate = useNavigate()
  const { sidebarCollapsed, toggleSidebar } = useAppStore()
  const { conversations, activeConversationId, setActiveConversation, deleteConversation } =
    useConversationStore()

  const handleNewConversation = () => {
    navigate('/')
  }

  const handleSelectConversation = async (id: string) => {
    await setActiveConversation(id)
    navigate(`/run/${id}`)
  }

  const handleDeleteConversation = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    await deleteConversation(id)
    if (activeConversationId === id) {
      navigate('/')
    }
  }

  return (
    <div
      className={cn(
        'flex h-screen flex-col border-r bg-muted/30 transition-all duration-300',
        sidebarCollapsed ? 'w-14' : 'w-60',
      )}
    >
      {/* Top: New Conversation button */}
      <div className="p-2">
        {sidebarCollapsed ? (
          <Tooltip>
            <TooltipTrigger
              render={
                <Button variant="default" size="icon" className="w-full" onClick={handleNewConversation} />
              }
            >
              <Plus className="h-4 w-4" />
            </TooltipTrigger>
            <TooltipContent side="right">新建对话</TooltipContent>
          </Tooltip>
        ) : (
          <Button variant="default" size="sm" className="w-full" onClick={handleNewConversation}>
            <Plus className="h-4 w-4 shrink-0" />
            <span className="ml-1">新建对话</span>
          </Button>
        )}
      </div>

      <Separator />

      {/* Conversation list */}
      <ScrollArea className="flex-1 overflow-hidden">
        {!sidebarCollapsed && (
          <div className="p-2">
            {conversations.length === 0 ? (
              <p className="py-4 text-center text-xs text-muted-foreground">暂无对话</p>
            ) : (
              <div className="space-y-0.5">
                {conversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={cn(
                      'group flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted',
                      activeConversationId === conv.id && 'bg-muted font-medium',
                    )}
                    onClick={() => handleSelectConversation(conv.id)}
                  >
                    <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="flex-1 truncate">{conv.title}</span>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      className="shrink-0 opacity-0 group-hover:opacity-100"
                      onClick={(e) => handleDeleteConversation(e, conv.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {sidebarCollapsed && conversations.length > 0 && (
          <div className="flex flex-col items-center gap-1 p-2">
            {conversations.slice(0, 5).map((conv) => (
              <Tooltip key={conv.id}>
                <TooltipTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className={cn(
                        activeConversationId === conv.id && 'bg-muted',
                      )}
                      onClick={() => handleSelectConversation(conv.id)}
                    />
                  }
                >
                  <MessageSquare className="h-4 w-4" />
                </TooltipTrigger>
                <TooltipContent side="right">{conv.title}</TooltipContent>
              </Tooltip>
            ))}
          </div>
        )}
      </ScrollArea>

      <Separator />

      {/* Bottom: Theme + Settings + Collapse */}
      <div className="flex items-center gap-1 p-2">
        <ThemeToggle collapsed={sidebarCollapsed} />

        <div className="flex-1" />

        {sidebarCollapsed ? (
          <Tooltip>
            <TooltipTrigger
              render={
                <Button variant="ghost" size="icon-sm" onClick={() => navigate('/settings')} />
              }
            >
              <Settings className="h-4 w-4" />
            </TooltipTrigger>
            <TooltipContent side="right">设置</TooltipContent>
          </Tooltip>
        ) : (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => navigate('/settings')}
          >
            <Settings className="h-4 w-4" />
          </Button>
        )}

        <Tooltip>
          <TooltipTrigger
            render={
              <Button variant="ghost" size="icon-sm" onClick={toggleSidebar} />
            }
          >
            {sidebarCollapsed ? (
              <PanelLeft className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </TooltipTrigger>
          {sidebarCollapsed && <TooltipContent side="right">展开侧边栏</TooltipContent>}
        </Tooltip>
      </div>
    </div>
  )
}
