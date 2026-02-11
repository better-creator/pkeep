'use client'

import { HistoryEntry } from './types'

interface ContextCardHistoryProps {
  history: HistoryEntry[]
}

export function ContextCardHistory({ history }: ContextCardHistoryProps) {
  if (history.length === 0) {
    return null
  }

  return (
    <div className="space-y-3">
      {/* 섹션 헤더 */}
      <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
        <span className="text-base">📜</span>
        히스토리
      </h3>

      <div className="relative">
        {/* 타임라인 라인 */}
        <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />

        <div className="space-y-2">
          {history.map((entry) => (
            <div key={entry.id} className="flex items-start gap-3 relative">
              {/* 타임라인 도트 */}
              <div className="h-[15px] w-[15px] rounded-full bg-secondary border-2 border-border shrink-0 z-10" />

              <div className="flex-1 min-w-0 pb-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs text-muted-foreground shrink-0">
                    {entry.date}
                  </span>
                  <span className="text-sm truncate">
                    {entry.action}
                    {entry.actor && (
                      <span className="text-muted-foreground"> - {entry.actor}</span>
                    )}
                  </span>
                </div>
                {entry.details && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {entry.details}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
