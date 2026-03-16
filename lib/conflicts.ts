import type { StoredDecision, StoredRejected } from '@/lib/store/types'

export interface Conflict {
  id: string
  newDecision: { id: string; code: string; title: string; meetingId: string }
  existingDecision: { id: string; code: string; title: string; meetingId: string }
  type: 'direct_change' | 'area_overlap' | 'rejected_alternative'
  severity: 'high' | 'medium' | 'low'
  resolved: boolean
  resolution?: 'reject_new' | 'hold' | 'suspend_existing'
}

/**
 * Detect conflicts between decisions.
 *
 * Rules:
 * 1. A "changed" decision conflicts with the confirmed decision that replaced it
 *    (same area, later date) → direct_change, high severity.
 * 2. A "pending" decision may conflict with existing "confirmed" decisions in the
 *    same area → area_overlap, high/medium severity.
 * 3. Each rejected alternative is a low-severity conflict tied to its related decision.
 */
export function detectConflicts(
  decisions: StoredDecision[],
  rejected: StoredRejected[]
): Conflict[] {
  const conflicts: Conflict[] = []
  let conflictIndex = 0

  // --- 1. Direct changes: "changed" decisions replaced by newer confirmed ones ---
  const changedDecisions = decisions.filter(d => d.status === 'changed')

  for (const changed of changedDecisions) {
    // Find the confirmed decision that superseded this one (same area, later date)
    const replacements = decisions.filter(
      d =>
        d.id !== changed.id &&
        d.area === changed.area &&
        d.status === 'confirmed' &&
        new Date(d.createdAt).getTime() > new Date(changed.createdAt).getTime()
    )

    for (const replacement of replacements) {
      conflicts.push({
        id: `conflict-${++conflictIndex}`,
        newDecision: {
          id: replacement.id,
          code: replacement.code,
          title: replacement.title,
          meetingId: replacement.meetingId,
        },
        existingDecision: {
          id: changed.id,
          code: changed.code,
          title: changed.title,
          meetingId: changed.meetingId,
        },
        type: 'direct_change',
        severity: 'high',
        resolved: false,
      })
    }

    // If no confirmed replacement found, still flag the change (timeline changes etc.)
    if (replacements.length === 0) {
      // Find the most recent confirmed in same area before the change
      const prior = decisions
        .filter(
          d =>
            d.id !== changed.id &&
            d.area === changed.area &&
            new Date(d.createdAt).getTime() <= new Date(changed.createdAt).getTime() &&
            (d.status === 'confirmed' || d.status === 'changed')
        )
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]

      if (prior) {
        conflicts.push({
          id: `conflict-${++conflictIndex}`,
          newDecision: {
            id: changed.id,
            code: changed.code,
            title: changed.title,
            meetingId: changed.meetingId,
          },
          existingDecision: {
            id: prior.id,
            code: prior.code,
            title: prior.title,
            meetingId: prior.meetingId,
          },
          type: 'direct_change',
          severity: 'medium',
          resolved: false,
        })
      }
    }
  }

  // --- 2. Area overlaps: "pending" decisions conflicting with confirmed ones ---
  const pendingDecisions = decisions.filter(d => d.status === 'pending')

  for (const pending of pendingDecisions) {
    const confirmedInArea = decisions.filter(
      d =>
        d.id !== pending.id &&
        d.area === pending.area &&
        d.status === 'confirmed'
    )

    for (const existing of confirmedInArea) {
      // Avoid duplicates with direct_change conflicts
      const alreadyExists = conflicts.some(
        c =>
          (c.newDecision.id === pending.id && c.existingDecision.id === existing.id) ||
          (c.existingDecision.id === pending.id && c.newDecision.id === existing.id)
      )
      if (alreadyExists) continue

      conflicts.push({
        id: `conflict-${++conflictIndex}`,
        newDecision: {
          id: pending.id,
          code: pending.code,
          title: pending.title,
          meetingId: pending.meetingId,
        },
        existingDecision: {
          id: existing.id,
          code: existing.code,
          title: existing.title,
          meetingId: existing.meetingId,
        },
        type: 'area_overlap',
        severity: 'high',
        resolved: false,
      })
    }
  }

  // --- 3. Rejected alternatives ---
  for (const rej of rejected) {
    // Find the decision this rejection is related to
    const relatedDecision = decisions.find(
      d => d.title === rej.relatedDecision || d.meetingId === rej.meetingId
    )
    if (!relatedDecision) continue

    // Create a pseudo conflict entry
    conflicts.push({
      id: `conflict-${++conflictIndex}`,
      newDecision: {
        id: relatedDecision.id,
        code: relatedDecision.code,
        title: relatedDecision.title,
        meetingId: relatedDecision.meetingId,
      },
      existingDecision: {
        id: rej.id,
        code: `REJ`,
        title: rej.title,
        meetingId: rej.meetingId,
      },
      type: 'rejected_alternative',
      severity: 'low',
      resolved: true, // rejected alternatives are already resolved
    })
  }

  return conflicts
}

/** Count unresolved conflicts */
export function countUnresolved(conflicts: Conflict[]): number {
  return conflicts.filter(c => !c.resolved).length
}

/** Get conflict type label in Korean */
export function getConflictTypeLabel(type: Conflict['type']): string {
  switch (type) {
    case 'direct_change':
      return '직접 변경'
    case 'area_overlap':
      return '영역 충돌'
    case 'rejected_alternative':
      return '기각된 대안'
  }
}

/** Get severity config */
export function getSeverityConfig(severity: Conflict['severity']): {
  label: string
  color: string
  bg: string
  border: string
  dot: string
} {
  switch (severity) {
    case 'high':
      return {
        label: '높음',
        color: 'text-red-600',
        bg: 'bg-red-50',
        border: 'border-l-red-500',
        dot: 'bg-red-500',
      }
    case 'medium':
      return {
        label: '보통',
        color: 'text-amber-600',
        bg: 'bg-amber-50',
        border: 'border-l-amber-500',
        dot: 'bg-amber-500',
      }
    case 'low':
      return {
        label: '낮음',
        color: 'text-stone-500',
        bg: 'bg-stone-50',
        border: 'border-l-stone-300',
        dot: 'bg-stone-400',
      }
  }
}
