export type IssueTrackerType = 'linear' | 'jira'

export interface IssueTrackerConfig {
  type: IssueTrackerType
  token: string
  linearTeamId?: string
  jiraDomain?: string
  jiraProjectKey?: string
  jiraEmail?: string
}

export interface ParsedIssue {
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  selected: boolean
}

export function parsePrdToIssues(content: string): ParsedIssue[] {
  // Extract feature headers from markdown
  const issues: ParsedIssue[] = []
  const lines = content.split('\n')

  let currentSection = ''
  let currentDescription = ''

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    // Match h2/h3 headers that look like features
    const h2Match = line.match(/^## (.+)/)
    const h3Match = line.match(/^### (.+)/)

    if (h2Match || h3Match) {
      // Save previous section
      if (currentSection && currentDescription) {
        issues.push({
          title: currentSection,
          description: currentDescription.trim(),
          priority: 'medium',
          selected: true,
        })
      }
      currentSection = (h2Match || h3Match)![1]
      currentDescription = ''
    } else if (currentSection && line.trim()) {
      currentDescription += line + '\n'
    }
  }

  // Don't forget the last section
  if (currentSection && currentDescription) {
    issues.push({
      title: currentSection,
      description: currentDescription.trim(),
      priority: 'medium',
      selected: true,
    })
  }

  // If no headers found, treat the whole doc as one issue
  if (issues.length === 0) {
    issues.push({
      title: 'PRD 完整实现',
      description: content.slice(0, 2000),
      priority: 'high',
      selected: true,
    })
  }

  return issues
}

async function pushToLinear(
  issues: ParsedIssue[],
  config: IssueTrackerConfig,
): Promise<number> {
  const selected = issues.filter((i) => i.selected)
  let pushed = 0

  for (const issue of selected) {
    const priorityMap: Record<string, number> = { high: 1, medium: 2, low: 3 }

    const query = `
      mutation IssueCreate {
        issueCreate(input: {
          title: ${JSON.stringify(issue.title)},
          description: ${JSON.stringify(issue.description)},
          priority: ${priorityMap[issue.priority]},
          teamId: ${JSON.stringify(config.linearTeamId || '')}
        }) {
          success
          issue { id url }
        }
      }
    `

    const resp = await fetch('https://api.linear.app/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `${config.token}`,
      },
      body: JSON.stringify({ query }),
    })

    if (resp.ok) {
      pushed++
    }
  }

  return pushed
}

async function pushToJira(
  issues: ParsedIssue[],
  config: IssueTrackerConfig,
): Promise<number> {
  const selected = issues.filter((i) => i.selected)
  const domain = config.jiraDomain?.replace(/\/+$/, '')
  const auth = btoa(`${config.jiraEmail || ''}:${config.token}`)
  let pushed = 0

  for (const issue of selected) {
    const resp = await fetch(`${domain}/rest/api/3/issue`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({
        fields: {
          project: { key: config.jiraProjectKey },
          summary: issue.title,
          description: {
            type: 'doc',
            version: 1,
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: issue.description }],
              },
            ],
          },
          issuetype: { name: 'Task' },
        },
      }),
    })

    if (resp.ok) {
      pushed++
    }
  }

  return pushed
}

export async function pushIssues(
  issues: ParsedIssue[],
  config: IssueTrackerConfig,
): Promise<number> {
  if (config.type === 'linear') {
    return pushToLinear(issues, config)
  }
  if (config.type === 'jira') {
    return pushToJira(issues, config)
  }
  throw new Error(`不支持的平台: ${config.type}`)
}
