'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { AlertTriangle, ArrowLeftRight, CheckCircle2, Pause, XCircle, ShieldOff } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { StoredDecision, StoredRejected } from '@/lib/store/types'
import {
  type Conflict,
  detectConflicts,
  getConflictTypeLabel,
  getSeverityConfig,
  countUnresolved,
} from '@/lib/conflicts'

export default function ConflictsPage() {
  const params = useParams()
  const teamId = params.teamId as string
  const projectId = params.projectId as string

  const [decisions, setDecisions] = useState<StoredDecision[]>([])
  const [rejected, setRejected] = useState<StoredRejected[]>([])
  const [conflicts, setConflicts] = useState<Conflict[]>([])

  // Load data from localStorage
  useEffect(() => {
    const storedDecisions: StoredDecision[] = JSON.parse(localStorage.getItem('pkeep-decisions') || '[]')
    const storedRejected: StoredRejected[] = JSON.parse(localStorage.getItem('pkeep-rejected') || '[]')
    setDecisions(storedDecisions)
    setRejected(storedRejected)

    // Load previously saved conflict resolutions
    const savedConflicts: Conflict[] | null = JSON.parse(localStorage.getItem('pkeep-conflicts') || 'null')

    const detected = detectConflicts(storedDecisions, storedRejected)

    // Merge saved resolution state
    if (savedConflicts) {
      for (const d of detected) {
        const saved = savedConflicts.find(
          s =>
            s.newDecision.id === d.newDecision.id &&
            s.existingDecision.id === d.existingDecision.id &&
            s.type === d.type
        )
        if (saved?.resolved) {
          d.resolved = true
          d.resolution = saved.resolution
        }
      }
    }

    setConflicts(detected)
  }, [])

  const resolveConflict = useCallback(
    (conflictId: string, resolution: 'reject_new' | 'hold' | 'suspend_existing') => {
      setConflicts(prev => {
        const updated = prev.map(c => {
          if (c.id !== conflictId) return c
          return { ...c, resolved: true, resolution }
        })
        // Persist conflict resolution state
        localStorage.setItem('pkeep-conflicts', JSON.stringify(updated))
        return updated
      })

      // Update decision statuses in localStorage
      const conflict = conflicts.find(c => c.id === conflictId)
      if (!conflict) return

      const storedDecisions: StoredDecision[] = JSON.parse(localStorage.getItem('pkeep-decisions') || '[]')

      let updatedDecisions = storedDecisions
      switch (resolution) {
        case 'reject_new': {
          updatedDecisions = storedDecisions.map(d =>
            d.id === conflict.newDecision.id ? { ...d, status: 'rejected' as const } : d
          )
          break
        }
        case 'hold': {
          updatedDecisions = storedDecisions.map(d =>
            d.id === conflict.newDecision.id ? { ...d, status: 'hold' as const } : d
          )
          break
        }
        case 'suspend_existing': {
          updatedDecisions = storedDecisions.map(d => {
            if (d.id === conflict.existingDecision.id) return { ...d, status: 'disabled' as const }
            if (d.id === conflict.newDecision.id) return { ...d, status: 'confirmed' as const }
            return d
          })
          break
        }
      }

      localStorage.setItem('pkeep-decisions', JSON.stringify(updatedDecisions))
      setDecisions(updatedDecisions)
    },
    [conflicts]
  )

  const unresolvedCount = countUnresolved(conflicts)
  const activeConflicts = conflicts.filter(c => c.type !== 'rejected_alternative')
  const rejectedConflicts = conflicts.filter(c => c.type === 'rejected_alternative')

  const findDecision = (id: string) => decisions.find(d => d.id === id)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-stone-800">이슈 감지</h1>
        <p className="text-sm text-stone-500 mt-1">
          결정 간 이슈을 확인하고 해결하세요
        </p>
      </div>

      {/* Summary */}
      <div className="flex items-center gap-4">
        <div className="card-soft px-4 py-3 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-stone-800">{unresolvedCount}</p>
            <p className="text-[11px] text-stone-400">미해결 이슈</p>
          </div>
        </div>
        <div className="card-soft px-4 py-3 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-50">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-stone-800">
              {activeConflicts.filter(c => c.resolved).length}
            </p>
            <p className="text-[11px] text-stone-400">해결됨</p>
          </div>
        </div>
        <div className="card-soft px-4 py-3 flex items-center gap-3">
          <div className="p-2 rounded-xl bg-stone-100">
            <ArrowLeftRight className="h-4 w-4 text-stone-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-stone-800">{activeConflicts.length}</p>
            <p className="text-[11px] text-stone-400">전체 이슈</p>
          </div>
        </div>
      </div>

      {/* Active Conflicts */}
      <div className="space-y-4">
        <h2 className="font-semibold text-stone-700 text-sm">활성 이슈</h2>

        {activeConflicts.length === 0 ? (
          <div className="card-soft p-8 text-center text-stone-400 text-sm">
            감지된 이슈이 없습니다.
          </div>
        ) : (
          activeConflicts.map(conflict => {
            const severity = getSeverityConfig(conflict.severity)
            const newDec = findDecision(conflict.newDecision.id)
            const existingDec = findDecision(conflict.existingDecision.id)

            return (
              <div
                key={conflict.id}
                className={`glass-card border-l-4 ${severity.border} ${
                  conflict.resolved ? 'opacity-60' : ''
                }`}
              >
                {/* Conflict header */}
                <div className="px-5 py-3.5 border-b border-stone-100/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${severity.dot}`} />
                    <Badge variant="outline" className={`text-xs ${severity.color} border-current`}>
                      {severity.label}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {getConflictTypeLabel(conflict.type)}
                    </Badge>
                    {conflict.resolved && conflict.resolution && (
                      <Badge className="text-xs bg-emerald-100 text-emerald-700">
                        {conflict.resolution === 'reject_new'
                          ? '이전 결정 유지'
                          : conflict.resolution === 'hold'
                          ? '나중에 결정'
                          : '새 결정으로 변경'}
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-stone-400 font-mono">{conflict.id}</span>
                </div>

                {/* Side by side decisions */}
                <div className="p-5 grid grid-cols-2 gap-4">
                  {/* New decision */}
                  <div className="rounded-xl border border-accent/30 bg-accent/5 p-4">
                    <p className="text-xs font-medium text-accent uppercase tracking-wide mb-2">
                      새 결정
                    </p>
                    <Badge variant="outline" className="text-xs font-mono mb-1.5">
                      {conflict.newDecision.code}
                    </Badge>
                    <p className="text-sm font-medium text-stone-800">
                      {conflict.newDecision.title}
                    </p>
                    {newDec && (
                      <div className="mt-2 space-y-1">
                        <p className="text-[11px] text-stone-500">{newDec.rationale}</p>
                        <div className="flex items-center gap-1.5">
                          <Badge variant="secondary" className="text-xs">
                            {newDec.area === 'planning' ? '기획'
                              : newDec.area === 'design' ? '디자인'
                              : newDec.area === 'dev' ? '개발'
                              : newDec.area}
                          </Badge>
                          <span className="text-xs text-stone-400">{newDec.proposedBy}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Existing decision */}
                  <div className="rounded-xl border border-stone-200 bg-stone-50/50 p-4">
                    <p className="text-xs font-medium text-stone-500 uppercase tracking-wide mb-2">
                      기존 결정
                    </p>
                    <Badge variant="outline" className="text-xs font-mono mb-1.5">
                      {conflict.existingDecision.code}
                    </Badge>
                    <p className="text-sm font-medium text-stone-800">
                      {conflict.existingDecision.title}
                    </p>
                    {existingDec && (
                      <div className="mt-2 space-y-1">
                        <p className="text-[11px] text-stone-500">{existingDec.rationale}</p>
                        <div className="flex items-center gap-1.5">
                          <Badge variant="secondary" className="text-xs">
                            {existingDec.area === 'planning' ? '기획'
                              : existingDec.area === 'design' ? '디자인'
                              : existingDec.area === 'dev' ? '개발'
                              : existingDec.area}
                          </Badge>
                          <span className="text-xs text-stone-400">{existingDec.proposedBy}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action buttons */}
                {!conflict.resolved && (
                  <div className="px-5 pb-4 flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs gap-1.5 text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => resolveConflict(conflict.id, 'reject_new')}
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      이전 결정 유지
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs gap-1.5 text-amber-600 border-amber-200 hover:bg-amber-50"
                      onClick={() => resolveConflict(conflict.id, 'hold')}
                    >
                      <Pause className="h-3.5 w-3.5" />
                      나중에 결정
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs gap-1.5 text-stone-600 border-stone-200 hover:bg-stone-50"
                      onClick={() => resolveConflict(conflict.id, 'suspend_existing')}
                    >
                      <ShieldOff className="h-3.5 w-3.5" />
                      새 결정으로 변경
                    </Button>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Rejected alternatives (collapsed) */}
      {rejectedConflicts.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold text-stone-700 text-sm">
            기각된 대안 <span className="text-stone-400 font-normal">({rejectedConflicts.length}건)</span>
          </h2>
          <div className="glass-card divide-y divide-stone-100/50">
            {rejectedConflicts.map(conflict => (
              <div key={conflict.id} className="px-5 py-3 flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-stone-300 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Badge variant="outline" className="text-xs font-mono">
                      {conflict.newDecision.code}
                    </Badge>
                    <span className="text-[11px] text-stone-400">채택 vs</span>
                    <span className="text-xs text-stone-500 truncate">
                      {conflict.existingDecision.title}
                    </span>
                  </div>
                </div>
                <Badge className="text-xs bg-stone-100 text-stone-500">해결됨</Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
