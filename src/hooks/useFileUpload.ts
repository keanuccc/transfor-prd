import { useState, useCallback } from 'react'
import { SUPPORTED_FILE_EXTENSIONS } from '@/lib/constants'

export function useFileUpload() {
  const [file, setFile] = useState<File | null>(null)
  const [fileContent, setFileContent] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  const validateAndRead = useCallback((f: File): Promise<string> => {
    const ext = '.' + f.name.split('.').pop()?.toLowerCase()
    if (!SUPPORTED_FILE_EXTENSIONS.includes(ext)) {
      throw new Error('请上传 Markdown 格式的文件（.md 或 .markdown）')
    }
    return f.text()
  }, [])

  const handleFile = useCallback(
    async (f: File) => {
      setError(null)
      try {
        const content = await validateAndRead(f)
        setFile(f)
        setFileContent(content)
      } catch (err) {
        setError(err instanceof Error ? err.message : '文件读取失败')
        setFile(null)
        setFileContent('')
      }
    },
    [validateAndRead],
  )

  const clearFile = useCallback(() => {
    setFile(null)
    setFileContent('')
    setError(null)
  }, [])

  return { file, fileContent, error, handleFile, clearFile }
}
