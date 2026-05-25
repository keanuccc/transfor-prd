with open(r"D:\code\transfor-prd\src\pages\RunPage.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Fix line 132: keep using .includes() with backtick-safe pattern
# Use \x60 for backtick to avoid parser confusion
old = "if (ac.includes('\u0060\u0060\u0060typescript') || ac.includes('\u0060\u0060\u0060sql') || ac.includes('\u9879\u76ee\u76ee\u5f55\u7ed3\u6784')) {"
new = "if (ac.includes('\u9879\u76ee\u76ee\u5f55\u7ed3\u6784') || ac.includes('\u0060\u0060\u0060typescript') || ac.includes('\u0060\u0060\u0060sql')) {"
if old in content:
    content = content.replace(old, new)
    print("Fixed line 132")
else:
    print("Line 132 pattern not found - checking...")
    idx = content.find("ac.includes(")
    if idx >= 0:
        print(content[idx:idx+200])

# Fix line 135: Python 'in' -> JS .includes()
old135 = "if ('\"completeness\"' in ac) {"
new135 = "if (ac.includes('\"completeness\"')) {"
if old135 in content:
    content = content.replace(old135, new135)
    print("Fixed line 135")
else:
    print("Line 135 not found")

# Fix line 138: Python 'in' -> JS .includes(), avoid triple backtick
old138 = "if ('\u0060\u0060\u0060mermaid' in ac and 'gantt' in ac) {"
# For mermaid, just check for 'mermaid' + 'gantt' (unique enough)
new138 = "if (ac.includes('mermaid') && ac.includes('gantt')) {"
if old138 in content:
    content = content.replace(old138, new138)
    print("Fixed line 138")
else:
    print("Line 138 not found - checking...")
    idx = content.find("mermaid")
    if idx >= 0:
        print(content[max(0,idx-30):idx+50])

with open(r"D:\code\transfor-prd\src\pages\RunPage.tsx", "w", encoding="utf-8", newline='\n') as f:
    f.write(content)
print("Done")