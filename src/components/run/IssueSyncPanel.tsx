import { useState } from 'react'
import { Bug, ExternalLink, Loader2, CheckCircle, Copy, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import {
  parsePrdToIssues,
  pushIssues,
  type ParsedIssue,
  type IssueTrackerType,
  type IssueTrackerConfig,
} from '@/services/issueTrackers'

interface IssueSyncPanelProps {
  content: string
  onClose: () => void
}

function formatIssuesAsMarkdown(issues: ParsedIssue[]): string {
  return issues
    .filter((i) => i.selected)
    .map((i) => `- [ ] **${i.title}** (${i.priority})\n  ${i.description}`)
    .join('\n\n')
}

export function IssueSyncPanel({ content, onClose }: IssueSyncPanelProps) {
  const [issues, setIssues] = useState<ParsedIssue[]>(() => parsePrdToIssues(content))
  const [tracker, setTracker] = useState<IssueTrackerType>('linear')
  const [token, setToken] = useState('')
  const [linearTeamId, setLinearTeamId] = useState('')
  const [jiraDomain, setJiraDomain] = useState('')
  const [jiraProjectKey, setJiraProjectKey] = useState('')
  const [jiraEmail, setJiraEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ pushed: number; total: number } | null>(null)

  const toggleIssue = (index: number) => {
    setIssues((prev) =>
      prev.map((item, i) => (i === index ? { ...item, selected: !item.selected } : item)),
    )
  }

  const setPriority = (index: number, priority: ParsedIssue['priority']) => {
    setIssues((prev) =>
      prev.map((item, i) => (i === index ? { ...item, priority } : item)),
    )
  }

  const selectedCount = issues.filter((i) => i.selected).length

  const handleParse = () => {
    setIssues(parsePrdToIssues(content))
    setResult(null)
  }

  const handlePush = async () => {
    if (!token.trim()) return
    setLoading(true)
    setResult(null)
    const config: IssueTrackerConfig = {
      type: tracker,
      token: token.trim(),
      linearTeamId: linearTeamId.trim() || undefined,
      jiraDomain: jiraDomain.trim() || undefined,
      jiraProjectKey: jiraProjectKey.trim() || undefined,
      jiraEmail: jiraEmail.trim() || undefined,
    }
    try {
      const pushed = await pushIssues(issues, config)
      setResult({ pushed, total: selectedCount })
      toast.success(`成功推送 ${pushed}/${selectedCount} 个 Issue`)
    } catch (err) {
      // Fallback: copy as markdown checklist
      toast.error(err instanceof Error ? err.message : '推送失败，已复制 Issue 列表到剪贴板')
      try {
        await navigator.clipboard.writeText(formatIssuesAsMarkdown(issues))
      } catch { /* ignore */ }
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formatIssuesAsMarkdown(issues))
      toast.success('Issue 列表已复制到剪贴板')
    } catch {
      toast.error('复制失败')
    }
  }

  return (
    <div className="flex h-full w-72 shrink-0 flex-col border-l border-border/40 bg-muted/10">
      <div className="flex items-center justify-between border-b border-border/30 px-3 py-2">
        <div className="flex items-center gap-1.5">
          <Bug className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-medium">Issue 同步</span>
        </div>
        <Button variant="ghost" size="icon-xs" onClick={onClose}>
          <X className="h-3 w-3" />
        </Button>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="p-2.5 space-y-2">
          <div className="space-y-1">
            <Label className="text-[11px]">目标平台</Label>
            <Select value={tracker} onValueChange={(v) => setTracker(v as IssueTrackerType)}>
              <SelectTrigger className="h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="linear">Linear</SelectItem>
                <SelectItem value="jira">Jira</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-[11px]">API Token</Label>
            <Input
              type="password"
              placeholder={tracker === 'linear' ? 'Linear API Key' : 'Jira API Token'}
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="h-7 text-xs"
            />
          </div>

          {tracker === 'linear' && (
            <div className="space-y-1">
              <Label className="text-[11px]">Team ID</Label>
              <Input
                placeholder="Linear Team ID"
                value={linearTeamId}
                onChange={(e) => setLinearTeamId(e.target.value)}
                className="h-7 text-xs"
              />
            </div>
          )}

          {tracker === 'jira' && (
            <>
              <div className="space-y-1">
                <Label className="text-[11px]">Jira Domain</Label>
                <Input
                  placeholder="https://your-domain.atlassian.net"
                  value={jiraDomain}
                  onChange={(e) => setJiraDomain(e.target.value)}
                  className="h-7 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px]">Email</Label>
                <Input
                  placeholder="your@email.com"
                  value={jiraEmail}
                  onChange={(e) => setJiraEmail(e.target.value)}
                  className="h-7 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px]">Project Key</Label>
                <Input
                  placeholder="PROJ"
                  value={jiraProjectKey}
                  onChange={(e) => setJiraProjectKey(e.target.value)}
                  className="h-7 text-xs"
                />
              </div>
            </>
          )}

          {result && (
            <div className="flex items-center gap-2 rounded-lg bg-green-50 dark:bg-green-950/20 p-2 text-xs">
              <CheckCircle className="h-3.5 w-3.5 text-green-600 shrink-0" />
              <span>已推送 {result.pushed}/{result.total} 个 Issue</span>
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-muted-foreground">
              {issues.length} 个功能点，{selectedCount} 个选中
            </span>
            <Button variant="ghost" size="icon-xs" onClick={handleParse} title="重新解析">
              <Loader2 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <div className="border-t border-border/30 px-2 py-1.5 space-y-1">
          {issues.map((issue, i) => (
            <div
              key={i}
              className={`rounded border p-2 text-xs cursor-pointer transition-colors ${
                issue.selected
                  ? 'border-primary/30 bg-primary/5'
                  : 'border-border/30 bg-background/50 opacity-60'
              }`}
              onClick={() => toggleIssue(i)}
            >
              <div className="flex items-start gap-1.5">
                <input
                  type="checkbox"
                  checked={issue.selected}
                  onChange={() => toggleIssue(i)}
                  className="mt-0.5 size-3 rounded"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{issue.title}</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground line-clamp-2">{issue.description}</p>
                  <select
                    value={issue.priority}
                    onChange={(e) => {
                      e.stopPropagation()
                      setPriority(i, e.target.value as ParsedIssue['priority'])
                    }}
                    className="mt-1 h-5 rounded border border-border/50 bg-transparent text-[10px] px-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <option value="high">高</option>
                    <option value="medium">中</option>
                    <option value="low">低</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-border/30 p-2 space-y-1.5">
        <Button
          size="sm"
          className="w-full text-xs"
          onClick={handlePush}
          disabled={!token.trim() || selectedCount === 0 || loading}
        >
          {loading ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <ExternalLink className="mr-1 h-3 w-3" />}
          推送 ({selectedCount})
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="w-full text-xs"
          onClick={handleCopy}
          disabled={selectedCount === 0}
        >
          <Copy className="mr-1 h-3 w-3" />
          复制 Issue 列表
        </Button>
      </div>
    </div>
  )
}
