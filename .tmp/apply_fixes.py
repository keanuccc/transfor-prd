# -*- coding: utf-8 -*-
import re

with open(r"D:\code\transfor-prd\src\pages\RunPage.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# === EDIT 1: Replace startedRef with startedForIdRef ===
content = content.replace(
    "const startedRef = useRef(false)",
    "const startedForIdRef = useRef<string | null>(null)"
)
content = content.replace("!startedRef.current", "startedForIdRef.current !== id")
content = content.replace("startedRef.current = true", "startedForIdRef.current = id")
content = re.sub(
    r'\n  useEffect\(\(\) => \{\n    startedRef\.current = false\n  \}, \[id\]\)',
    '',
    content
)

# === EDIT 2: After assistantMessage, insert view switching logic ===
# Unicode chars used: PRD 文档, 代码骨架, 评分结果, 时间轴, 精修, 审阅, 思维导图, 输出
old2 = "\n  useEffect(() => {\n    if (prevIsStreaming.current"
new2 = """
  // Collect all assistant messages with smart labels for view switching
  const allAssistantMsgs = useMemo(() => {
    const assistantMsgs = messages.filter((m) => m.role === 'assistant')
    return assistantMsgs.map((msg, idx) => {
      if (idx === 0) return { ...msg, label: '\u0050\u0052\u0044\u0020\u6587\u6863' }
      const ac = msg.content || ''
      // Detect by assistant output content pattern
      if (ac.includes('\u0060\u0060\u0060typescript') || ac.includes('\u0060\u0060\u0060sql') || ac.includes('\u9879\u76ee\u76ee\u5f55\u7ed3\u6784')) {
        return { ...msg, label: '\u4ee3\u7801\u9aa8\u67b6' }
      }
      if (ac.contains('"completeness"')) {
        return { ...msg, label: '\u8bc4\u5206\u7ed3\u679c' }
      }
      if (ac.includes('\u0060\u0060\u0060mermaid') and ac.includes('gantt')) {
        return { ...msg, label: '\u65f6\u95f4\u8f74' }
      }
      // Fallback: check preceding user prompt
      const msgIndex = messages.indexOf(msg)
      const prevUserMsg = [...messages.slice(0, msgIndex)].reverse().find((m) => m.role === 'user')
      const uc = prevUserMsg?.content || ''
      if (uc.includes('\u7cbe\u4fee')) return { ...msg, label: '\u7cbe\u4fee' }
      if (uc.includes('\u5ba1\u9605')) return { ...msg, label: '\u5ba1\u9605' }
      if (uc.includes('\u9006\u5411') || uc.includes('\u601d\u7ef4\u5bfc\u56fe')) return { ...msg, label: '\u601d\u7ef4\u5bfc\u56fe' }
      return { ...msg, label: '\u8f93\u51fa ' + str(idx + 1) }
    })
  }, [messages])

  const [activeViewId, setActiveViewId] = useState<string | null>(null)
  const prevAssistantCount = useRef(0)

  // Auto-switch to latest assistant message, or default to first PRD
  useEffect(() => {
    if (allAssistantMsgs.length === 0) {
      setActiveViewId(null)
      prevAssistantCount.current = 0
      return
    }
    if (allAssistantMsgs.length > prevAssistantCount.current) {
      setActiveViewId(allAssistantMsgs[allAssistantMsgs.length - 1].id)
    } else if (!activeViewId || !allAssistantMsgs.find((m) => m.id === activeViewId)) {
      setActiveViewId(allAssistantMsgs[0].id)
    }
    prevAssistantCount.current = allAssistantMsgs.length
  }, [allAssistantMsgs])

  // Active view message
  const activeAssistantMsg = useMemo(
    () => allAssistantMsgs.find((m) => m.id === activeViewId) || null,
    [allAssistantMsgs, activeViewId],
  )

  useEffect(() => {
    if (prevIsStreaming.current"""

if old2 not in content:
    print("EDIT 2: CANNOT FIND anchor, trying fallback...")
    # Try matching just the assistantMessage line
    idx = content.find("const assistantMessage = messages.find")
    if idx >= 0:
        print(f"  Found assistantMessage at offset {idx}")
else:
    content = content.replace(old2, new2)
    print("EDIT 2 applied")

# === EDIT 3: handleToggleEditMode ===
# Find the actual content by searching for the function signature
idx3 = content.find("  const handleToggleEditMode = useCallback(() => {")
if idx3 >= 0:
    # Find the closing of this function
    end3 = content.find("  }, [editMode, assistantMessage, editContent, updateMessage, id, createSnapshot])", idx3)
    if end3 >= 0:
        end3 += len("  }, [editMode, assistantMessage, editContent, updateMessage, id, createSnapshot])")
        old_block3 = content[idx3:end3]
        new_block3 = """  const handleToggleEditMode = useCallback(() => {
    const target = activeAssistantMsg || assistantMessage
    if (!editMode && target) {
      setEditContent(target.content)
    } else if (editMode && target && editContent !== target.content) {
      updateMessage(target.id, { content: editContent })
      if (id && target.content) {
        createSnapshot(id, target.content, `\u7f16\u8f91\u524d\u81ea\u52a8\u4fdd\u5b58 - ${new Date().toLocaleString('zh-CN')}`)
      }
    }
    setEditMode((prev) => !prev)
  }, [editMode, activeAssistantMsg, assistantMessage, editContent, updateMessage, id, createSnapshot])"""
        content = content[:idx3] + new_block3 + content[end3:]
        print("EDIT 3 applied")
else:
    print("EDIT 3: NOT FOUND")

# === EDIT 4: handleDownloadMd ===
idx4 = content.find("  const handleDownloadMd = useCallback(() => {")
if idx4 >= 0:
    end4 = content.find("  }, [assistantMessage?.content, conversation?.title])", idx4)
    if end4 >= 0:
        end4 += len("  }, [assistantMessage?.content, conversation?.title])")
        old_block4 = content[idx4:end4]
        new_block4 = """  const handleDownloadMd = useCallback(() => {
    const target = activeAssistantMsg || assistantMessage
    const content = target?.content
    if (!content) return
    const fileName = conversation?.title ? `\u0024{conversation.title}.md` : '\u6587\u6863.md'
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Markdown \u4e0b\u8f7d\u6210\u529f')
  }, [activeAssistantMsg, assistantMessage?.content, conversation?.title])"""
        content = content[:idx4] + new_block4 + content[end4:]
        print("EDIT 4 applied")
else:
    print("EDIT 4: NOT FOUND")

# === EDIT 5: handleRestoreVersion ===
idx5 = content.find("  const handleRestoreVersion = useCallback((content: string) => {")
if idx5 >= 0:
    end5 = content.find("  }, [assistantMessage, updateMessage])", idx5)
    if end5 >= 0:
        end5 += len("  }, [assistantMessage, updateMessage])")
        old_block5 = content[idx5:end5]
        new_block5 = """  const handleRestoreVersion = useCallback((content: string) => {
    const target = activeAssistantMsg || assistantMessage
    if (target) {
      updateMessage(target.id, { content })
      toast.success('\u5df2\u6062\u590d\u5386\u53f2\u7248\u672c')
    }
  }, [activeAssistantMsg, assistantMessage, updateMessage])"""
        content = content[:idx5] + new_block5 + content[end5:]
        print("EDIT 5 applied")
else:
    print("EDIT 5: NOT FOUND")

# === EDIT 6: currentContent ===
old6 = "  const currentContent = editMode ? editContent : (assistantMessage?.content || '')"
new6 = "  const currentContent = editMode ? editContent : ((activeAssistantMsg || assistantMessage)?.content || '')"
if old6 in content:
    content = content.replace(old6, new6)
    print("EDIT 6 applied")
else:
    print("EDIT 6: NOT FOUND")

# === EDIT 7: keyboard shortcuts ===
old7a = "    onToggleEdit: assistantMessage ? handleToggleEditMode : undefined,"
new7a = "    onToggleEdit: (activeAssistantMsg || assistantMessage) ? handleToggleEditMode : undefined,"
old7b = "    onExportMd: assistantMessage ? handleDownloadMd : undefined,"
new7b = "    onExportMd: (activeAssistantMsg || assistantMessage) ? handleDownloadMd : undefined,"
if old7a in content:
    content = content.replace(old7a, new7a)
    content = content.replace(old7b, new7b)
    print("EDIT 7 applied")
else:
    print("EDIT 7: NOT FOUND")

# === EDIT 8: cn import ===
content = content.replace(
    "import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'",
    "import { cn } from '@/lib/utils'\nimport { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'"
)
print("EDIT 8 applied")

# === EDIT 9: tab switcher ===
# Now let me also fix EDIT 2 to use correct Python boolean syntax
content = content.replace("if (ac.contains('\"completeness\"'))", "if ('\"completeness\"' in ac)")
content = content.replace("if (ac.includes('\u0060\u0060\u0060mermaid') and ac.includes('gantt'))", "if ('\u0060\u0060\u0060mermaid' in ac and 'gantt' in ac)")

# Find tab switcher insertion point
idx9 = content.find("{/* Comparison bar */}")
if idx9 >= 0:
    # Find the line before it
    line_start = content.rfind("\n", 0, idx9)
    line_before = content[line_start:idx9].strip()
    tab_switcher = """

        {/* View switcher tabs for multiple assistant outputs */}
        {allAssistantMsgs.length > 1 && (
          <div className="flex items-center gap-1 border-b border-border/30 bg-muted/10 px-3 py-1.5 overflow-x-auto">
            {allAssistantMsgs.map((msg) => (
              <button
                key={msg.id}
                type="button"
                onClick={() => setActiveViewId(msg.id)}
                className={cn(
                  'shrink-0 px-3 py-1 text-xs rounded-md transition-colors',
                  msg.id === activeViewId
                    ? 'bg-background shadow-sm text-foreground font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                )}
              >
                {msg.label}
                {msg.status === 'streaming' && (
                  <span className="ml-1 inline-block h-2 w-2 animate-pulse rounded-full bg-primary/60 align-middle" />
                )}
              </button>
            ))}
          </div>
        )}"""
    content = content[:idx9] + tab_switcher + "\n" + content[idx9:]
    print("EDIT 9 applied")
else:
    print("EDIT 9: NOT FOUND")

with open(r"D:\code\transfor-prd\src\pages\RunPage.tsx", "w", encoding="utf-8", newline='\n') as f:
    f.write(content)

print("All done!")