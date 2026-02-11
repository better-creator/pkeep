'use client'

import { AlertTriangle, ExternalLink, CheckCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ConflictItem } from './types'
import { cn } from '@/lib/utils'

interface ContextCardConflictsProps {
  conflicts: ConflictItem[]
  onConflictClick?: (conflict: ConflictItem) => void
}

export function ContextCardConflicts({
  conflicts,
  onConflictClick,
}: ContextCardConflictsProps) {
  return (
    <div className="space-y-3">
      {/* 섹션 헤더 */}
      <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
        <span className="text-base">⚠️</span>
        관련 충돌
      </h3>

      {conflicts.length === 0 ? (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span className="text-sm text-green-400">
            이 결정과 유사/충돌하는 과거 결정 없음
          </span>
        </div>
      ) : (
        <div className="space-y-2">
          {conflicts.map((conflict) => {
            const isHighSimilarity = conflict.similarity >= 0.8

            return (
              <button
                key={conflict.id}
                onClick={() => onConflictClick?.(conflict)}
                className={cn(
                  "w-full flex items-start gap-3 p-3 rounded-lg border text-left transition-colors group",
                  conflict.type === 'conflict'
                    ? "bg-red-500/10 border-red-500/30 hover:bg-red-500/20"
                    : isHighSimilarity
                    ? "bg-amber-500/10 border-amber-500/30 hover:bg-amber-500/20"
                    : "bg-yellow-500/10 border-yellow-500/30 hover:bg-yellow-500/20"
                )}
              >
                <AlertTriangle
                  className={cn(
                    "h-4 w-4 mt-0.5 shrink-0",
                    conflict.type === 'conflict'
                      ? "text-red-400"
                      : isHighSimilarity
                      ? "text-amber-400"
                      : "text-yellow-400"
                  )}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">
                      {conflict.code}
                    </span>
                    <span className="font-medium truncate">{conflict.title}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">
                      {conflict.date}
                    </span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs",
                        conflict.type === 'conflict'
                          ? "text-red-400 border-red-500/30"
                          : isHighSimilarity
                          ? "text-amber-400 border-amber-500/30"
                          : "text-yellow-400 border-yellow-500/30"
                      )}
                    >
                      {conflict.type === 'conflict' ? '충돌' : `유사도 ${Math.round(conflict.similarity * 100)}%`}
                    </Badge>
                  </div>
                </div>
                <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1" />
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
