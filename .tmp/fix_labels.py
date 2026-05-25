# -*- coding: utf-8 -*-
import re

with open(r"D:\code\transfor-prd\src\pages\RunPage.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# The current label logic block  
old_block = """  const allAssistantMsgs = useMemo(() => {
    const assistantMsgs = messages.filter((m) => m.role === 'assistant')
    return assistantMsgs.map((msg, idx) => {
      if (idx === 0) return { ...msg, label: '\u0050\u0052\u0044\u0020\u6587\u6863' }
      // Find preceding user message for label
      const msgIndex = messages.indexOf(msg)
      const prevUserMsg = [...messages.slice(0, msgIndex)].reverse().find((m) => m.role === 'user')
      const uc = prevUserMsg?.content || ''
      if (uc.includes('\u4ee3\u7801\u9aa8\u67b6')) return { ...msg, label: '\u4ee3\u7801\u9aa8\u67b6' }
      if (uc.includes('\u7cbe\u4fee')) return { ...msg, label: '\u7cbe\u4fee' }
      if (uc.includes('\u5ba1\u9605') || uc.includes('\u8bc4\u5206')) return { ...msg, label: '\u5ba1\u9605\u8bc4\u5206' }
      if (uc.includes('\u65f6\u95f4\u8f74') || uc.includes('\u9884\u4f30')) return { ...msg, label: '\u65f6\u95f4\u8f74' }
      if (uc.includes('\u601d\u7ef4\u5bfc\u56fe') || uc.includes('\u9006\u5411')) return { ...msg, label: '\u601d\u7ef4\u5bfc\u56fe' }
      return { ...msg, label: `\u8f93\u51fa ${idx + 1}` }
    })
  }, [messages])"""

# New block - detect by assistant output content (more reliable)
new_block = """  const allAssistantMsgs = useMemo(() => {
    const assistantMsgs = messages.filter((m) => m.role === 'assistant')
    return assistantMsgs.map((msg, idx) => {
      if (idx === 0) return { ...msg, label: '\u0050\u0052\u0044\u0020\u6587\u6863' }
      const ac = msg.content || ''
      // Detect by assistant output content pattern
      if (ac.includes('```typescript') || ac.includes('```sql') || ac.includes('\u9879\u76ee\u76ee\u5f55\u7ed3\u6784')) {
        return { ...msg, label: '\u4ee3\u7801\u9aa8\u67b6' }
      }
      if (ac.includes('```json') && ac.includes('"completeness"')) {
        return { ...msg, label: '\u8bc4\u5206\u7ed3\u679c' }
      }
      if (ac.includes('```mermaid') && ac.includes('gantt')) {
        return { ...msg, label: '\u65f6\u95f4\u8f74' }
      }
      // Check user prompt for additional hints
      const msgIndex = messages.indexOf(msg)
      const prevUserMsg = [...messages.slice(0, msgIndex)].reverse().find((m) => m.role === 'user')
      const uc = prevUserMsg?.content || ''
      if (uc.includes('\u7cbe\u4fee')) return { ...msg, label: '\u7cbe\u4fee' }
      if (uc.includes('\u5ba1\u9605')) return { ...msg, label: '\u5ba1\u9605' }
      if (uc.includes('\u9006\u5411') || uc.includes('\u601d\u7ef4\u5bfc\u56fe')) return { ...msg, label: '\u601d\u7ef4\u5bfc\u56fe' }
      return { ...msg, label: `\u8f93\u51fa ${idx + 1}` }
    })
  }, [messages])"""

if old_block in content:
    content = content.replace(old_block, new_block)
    with open(r"D:\code\transfor-prd\src\pages\RunPage.tsx", "w", encoding="utf-8", newline='\n') as f:
        f.write(content)
    print("OK - labels fixed")
else:
    print("BLOCK NOT FOUND - searching...")
    idx = content.find("allAssistantMsgs")
    if idx >= 0:
        snippet = content[idx:idx+800]
        for i, ch in enumerate(snippet):
            if ord(ch) > 127:
                print(f"  char at {i}: U+{ord(ch):04X}")