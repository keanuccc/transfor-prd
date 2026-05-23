import { useNavigate } from 'react-router-dom'
import { useState, useRef, useEffect, useMemo } from 'react'
import {
  Plus,
  Search,
  Settings,
  PanelLeftClose,
  PanelLeft,
  MessageSquare,
  Trash2,
  Pencil,
  Sun,
  Moon,
  Monitor,
  Star,
  Tag,
  X,
} from 'lucide-react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  const { conversations, activeConversationId, setActiveConversation, deleteConversation, renameConversation, updateConversation } =
    useConversationStore()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [taggingId, setTaggingId] = useState<string | null>(null)
  const [tagInput, setTagInput] = useState('')
  const editInputRef = useRef<HTMLInputElement>(null)
  const tagInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.select()
    }
  }, [editingId])

  const handleNewConversation = () => {
    navigate('/')
  }

  const handleSelectConversation = async (id: string) => {
    if (editingId) return
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

  const handleStartRename = (e: React.MouseEvent, id: string, title: string) => {
    e.stopPropagation()
    setEditingId(id)
    setEditTitle(title)
  }

  const handleFinishRename = async (id: string) => {
    const title = editTitle.trim()
    if (title) {
      await renameConversation(id, title)
    }
    setEditingId(null)
    setEditTitle('')
  }

  const handleRenameKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter') handleFinishRename(id)
    if (e.key === 'Escape') {
      setEditingId(null)
      setEditTitle('')
    }
  }

  const handleToggleStar = (e: React.MouseEvent, id: string, starred: boolean) => {
    e.stopPropagation()
    updateConversation(id, { starred: !starred })
  }

  const handleStartTagging = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    setTaggingId(id)
    setTagInput('')
    setTimeout(() => tagInputRef.current?.focus(), 50)
  }

  const handleAddTag = async (id: string, tags: string[]) => {
    const name = tagInput.trim()
    if (name && !tags.includes(name)) {
      await updateConversation(id, { tags: [...tags, name] })
    }
    setTaggingId(null)
    setTagInput('')
  }

  const handleRemoveTag = async (e: React.MouseEvent, id: string, tags: string[], tag: string) => {
    e.stopPropagation()
    await updateConversation(id, { tags: tags.filter((t) => t !== tag) })
  }

  const handleTagKeyDown = (e: React.KeyboardEvent, id: string, tags: string[]) => {
    if (e.key === 'Enter') handleAddTag(id, tags)
    if (e.key === 'Escape') {
      setTaggingId(null)
      setTagInput('')
    }
  }

  // Filtered and sorted conversations — starred first, then by updatedAt desc
  const filteredConversations = useMemo(() => {
    let list = searchQuery
      ? conversations.filter((conv) =>
          conv.title.toLowerCase().includes(searchQuery.toLowerCase()),
        )
      : [...conversations]
    list.sort((a, b) => {
      if (a.starred !== b.starred) return a.starred ? -1 : 1
      return b.updatedAt - a.updatedAt
    })
    return list
  }, [conversations, searchQuery])

  const listRef = useRef<HTMLDivElement>(null)
  const ITEM_HEIGHT = 36

  const virtualizer = useVirtualizer({
    count: filteredConversations.length,
    getScrollElement: () => listRef.current,
    estimateSize: () => ITEM_HEIGHT,
    overscan: 5,
  })

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

      {/* Search */}
      {!sidebarCollapsed && conversations.length > 0 && (
        <div className="relative mx-2 mt-2">
          <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜索对话..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-7 pl-7 text-xs"
          />
        </div>
      )}

      {/* Conversation list */}
      {!sidebarCollapsed ? (
        <div ref={listRef} className="flex-1 overflow-auto">
          {filteredConversations.length === 0 ? (
            <p className="py-4 text-center text-xs text-muted-foreground">暂无对话</p>
          ) : (
            <div
              className="relative"
              style={{ height: `${virtualizer.getTotalSize()}px` }}
            >
              <div className="p-2">
                {virtualizer.getVirtualItems().map((virtualItem) => {
                  const conv = filteredConversations[virtualItem.index]
                  return (
                    <div
                      key={conv.id}
                      className={cn(
                        'group absolute left-2 right-2 flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-sm hover:bg-muted',
                        activeConversationId === conv.id && 'bg-muted font-medium',
                      )}
                      style={{
                        top: `${virtualItem.start}px`,
                        height: `${virtualItem.size}px`,
                      }}
                      onClick={() => handleSelectConversation(conv.id)}
                    >
                      <MessageSquare className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      {editingId === conv.id ? (
                        <Input
                          ref={editInputRef}
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onBlur={() => handleFinishRename(conv.id)}
                          onKeyDown={(e) => handleRenameKeyDown(e, conv.id)}
                          className="h-5 flex-1 text-sm"
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <>
                          <span className="flex-1 truncate">{conv.title}</span>
                          {conv.tags.length > 0 && (
                            <div className="hidden shrink-0 items-center gap-0.5 group-hover:hidden">
                              {conv.tags.slice(0, 2).map((tag) => (
                                <span
                                  key={tag}
                                  className="rounded-full bg-blue-50 px-1.5 py-0 text-[9px] text-blue-600 dark:bg-blue-950/40 dark:text-blue-300"
                                >
                                  {tag}
                                </span>
                              ))}
                              {conv.tags.length > 2 && (
                                <span className="text-[9px] text-muted-foreground">+{conv.tags.length - 2}</span>
                              )}
                            </div>
                          )}
                        </>
                      )}
                      {/* Star button */}
                      <button
                        className={cn(
                          'shrink-0 rounded p-0.5 transition-all hover:bg-muted',
                          conv.starred ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
                        )}
                        onClick={(e) => handleToggleStar(e, conv.id, conv.starred)}
                        title={conv.starred ? '取消星标' : '星标'}
                      >
                        <Star
                          className={cn(
                            'h-3 w-3',
                            conv.starred ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground',
                          )}
                        />
                      </button>
                      {/* Tag edit on hover */}
                      <div className="shrink-0 opacity-0 group-hover:opacity-100">
                        {taggingId === conv.id ? (
                          <input
                            ref={tagInputRef}
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onBlur={() => handleAddTag(conv.id, conv.tags)}
                            onKeyDown={(e) => handleTagKeyDown(e, conv.id, conv.tags)}
                            placeholder="标签..."
                            className="h-5 w-12 rounded border border-border px-1 text-[10px] outline-none"
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <button
                            className="flex items-center gap-0.5 rounded p-0.5 text-[9px] text-muted-foreground hover:bg-muted"
                            onClick={(e) => handleStartTagging(e, conv.id)}
                            title="添加标签"
                          >
                            <Tag className="h-2.5 w-2.5" />
                          </button>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        className="shrink-0 opacity-0 group-hover:opacity-100"
                        onClick={(e) => handleStartRename(e, conv.id, conv.title)}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        className="shrink-0 opacity-0 group-hover:opacity-100"
                        onClick={(e) => handleDeleteConversation(e, conv.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center gap-1 overflow-auto p-2">
          {filteredConversations.slice(0, 10).map((conv) => (
            <Tooltip key={conv.id}>
              <TooltipTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className={cn(activeConversationId === conv.id && 'bg-muted')}
                    onClick={() => handleSelectConversation(conv.id)}
                  />
                }
              >
                <MessageSquare className="h-4 w-4" />
              </TooltipTrigger>
              <TooltipContent side="right">{conv.title}</TooltipContent>
            </Tooltip>
          ))}
          {filteredConversations.length > 10 && (
            <p className="text-[10px] text-muted-foreground">
              +{filteredConversations.length - 10} 更多
            </p>
          )}
        </div>
      )}

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

        <Button variant="ghost" size="icon-sm" onClick={toggleSidebar} title={sidebarCollapsed ? '展开侧边栏' : '收起侧边栏'}>
          {sidebarCollapsed ? (
            <PanelLeft className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  )
}
