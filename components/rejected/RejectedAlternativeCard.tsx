'use client'

import { Calendar, Link as LinkIcon, MessageSquare, User, XCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RejectedAlternative } from './types'

interface RejectedAlternativeCardProps {
  item: RejectedAlternative
  onViewMeeting?: (meetingId: string) => void
  onViewDecision?: (decisionId: string) => void
}

export function RejectedAlternativeCard({
  item,
  onViewMeeting,
  onViewDecision,
}: RejectedAlternativeCardProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="card-soft border-l-4 border-l-red-500 p-4 space-y-3">
      {/* 헤더 */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
            <XCircle className="h-4 w-4 text-red-500" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{item.title}</h3>
            {item.proposedBy && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                <User className="h-3 w-3" />
                <span>{item.proposedBy} 제안</span>
              </div>
            )}
          </div>
        </div>
        <Badge variant="outline" className="text-red-500 border-red-500/30 bg-red-500/10 shrink-0">
          기각됨
        </Badge>
      </div>

      {/* 설명 */}
      {item.description && (
        <p className="text-sm text-muted-foreground">{item.description}</p>
      )}

      {/* 기각 사유 - 강조 표시 */}
      <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/20">
        <div className="flex items-start gap-2">
          <MessageSquare className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
          <div>
            <span className="text-xs font-medium text-red-500 block mb-1">기각 사유</span>
            <p className="text-sm text-foreground">{item.rejectionReason}</p>
          </div>
        </div>
      </div>

      {/* 메타 정보 */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          <span>{formatDate(item.rejectedAt)}</span>
        </div>
        {item.keywords && item.keywords.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap">
            {item.keywords.slice(0, 3).map((keyword, i) => (
              <Badge key={i} variant="secondary" className="text-xs px-1.5 py-0">
                {keyword}
              </Badge>
            ))}
            {item.keywords.length > 3 && (
              <span className="text-muted-foreground">+{item.keywords.length - 3}</span>
            )}
          </div>
        )}
      </div>

      {/* 연결된 미팅/결정 링크 */}
      {(item.meeting || item.decision) && (
        <div className="flex items-center gap-2 pt-2 border-t border-border">
          {item.meeting && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1.5"
              onClick={() => onViewMeeting?.(item.meetingId!)}
            >
              <LinkIcon className="h-3 w-3" />
              {item.meeting.code}: {item.meeting.title}
            </Button>
          )}
          {item.decision && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1.5"
              onClick={() => onViewDecision?.(item.decisionId!)}
            >
              <LinkIcon className="h-3 w-3" />
              {item.decision.code}: {item.decision.title}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
