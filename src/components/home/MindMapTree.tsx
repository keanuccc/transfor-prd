import { useState, useMemo } from 'react'
import { ChevronRight, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TreeNode {
  text: string
  depth: number
  children: TreeNode[]
  fullText: string
}

interface MindMapTreeProps {
  content: string
  selectedPaths: Set<string>
  onSelectedPathsChange: (paths: Set<string>) => void
}

function parseTree(content: string): TreeNode[] {
  const lines = content.split('\n').filter((l) => l.trim())
  if (lines.length === 0) return []

  const parsed: { text: string; depth: number }[] = []
  for (const line of lines) {
    const match = line.match(/^(\s*)- (.+)/)
    if (match) {
      const leading = match[1]
      const depth = leading.length
      parsed.push({ text: match[2].trim(), depth })
    }
  }

  if (parsed.length === 0) return []

  // Normalize depths to start from 0
  const minDepth = Math.min(...parsed.map((p) => p.depth))
  const normalized = parsed.map((p) => ({ text: p.text, depth: p.depth - minDepth }))

  function buildTree(items: typeof normalized, parentDepth: number): TreeNode[] {
    const result: TreeNode[] = []
    let i = 0
    while (i < items.length) {
      const item = items[i]
      if (item.depth === parentDepth) {
        // Collect all following items with greater depth as children
        let j = i + 1
        while (j < items.length && items[j].depth > parentDepth) j++
        const childrenItems = items.slice(i + 1, j)
        const children = buildTree(
          childrenItems,
          parentDepth + 1,
        )
        // Build fullText by joining children's content
        const childTexts = children.map((c) => c.fullText)
        const fullText = childTexts.length > 0
          ? `- ${item.text}\n${childTexts.join('\n')}`
          : `- ${item.text}`
        result.push({
          text: item.text,
          depth: 0,
          children,
          fullText,
        })
        i = j
      } else {
        i++
      }
    }
    return result
  }

  return buildTree(normalized, 0)
}

function collectAllPaths(nodes: TreeNode[]): Set<string> {
  const paths = new Set<string>()
  function walk(nodes: TreeNode[]) {
    for (const node of nodes) {
      paths.add(node.fullText)
      walk(node.children)
    }
  }
  walk(nodes)
  return paths
}

function TreeNodeItem({
  node,
  selectedPaths,
  onToggle,
  depth,
}: {
  node: TreeNode
  selectedPaths: Set<string>
  onToggle: (path: string, checked: boolean) => void
  depth: number
}) {
  const [expanded, setExpanded] = useState(true)
  const hasChildren = node.children.length > 0
  const isSelected = selectedPaths.has(node.fullText)

  const handleCheck = () => {
    onToggle(node.fullText, !isSelected)
  }

  const handleExpand = (e: React.MouseEvent) => {
    e.stopPropagation()
    setExpanded((p) => !p)
  }

  return (
    <div className="select-none">
      <div
        className={cn(
          'flex items-center gap-1 rounded px-1.5 py-0.5 text-[13px] transition-colors hover:bg-muted/60 cursor-pointer',
          isSelected && 'bg-primary/10'
        )}
        style={{ paddingLeft: `${depth * 16 + 4}px` }}
        onClick={handleCheck}
      >
        {hasChildren ? (
          <button
            onClick={handleExpand}
            className="flex size-4 shrink-0 items-center justify-center rounded text-muted-foreground hover:text-foreground"
          >
            {expanded ? <ChevronDown className="size-3" /> : <ChevronRight className="size-3" />}
          </button>
        ) : (
          <span className="w-4 shrink-0" />
        )}
        <input
          type="checkbox"
          checked={isSelected}
          onChange={handleCheck}
          className="size-3.5 rounded border-border/60 text-primary cursor-pointer"
        />
        <span className="truncate text-foreground/80">{node.text}</span>
      </div>
      {hasChildren && expanded && (
        <div>
          {node.children.map((child, i) => (
            <TreeNodeItem
              key={`${child.text}-${i}`}
              node={child}
              selectedPaths={selectedPaths}
              onToggle={onToggle}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function MindMapTree({ content, selectedPaths, onSelectedPathsChange }: MindMapTreeProps) {
  const tree = useMemo(() => parseTree(content), [content])
  const [selectAll, setSelectAll] = useState(false)

  const handleToggle = (path: string, checked: boolean) => {
    const next = new Set(selectedPaths)
    if (checked) {
      next.add(path)
    } else {
      next.delete(path)
    }
    onSelectedPathsChange(next)
  }

  const handleSelectAll = () => {
    if (selectAll) {
      onSelectedPathsChange(new Set())
      setSelectAll(false)
    } else {
      onSelectedPathsChange(collectAllPaths(tree))
      setSelectAll(true)
    }
  }

  if (tree.length === 0) return null

  return (
    <div className="rounded-lg border border-border/40 bg-muted/20 p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">
          选择生成范围（默认全选）
        </p>
        <button
          onClick={handleSelectAll}
          className="text-[11px] text-primary hover:underline"
        >
          {selectAll ? '取消全选' : '全选'}
        </button>
      </div>
      <div className="max-h-[200px] overflow-auto">
        {tree.map((node, i) => (
          <TreeNodeItem
            key={`${node.text}-${i}`}
            node={node}
            selectedPaths={selectedPaths}
            onToggle={handleToggle}
            depth={0}
          />
        ))}
      </div>
    </div>
  )
}
