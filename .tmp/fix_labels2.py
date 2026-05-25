with open(r"D:\code\transfor-prd\src\pages\RunPage.tsx", "rb") as f:
    content = f.read()

idx = content.find(b"allAssistantMsgs")
if idx >= 0:
    snippet = content[idx:idx+1200]
    # Print hex around position
    for i in range(0, len(snippet), 16):
        hex_str = " ".join(f"{b:02X}" for b in snippet[i:i+16])
        print(f"{i:04X}: {hex_str}")