'use client'

import { AlertTriangle, ChevronRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface ConflictWarningItem {
  id: string
  code: string
  title: string
  similarity: number
  date?: string
}

interface ConflictWarningProps {
  isLoading?: boolean
  conflicts: ConflictWarningItem[]
  onViewDetails: (conflict: ConflictWarningItem) => void
  onViewAll?: () => void
}

export function ConflictWarning({
  isLoading,
  conflicts,
  onViewDetails,
  onViewAll,
}: ConflictWarningProps) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary/50 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>유사 결정 확인 중...</span>
      </div>
    )
  }

  if (conflicts.length === 0) {
    return null
  }

  const topConflict = conflicts[0]
  const hasMore = conflicts.length > 1

  return (
    <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 space-y-2">
      <div className="flex items-start gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-amber-500">
            유사한 결정이 있습니다
          </div>
          <div className="text-sm mt-1">
            <span className="font-mono text-muted-foreground">{topConflict.code}</span>
            {' '}
            <span className="font-medium">&quot;{topConflict.title}&quot;</span>
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            {topConflict.date && <span>{topConflict.date}</span>}
            <span className="text-amber-500 font-medium">
              유사도 {Math.round(topConflict.similarity * 100)}%
            </span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="shrink-0 h-7 text-xs gap-1 text-amber-500 hover:text-amber-400 hover:bg-amber-500/10"
          onClick={() => onViewDetails(topConflict)}
        >
          자세히
          <ChevronRight className="h-3 w-3" />
        </Button>
      </div>

      {hasMore && onViewAll && (
        <div className="pt-2 border-t border-amber-500/20">
          <Button
            variant="ghost"
            size="sm"
            className="w-full h-7 text-xs text-muted-foreground hover:text-foreground"
            onClick={onViewAll}
          >
            외 {conflicts.length - 1}건 더 보기
          </Button>
        </div>
      )}
    </div>
  )
}
