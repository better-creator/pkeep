'use client'

import { AlertTriangle, Calendar, Link as LinkIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { RejectedAlternative, ConflictWarningAction } from './types'

interface ConflictWarningModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  rejectedAlternative: RejectedAlternative
  similarity: number
  onAction: (action: ConflictWarningAction) => void
  onViewMeeting?: (meetingId: string) => void
}

export function ConflictWarningModal({
  open,
  onOpenChange,
  rejectedAlternative,
  similarity,
  onAction,
  onViewMeeting,
}: ConflictWarningModalProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const handleAction = (action: ConflictWarningAction) => {
    onAction(action)
    if (action !== 'review') {
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg border-accent/50 bg-accent/5">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
              <AlertTriangle className="h-6 w-6 text-accent" />
            </div>
            <div>
              <DialogTitle className="text-lg">과거에 기각된 안건과 유사합니다</DialogTitle>
              <DialogDescription className="mt-1">
                유사도 {similarity}% 일치
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 기각된 안건 정보 */}
          <div className="p-4 rounded-xl bg-card border border-border">
            <h4 className="font-semibold text-foreground mb-2">
              {rejectedAlternative.title}
            </h4>
            {rejectedAlternative.description && (
              <p className="text-sm text-muted-foreground mb-3">
                {rejectedAlternative.description}
              </p>
            )}

            {/* 기각 사유 강조 */}
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <span className="text-xs font-medium text-red-500 block mb-1">
                과거 기각 사유
              </span>
              <p className="text-sm text-foreground">
                {rejectedAlternative.rejectionReason}
              </p>
            </div>
          </div>

          {/* 메타 정보 */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              <span>기각일: {formatDate(rejectedAlternative.rejectedAt)}</span>
            </div>
            {rejectedAlternative.proposedBy && (
              <span>제안자: {rejectedAlternative.proposedBy}</span>
            )}
          </div>

          {/* 관련 미팅 링크 */}
          {rejectedAlternative.meeting && (
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2"
              onClick={() => onViewMeeting?.(rejectedAlternative.meetingId!)}
            >
              <LinkIcon className="h-4 w-4" />
              관련 미팅 보기: {rejectedAlternative.meeting.code} - {rejectedAlternative.meeting.title}
            </Button>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="ghost"
            onClick={() => handleAction('cancel')}
            className="sm:order-1"
          >
            취소
          </Button>
          <Button
            variant="outline"
            onClick={() => handleAction('review')}
            className="sm:order-2"
          >
            검토하기
          </Button>
          <Button
            variant="default"
            onClick={() => handleAction('ignore')}
            className="sm:order-3 bg-accent hover:bg-accent/90"
          >
            무시하고 진행
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
