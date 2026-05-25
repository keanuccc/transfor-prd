import { useRef, useCallback, useState } from 'react'
import { Upload, X, FileText, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const MAX_FILE_SIZE_MB = 5
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

export interface FileItem {
  file: File
  content: string
  error: string | null
}

interface FileUploadProps {
  files: FileItem[]
  multiple?: boolean
  onFilesChange: (files: FileItem[]) => void
}

async function readFile(f: File): Promise<FileItem> {
  try {
    const content = await f.text()
    return { file: f, content, error: null }
  } catch {
    return { file: f, content: '', error: '文件读取失败' }
  }
}

export function FileUpload({ files, multiple = false, onFilesChange }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleFiles = useCallback(
    async (newFiles: FileList | File[]) => {
      const arr = Array.from(newFiles)
      const valid: File[] = []
      for (const f of arr) {
        if (f.size > MAX_FILE_SIZE_BYTES) continue
        valid.push(f)
      }
      if (valid.length === 0) return

      const items = await Promise.all(valid.map(readFile))
      if (multiple) {
        onFilesChange([...files, ...items])
      } else {
        onFilesChange(items.slice(0, 1))
      }
    },
    [files, multiple, onFilesChange],
  )

  const removeFile = useCallback(
    (index: number) => {
      onFilesChange(files.filter((_, i) => i !== index))
    },
    [files, onFilesChange],
  )

  const onDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.currentTarget === e.target) {
      setIsDragging(false)
    }
  }, [])

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)
      if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files)
    },
    [handleFiles],
  )

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFiles(e.target.files)
        // Reset so the same file can be re-selected
        e.target.value = ''
      }
    },
    [handleFiles],
  )

  const fileList = (
    <div className="space-y-2">
      {files.map((item, i) => (
        <div key={`${item.file.name}-${i}`} className="flex items-center gap-3 rounded-lg border bg-muted/30 px-4 py-3">
          <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{item.file.name}</p>
            <p className="text-xs text-muted-foreground">
              {item.file.size >= 1024 * 1024
                ? `${(item.file.size / 1024 / 1024).toFixed(1)} MB`
                : `${(item.file.size / 1024).toFixed(1)} KB`}
              {item.error && <span className="ml-2 text-destructive">{item.error}</span>}
            </p>
          </div>
          <Button variant="ghost" size="icon-xs" className="shrink-0" onClick={() => removeFile(i)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  )

  return (
    <div>
      {files.length > 0 && fileList}

      <div
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-2.5 rounded-2xl border-2 border-dashed px-6 transition-all duration-300',
          files.length > 0 ? 'py-3' : 'py-4',
          isDragging
            ? 'border-primary/40 bg-primary/[0.04] scale-[1.01]'
            : 'border-muted-foreground/15 hover:border-primary/30 hover:bg-primary/[0.03]',
        )}
        onDragEnter={onDragEnter}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
      >
        {files.length === 0 ? (
          <>
            <Upload className={cn('h-8 w-8 transition-colors', isDragging ? 'text-primary' : 'text-muted-foreground/40')} />
            <p className="text-sm text-muted-foreground">
              拖拽 Markdown 文件到此处，或点击上传
            </p>
            <p className="text-xs text-muted-foreground/60">
              支持 .md / .markdown 格式，最大 {MAX_FILE_SIZE_MB}MB{multiple ? '，可多选' : ''}
            </p>
          </>
        ) : (
          multiple ? (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Plus className="h-3.5 w-3.5" />
              添加更多文件
            </div>
          ) : null
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".md,.markdown"
        className="hidden"
        multiple={multiple}
        onChange={onInputChange}
      />
    </div>
  )
}
