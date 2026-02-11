'use client'

import { Calendar, Users, MessageSquareQuote, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SourceMeeting } from './types'

interface ContextCardContextProps {
  sourceMeeting?: SourceMeeting
  reason?: string
  onMeetingClick?: (meetingId: string) => void
}

export function ContextCardContext({
  sourceMeeting,
  reason,
  onMeetingClick,
}: ContextCardContextProps) {
  if (!sourceMeeting && !reason) {
    return null
  }

  return (
    <div className="space-y-3">
      {/* 섹션 헤더 */}
      <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
        <span className="text-base">📍</span>
        맥락 (Context)
      </h3>

      {/* 출처 미팅 */}
      {sourceMeeting && (
        <div className="rounded-lg border border-border/50 bg-secondary/30 p-4 space-y-3">
          {/* 미팅 헤더 */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-500" />
                <span className="font-mono text-xs text-muted-foreground">
                  {sourceMeeting.code}
                </span>
                <span className="font-medium">{sourceMeeting.title}</span>
              </div>
              <p className="text-sm text-muted-foreground pl-6">
                {sourceMeeting.date}
              </p>
            </div>
          </div>

          {/* 참석자 */}
          {sourceMeeting.participants.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>참석자:</span>
              </div>
              <div className="flex flex-wrap gap-2 pl-6">
                {sourceMeeting.participants.map((participant) => (
                  <div
                    key={participant.id}
                    className="flex items-center gap-1.5 text-sm"
                  >
                    <div className="h-6 w-6 rounded-full bg-secondary flex items-center justify-center text-xs">
                      {participant.name[0]}
                    </div>
                    <span>{participant.name}</span>
                    {participant.role && (
                      <span className="text-muted-foreground">
                        ({participant.role})
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 관련 발화 */}
          {sourceMeeting.relatedQuote && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MessageSquareQuote className="h-4 w-4" />
                <span>관련 발화:</span>
              </div>
              <blockquote className="pl-6 border-l-2 border-teal-500/50 text-sm italic">
                &ldquo;{sourceMeeting.relatedQuote}&rdquo;
                {sourceMeeting.quotedBy && (
                  <span className="text-muted-foreground not-italic">
                    {' '}- {sourceMeeting.quotedBy}
                  </span>
                )}
              </blockquote>
            </div>
          )}

          {/* 미팅 상세 보기 버튼 */}
          <Button
            variant="ghost"
            size="sm"
            className="text-teal-400 hover:text-teal-300"
            onClick={() => onMeetingClick?.(sourceMeeting.id)}
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            미팅 상세 보기
          </Button>
        </div>
      )}

      {/* 결정 사유 (미팅 없을 때) */}
      {!sourceMeeting && reason && (
        <div className="rounded-lg border border-border/50 bg-secondary/30 p-4">
          <p className="text-sm">{reason}</p>
        </div>
      )}
    </div>
  )
}
