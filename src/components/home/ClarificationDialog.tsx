import { useState, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

interface ClarificationDialogProps {
  open: boolean
  questions: string[]
  loading: boolean
  onConfirm: (answers: string[]) => void
  onSkip: () => void
}

export function ClarificationDialog({ open, questions, loading, onConfirm, onSkip }: ClarificationDialogProps) {
  const [answers, setAnswers] = useState<string[]>([])
  const dismissedRef = useRef(false)

  const handleConfirm = () => {
    dismissedRef.current = true
    onConfirm(answers)
    setAnswers([])
  }

  const handleSkip = () => {
    dismissedRef.current = true
    setAnswers([])
    onSkip()
  }

  const handleOpenChange = (o: boolean) => {
    if (!o && !dismissedRef.current) {
      onSkip()
    }
    dismissedRef.current = false
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {loading ? (
          <>
            <DialogHeader>
              <DialogTitle>分析需求中...</DialogTitle>
              <DialogDescription>
                正在根据思维导图内容生成关键澄清问题
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>需求澄清</DialogTitle>
              <DialogDescription>
                AI 提出了以下问题，回答后将作为补充上下文提高 PRD 质量。也可以跳过直接生成。
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 max-h-[50vh] overflow-auto">
              {questions.map((q, i) => (
                <div key={i} className="space-y-1.5">
                  <p className="text-sm font-medium">{i + 1}. {q}</p>
                  <Textarea
                    placeholder="输入你的回答（可选）..."
                    value={answers[i] || ''}
                    onChange={(e) => {
                      const next = [...answers]
                      next[i] = e.target.value
                      setAnswers(next)
                    }}
                    rows={2}
                    className="resize-none"
                  />
                </div>
              ))}
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={handleSkip}>
                跳过，直接生成
              </Button>
              <Button onClick={handleConfirm}>
                确认并生成
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
