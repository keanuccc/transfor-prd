import { marked } from 'marked'

export type PlatformType = 'notion' | 'feishu' | 'yuque'

export interface PlatformConfig {
  type: PlatformType
  token: string
  // Notion-specific
  notionParentId?: string
  // Feishu-specific
  feishuFolderToken?: string
  // Yuque-specific
  yuqueNamespace?: string
}

marked.setOptions({ gfm: true, breaks: false })

function mdToHtml(md: string): string {
  try {
    return marked.parse(md) as string
  } catch {
    return `<pre>${md}</pre>`
  }
}

async function pushToNotion(title: string, content: string, config: PlatformConfig): Promise<string> {
  const html = mdToHtml(content)
  const parentId = config.notionParentId || ''

  const blocks = html.split(/(?=<h[1-4][>\s])/).filter(Boolean).map((block) => {
    const isHeading = block.match(/^<h([1-4])[^>]*>(.+?)<\/h[1-4]>$/)
    if (isHeading) {
      return {
        object: 'block',
        type: `heading_${isHeading[1]}`,
        [`heading_${isHeading[1]}`]: {
          rich_text: [{ type: 'text', text: { content: isHeading[2].replace(/<[^>]+>/g, '') } }],
        },
      }
    }
    return {
      object: 'block',
      type: 'paragraph',
      paragraph: {
        rich_text: [{ type: 'text', text: { content: block.replace(/<[^>]+>/g, '').slice(0, 2000) } }],
      },
    }
  })

  const body: Record<string, unknown> = {
    parent: parentId ? { page_id: parentId } : { type: 'workspace', workspace: true },
    properties: {
      title: [{ type: 'text', text: { content: title } }],
    },
    children: blocks.slice(0, 100),
  }

  const resp = await fetch('https://api.notion.com/v1/pages', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.token}`,
      'Content-Type': 'application/json',
      'Notion-Version': '2022-06-28',
    },
    body: JSON.stringify(body),
  })

  if (!resp.ok) {
    const err = await resp.text().catch(() => 'Unknown error')
    throw new Error(`Notion API: ${resp.status} ${err}`)
  }

  const data = await resp.json()
  return data.url || `https://notion.so/${data.id}`
}

export async function pushToPlatform(
  title: string,
  content: string,
  config: PlatformConfig,
): Promise<{ url: string } | null> {
  if (config.type === 'notion') {
    const url = await pushToNotion(title, content, config)
    return { url }
  }

  // Feishu and Yuque don't support direct API push from the browser.
  // Return null to signal the caller should fall back to clipboard copy.
  return null
}

export function getPlatformContent(title: string, content: string, type: PlatformType): string {
  switch (type) {
    case 'feishu':
      return `# ${title}\n\n${content}\n\n---\n粘贴到飞书文档即可`
    case 'yuque':
      return `# ${title}\n\n${content}`
    case 'notion':
      return content
  }
}
