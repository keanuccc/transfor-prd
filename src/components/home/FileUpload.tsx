import { useRef, useCallback, useState } from 'react'
import { Upload, X, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const MAX_FILE_SIZE_MB = 5
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

interface FileUploadProps {
  file: File | null
  fileContent: string
  error: string | null
  onFileSelect: (file: File) => void
  onClear: () => void
}

export function FileUpload({ file, fileContent, error, onFileSelect, onClear }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleFile = useCallback(
    (f: File) => {
      if (f.size > MAX_FILE_SIZE_BYTES) {
        return
      }
      onFileSelect(f)
    },
    [onFileSelect],
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
      const f = e.dataTransfer.files[0]
      if (f) handleFile(f)
    },
    [handleFile],
  )

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0]
      if (f) handleFile(f)
    },
    [handleFile],
  )

  if (file && fileContent) {
    return (
      <div className="flex items-center gap-3 rounded-lg border bg-muted/30 px-4 py-3">
        <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{file.name}</p>
          <p className="text-xs text-muted-foreground">
            {file.size >= 1024 * 1024
              ? `${(file.size / 1024 / 1024).toFixed(1)} MB`
              : `${(file.size / 1024).toFixed(1)} KB`}
          </p>
        </div>
        <Button variant="ghost" size="icon-xs" className="shrink-0" onClick={onClear}>
          <X className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <div>
      <div
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-6 py-8 transition-colors',
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-muted-foreground/40 hover:bg-muted/10',
        )}
        onDragEnter={onDragEnter}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
      >
        <Upload className={cn('h-8 w-8', isDragging ? 'text-primary' : 'text-muted-foreground/50')} />
        <p className="text-sm text-muted-foreground">
          拖拽 Markdown 文件到此处，或点击上传
        </p>
        <p className="text-xs text-muted-foreground/60">
          支持 .md / .markdown 格式，最大 {MAX_FILE_SIZE_MB}MB
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".md,.markdown"
        className="hidden"
        onChange={onInputChange}
      />
      {error && <p className="mt-1.5 text-xs text-destructive">{error}</p>}
    </div>
  )
}
