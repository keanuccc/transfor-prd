import { useNavigate } from 'react-router-dom'
import { useState, useRef, useEffect, useMemo } from 'react'
import {
  Brain,
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
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  FolderPlus,
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
import { useFolderStore } from '@/stores/folderStore'
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
  const { conversations, activeConversationId, setActiveConversation, deleteConversation, renameConversation, moveToFolder, updateConversation } =
    useConversationStore()
  const { folders, addFolder, renameFolder, deleteFolder } = useFolderStore()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [taggingId, setTaggingId] = useState<string | null>(null)
  const [tagInput, setTagInput] = useState('')
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [showNewFolder, setShowNewFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null)
  const [editFolderName, setEditFolderName] = useState('')
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const editInputRef = useRef<HTMLInputElement>(null)
  const tagInputRef = useRef<HTMLInputElement>(null)
  const folderInputRef = useRef<HTMLInputElement>(null)

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

  const handleTagKeyDown = (e: React.KeyboardEvent, id: string, tags: string[]) => {
    if (e.key === 'Enter') handleAddTag(id, tags)
    if (e.key === 'Escape') {
      setTaggingId(null)
      setTagInput('')
    }
  }

  const handleCreateFolder = () => {
    const name = newFolderName.trim()
    if (!name) return
    addFolder(name)
    setNewFolderName('')
    setShowNewFolder(false)
  }

  const handleStartRenameFolder = (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation()
    setEditingFolderId(id)
    setEditFolderName(name)
  }

  const handleFinishRenameFolder = (id: string) => {
    const name = editFolderName.trim()
    if (name) renameFolder(id, name)
    setEditingFolderId(null)
    setEditFolderName('')
  }

  const handleDeleteFolder = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    deleteFolder(id)
  }

  const handleToggleFolder = (id: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Filtered and sorted conversations — starred first, then by updatedAt desc
  const filteredConversations = useMemo(() => {
    let list = searchQuery
      ? conversations.filter((conv) =>
          conv.title.toLowerCase().includes(searchQuery.toLowerCase()),
        )
      : [...conversations]
    if (selectedFolderId) {
      list = list.filter((conv) => conv.folderId === selectedFolderId)
    }
    list.sort((a, b) => {
      if (a.starred !== b.starred) return a.starred ? -1 : 1
      return b.updatedAt - a.updatedAt
    })
    return list
  }, [conversations, searchQuery, selectedFolderId])

  const listRef = useRef<HTMLDivElement>(null)
  const ITEM_HEIGHT = 40

  const virtualizer = useVirtualizer({
    count: filteredConversations.length,
    getScrollElement: () => listRef.current,
    estimateSize: () => ITEM_HEIGHT,
    overscan: 5,
  })

  return (
    <div
      className={cn(
        'flex h-screen flex-col border-r border-border/40 bg-gradient-to-b from-muted/30 via-muted/20 to-muted/10 transition-all duration-300',
        sidebarCollapsed ? 'w-[3.5rem]' : 'w-[15.5rem]',
      )}
    >
      {/* App branding */}
      {!sidebarCollapsed && (
        <div className="flex items-center gap-2.5 px-3.5 py-3.5">
          <div className="flex size-7 items-center justify-center rounded-lg bg-primary shadow-sm">
            <Brain className="size-4 text-primary-foreground" />
          </div>
          <span className="text-sm font-semibold tracking-tight">TransforPRD</span>
        </div>
      )}

      {/* Top: New Conversation button */}
      <div className={cn('px-3 pb-2.5', sidebarCollapsed && 'px-2')}>
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
          <Button variant="default" size="sm" className="w-full shadow-xs transition-shadow hover:shadow-sm" onClick={handleNewConversation}>
            <Plus className="h-4 w-4 shrink-0" />
            <span className="ml-1.5">新建对话</span>
          </Button>
        )}
      </div>

      <Separator className="mx-3.5 w-auto" />

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

      {/* Folder section */}
      {!sidebarCollapsed && (
        <div className="mx-2 mt-2">
          <div className="flex items-center justify-between px-1">
            <button
              onClick={() => setSelectedFolderId(null)}
              className={cn(
                'text-[11px] font-medium transition-colors',
                selectedFolderId === null ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              全部对话
            </button>
            <button
              onClick={() => setShowNewFolder((p) => !p)}
              className="rounded p-0.5 text-muted-foreground hover:text-foreground"
              title="新建文件夹"
            >
              <FolderPlus className="h-3 w-3" />
            </button>
          </div>
          {showNewFolder && (
            <div className="mt-1 flex items-center gap-1 px-1">
              <Input
                ref={folderInputRef}
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateFolder()
                  if (e.key === 'Escape') { setShowNewFolder(false); setNewFolderName('') }
                }}
                placeholder="文件夹名称"
                className="h-6 flex-1 text-xs"
                autoFocus
              />
              <Button variant="ghost" size="icon-xs" onClick={handleCreateFolder}>
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          )}
          {folders.map((folder) => {
            const count = conversations.filter((c) => c.folderId === folder.id).length
            const isExpanded = expandedFolders.has(folder.id)
            const isSelected = selectedFolderId === folder.id
            return (
              <div key={folder.id} className="mt-0.5">
                <div
                  className={cn(
                    'group flex items-center gap-1 rounded px-1 py-0.5 text-xs cursor-pointer transition-colors',
                    isSelected ? 'bg-muted font-medium' : 'hover:bg-muted/60',
                  )}
                  onClick={() => {
                    setSelectedFolderId(folder.id)
                    setExpandedFolders((prev) => {
                      const next = new Set(prev)
                      next.add(folder.id)
                      return next
                    })
                  }}
                >
                  <button
                    onClick={(e) => { e.stopPropagation(); handleToggleFolder(folder.id) }}
                    className="flex size-4 items-center justify-center"
                  >
                    {isExpanded ? <ChevronDown className="size-3 text-muted-foreground" /> : <ChevronRight className="size-3 text-muted-foreground" />}
                  </button>
                  {isExpanded ? <FolderOpen className="size-3 text-muted-foreground" /> : <Folder className="size-3 text-muted-foreground" />}
                  {editingFolderId === folder.id ? (
                    <input
                      value={editFolderName}
                      onChange={(e) => setEditFolderName(e.target.value)}
                      onBlur={() => handleFinishRenameFolder(folder.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleFinishRenameFolder(folder.id)
                        if (e.key === 'Escape') setEditingFolderId(null)
                      }}
                      className="h-4 flex-1 min-w-0 rounded border border-border px-1 text-[11px] outline-none"
                      onClick={(e) => e.stopPropagation()}
                      autoFocus
                    />
                  ) : (
                    <span className="flex-1 truncate">{folder.name}</span>
                  )}
                  <span className="text-[10px] text-muted-foreground">{count}</span>
                  <div className="hidden group-hover:flex items-center gap-0.5">
                    <button
                      onClick={(e) => handleStartRenameFolder(e, folder.id, folder.name)}
                      className="rounded p-0.5 text-muted-foreground hover:text-foreground"
                    >
                      <Pencil className="size-2.5" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteFolder(e, folder.id)}
                      className="rounded p-0.5 text-muted-foreground hover:text-destructive"
                    >
                      <X className="size-2.5" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
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
              <div className="px-3 py-1.5">
                {virtualizer.getVirtualItems().map((virtualItem) => {
                  const conv = filteredConversations[virtualItem.index]
                  const isActive = activeConversationId === conv.id
                  return (
                    <div
                      key={conv.id}
                      className={cn(
                        'group absolute left-1 right-1 flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-[13px] transition-all duration-200',
                        isActive
                          ? 'bg-muted font-medium shadow-xs'
                          : 'hover:bg-muted/60',
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
                                  className="rounded-full bg-primary/8 px-1.5 py-0 text-[9px] text-primary/70 dark:bg-primary/15 dark:text-primary/60"
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
                      {/* Move to folder on hover */}
                      <div className="shrink-0 opacity-0 group-hover:opacity-100 relative" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={conv.folderId || ''}
                          onChange={(e) => moveToFolder(conv.id, e.target.value || undefined)}
                          className="h-5 w-5 cursor-pointer appearance-none rounded border-0 bg-transparent text-[0px] opacity-0 absolute inset-0"
                          title="移动到文件夹"
                        >
                          <option value="">-</option>
                          {folders.map((f) => (
                            <option key={f.id} value={f.id}>{f.name}</option>
                          ))}
                        </select>
                        <Folder className="h-2.5 w-2.5 text-muted-foreground" />
                      </div>
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

      <div className="border-t border-border/30" />

      {/* Bottom: Theme + Settings + Collapse */}
      <div className={cn(
        'bg-muted/20 p-1.5',
        sidebarCollapsed ? 'flex flex-col items-center gap-1.5' : 'flex items-center gap-1',
      )}>
        <ThemeToggle collapsed={sidebarCollapsed} />

        {!sidebarCollapsed && <div className="flex-1" />}

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

        {sidebarCollapsed ? (
          <Tooltip>
            <TooltipTrigger
              render={
                <Button variant="ghost" size="icon-sm" onClick={toggleSidebar} />
              }
            >
              <PanelLeft className="h-4 w-4" />
            </TooltipTrigger>
            <TooltipContent side="right">展开侧边栏</TooltipContent>
          </Tooltip>
        ) : (
          <Button variant="ghost" size="icon-sm" onClick={toggleSidebar} title="收起侧边栏">
            <PanelLeftClose className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
