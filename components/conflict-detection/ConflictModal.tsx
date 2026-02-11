'use client'

import { useState } from 'react'
import {
  AlertTriangle,
  Calendar,
  Users,
  ExternalLink,
  ArrowRight,
  X,
  Check,
  GitBranch,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export interface ConflictItem {
  id: string
  code: string
  title: string
  description: string
  similarity: number
  status: string
  meeting?: {
    id: string
    title: string
    date: string
  }
  participants: string[]
}

interface ConflictModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  newDecision: {
    title: string
    description?: string
  }
  conflicts: ConflictItem[]
  onProceed: () => void  // 무시하고 진행
  onViewExisting: (conflict: ConflictItem) => void  // 기존 결정 보기
  onCancel: () => void  // 입력 취소
}

export function ConflictModal({
  open,
  onOpenChange,
  newDecision,
  conflicts,
  onProceed,
  onViewExisting,
  onCancel,
}: ConflictModalProps) {
  const [selectedConflict, setSelectedConflict] = useState<ConflictItem | null>(
    conflicts[0] || null
  )

  const getSimilarityColor = (similarity: number) => {
    if (similarity >= 0.9) return 'text-red-500 bg-red-500/10'
    if (similarity >= 0.8) return 'text-amber-500 bg-amber-500/10'
    return 'text-yellow-500 bg-yellow-500/10'
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30">확정</Badge>
      case 'changed':
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/30">변경됨</Badge>
      case 'pending':
        return <Badge variant="outline" className="bg-zinc-500/10 text-zinc-400 border-zinc-500/30">검토중</Badge>
      default:
        return null
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-amber-500">
            <AlertTriangle className="h-5 w-5" />
            유사한 과거 결정이 있습니다
          </DialogTitle>
          <DialogDescription>
            새로 입력한 결정과 유사한 기존 결정이 발견되었습니다. 확인 후 진행해주세요.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {/* 새 결정 */}
          <div className="p-4 rounded-lg bg-secondary/50 border border-border">
            <div className="text-xs text-muted-foreground mb-1">입력한 결정:</div>
            <div className="font-medium">&quot;{newDecision.title}&quot;</div>
            {newDecision.description && (
              <div className="text-sm text-muted-foreground mt-1">
                {newDecision.description}
              </div>
            )}
          </div>

          <div className="flex items-center justify-center">
            <div className="h-px flex-1 bg-border" />
            <span className="px-3 text-xs text-muted-foreground">유사한 과거 결정</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* 충돌 목록 */}
          <div className="space-y-3">
            {conflicts.map((conflict) => (
              <div
                key={conflict.id}
                className={`p-4 rounded-lg border transition-all cursor-pointer ${
                  selectedConflict?.id === conflict.id
                    ? 'bg-primary/5 border-primary/50 ring-1 ring-primary/30'
                    : 'bg-card border-border hover:border-primary/30'
                }`}
                onClick={() => setSelectedConflict(conflict)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <GitBranch className="h-4 w-4 text-teal-500 shrink-0" />
                      <span className="font-mono text-sm text-muted-foreground">
                        {conflict.code}
                      </span>
                      {getStatusBadge(conflict.status)}
                    </div>
                    <div className="font-medium truncate">&quot;{conflict.title}&quot;</div>
                  </div>
                  <div className={`px-2 py-1 rounded text-sm font-medium ${getSimilarityColor(conflict.similarity)}`}>
                    {Math.round(conflict.similarity * 100)}%
                  </div>
                </div>

                {/* 상세 정보 (선택 시) */}
                {selectedConflict?.id === conflict.id && (
                  <div className="mt-4 pt-4 border-t border-border space-y-3">
                    {conflict.meeting && (
                      <div className="flex items-start gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                        <div>
                          <span className="text-muted-foreground">연결된 미팅: </span>
                          <span className="font-medium">{conflict.meeting.title}</span>
                          <span className="text-muted-foreground"> ({conflict.meeting.date})</span>
                        </div>
                      </div>
                    )}

                    {conflict.participants.length > 0 && (
                      <div className="flex items-start gap-2 text-sm">
                        <Users className="h-4 w-4 text-purple-500 mt-0.5 shrink-0" />
                        <div>
                          <span className="text-muted-foreground">참석자: </span>
                          <span>{conflict.participants.join(', ')}</span>
                        </div>
                      </div>
                    )}

                    {conflict.description && (
                      <div className="p-3 rounded bg-secondary/50 text-sm">
                        <div className="text-muted-foreground mb-1">사유:</div>
                        &quot;{conflict.description}&quot;
                      </div>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-2"
                      onClick={(e) => {
                        e.stopPropagation()
                        onViewExisting(conflict)
                      }}
                    >
                      <ExternalLink className="h-4 w-4" />
                      기존 결정 상세 보기
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="flex-shrink-0 gap-2 sm:gap-2">
          <Button variant="ghost" onClick={onCancel} className="gap-2">
            <X className="h-4 w-4" />
            입력 취소
          </Button>
          <Button
            variant="outline"
            onClick={() => selectedConflict && onViewExisting(selectedConflict)}
            disabled={!selectedConflict}
            className="gap-2"
          >
            기존 결정 보기
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button onClick={onProceed} className="gap-2">
            <Check className="h-4 w-4" />
            무시하고 진행
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
