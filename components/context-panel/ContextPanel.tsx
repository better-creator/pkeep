'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Map, CheckCircle2, Circle, AlertTriangle, XCircle, Lightbulb, MapPin } from 'lucide-react'

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  loadMeetings,
  loadDecisions,
  loadTasks,
  loadRejected,
  type StoredMeeting,
  type StoredDecision,
  type StoredTask,
  type StoredRejected,
} from '@/lib/store'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ContextPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  itemType: 'meeting' | 'decision' | 'task'
  itemId: string
}

interface ContextChain {
  meeting: StoredMeeting | null
  decisions: StoredDecision[]
  tasks: StoredTask[]
  rejected: StoredRejected[]
  /** The specific decision when viewing a decision or a task linked to one */
  focusedDecision: StoredDecision | null
  /** The specific task when viewing a task */
  focusedTask: StoredTask | null
}

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-emerald-100 text-emerald-800',
  changed: 'bg-blue-100 text-blue-800',
  rejected: 'bg-red-100 text-red-800',
  hold: 'bg-gray-100 text-gray-600',
  disabled: 'bg-gray-100 text-gray-400',
}

const STATUS_LABELS: Record<string, string> = {
  pending: '검토 중',
  confirmed: '확정',
  changed: '변경됨',
  rejected: '기각',
  hold: '보류',
  disabled: '비활성',
}

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge
      className={`${STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-600'} border-0 text-[11px]`}
    >
      {STATUS_LABELS[status] ?? status}
    </Badge>
  )
}

// ---------------------------------------------------------------------------
// Context chain builder
// ---------------------------------------------------------------------------

function buildContextChain(
  itemType: 'meeting' | 'decision' | 'task',
  itemId: string,
): ContextChain {
  const meetings = loadMeetings()
  const decisions = loadDecisions()
  const tasks = loadTasks()
  const rejected = loadRejected()

  const empty: ContextChain = {
    meeting: null,
    decisions: [],
    tasks: [],
    rejected: [],
    focusedDecision: null,
    focusedTask: null,
  }

  if (itemType === 'meeting') {
    const meeting = meetings.find((m) => m.id === itemId) ?? null
    if (!meeting) return empty
    return {
      meeting,
      decisions: decisions.filter((d) => d.meetingId === meeting.id),
      tasks: tasks.filter((t) => t.meetingId === meeting.id),
      rejected: rejected.filter((r) => r.meetingId === meeting.id),
      focusedDecision: null,
      focusedTask: null,
    }
  }

  if (itemType === 'decision') {
    const dec = decisions.find((d) => d.id === itemId) ?? null
    if (!dec) return empty
    const meeting = meetings.find((m) => m.id === dec.meetingId) ?? null
    // Find conflicting decisions: same meeting, different status from this one
    const conflicts = decisions.filter(
      (d) =>
        d.meetingId === dec.meetingId &&
        d.id !== dec.id &&
        (d.status === 'changed' || d.status === 'rejected'),
    )
    return {
      meeting,
      decisions: conflicts,
      tasks: tasks.filter((t) => t.decisionId === dec.id || t.meetingId === dec.meetingId),
      rejected: rejected.filter(
        (r) => r.meetingId === dec.meetingId && r.relatedDecision === dec.id,
      ),
      focusedDecision: dec,
      focusedTask: null,
    }
  }

  // task
  const task = tasks.find((t) => t.id === itemId) ?? null
  if (!task) return empty
  const meeting = meetings.find((m) => m.id === task.meetingId) ?? null
  const relatedDecision = task.decisionId
    ? (decisions.find((d) => d.id === task.decisionId) ?? null)
    : null
  return {
    meeting,
    decisions: relatedDecision ? [relatedDecision] : [],
    tasks: tasks.filter((t) => t.meetingId === task.meetingId && t.id !== task.id),
    rejected: [],
    focusedDecision: relatedDecision,
    focusedTask: task,
  }
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ChainConnector() {
  return (
    <div className="ml-3 h-5 border-l-2 border-primary/20" aria-hidden />
  )
}

function SectionLabel({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
      {icon}
      {label}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function ContextPanel({ open, onOpenChange, itemType, itemId }: ContextPanelProps) {
  const [currentType, setCurrentType] = useState(itemType)
  const [currentId, setCurrentId] = useState(itemId)
  const [chain, setChain] = useState<ContextChain | null>(null)

  // Sync props when panel opens or props change
  useEffect(() => {
    setCurrentType(itemType)
    setCurrentId(itemId)
  }, [itemType, itemId, open])

  // Build context chain
  useEffect(() => {
    if (open) {
      setChain(buildContextChain(currentType, currentId))
    }
  }, [open, currentType, currentId])

  const navigateTo = useCallback(
    (type: 'meeting' | 'decision' | 'task', id: string) => {
      setCurrentType(type)
      setCurrentId(id)
    },
    [],
  )

  // Derive header info
  const header = useMemo(() => {
    if (!chain) return { code: '', title: '', status: '' }
    if (currentType === 'meeting' && chain.meeting) {
      return { code: chain.meeting.code, title: chain.meeting.title, status: '' }
    }
    if (currentType === 'decision' && chain.focusedDecision) {
      return {
        code: chain.focusedDecision.code,
        title: chain.focusedDecision.title,
        status: chain.focusedDecision.status,
      }
    }
    if (currentType === 'task' && chain.focusedTask) {
      return {
        code: '',
        title: chain.focusedTask.title,
        status: chain.focusedTask.done ? 'confirmed' : 'pending',
      }
    }
    return { code: '', title: '항목을 찾을 수 없습니다', status: '' }
  }, [chain, currentType])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md overflow-y-auto p-0"
      >
        {/* ---- Top bar ---- */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b px-5 pt-5 pb-4">
          <SheetHeader className="mb-3">
            <div className="flex items-center gap-2 flex-wrap pr-8">
              {header.code && (
                <Badge variant="outline" className="font-mono text-xs text-primary">
                  {header.code}
                </Badge>
              )}
              {header.status && <StatusBadge status={header.status} />}
            </div>
            <SheetTitle className="text-base leading-snug mt-1">
              {header.title}
            </SheetTitle>
            <SheetDescription className="sr-only">
              맥락 체인 패널
            </SheetDescription>
          </SheetHeader>

          <Button variant="outline" size="sm" className="text-xs gap-1.5" asChild>
            <Link href="/timeline">
              <Map className="h-3.5 w-3.5" />
              맵에서 보기
            </Link>
          </Button>
        </div>

        {/* ---- Chain content ---- */}
        <div className="px-5 py-4 space-y-1">
          {!chain ? (
            <p className="text-sm text-muted-foreground">로딩 중...</p>
          ) : (
            <>
              {/* Source meeting */}
              {chain.meeting && (
                <>
                  <SectionLabel
                    icon={<MapPin className="h-3.5 w-3.5 text-primary" />}
                    label="Source"
                  />
                  <button
                    type="button"
                    onClick={() => navigateTo('meeting', chain.meeting!.id)}
                    className="w-full text-left rounded-xl bg-primary/5 hover:bg-primary/10 transition-colors p-3 group"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="font-mono text-[11px] text-primary">
                        {chain.meeting.code}
                      </Badge>
                      {chain.meeting.sourceType && (
                        <span className="text-[11px] text-muted-foreground capitalize">
                          {chain.meeting.sourceType}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium group-hover:text-primary transition-colors">
                      {chain.meeting.title}
                    </p>
                    {chain.meeting.date && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {chain.meeting.date}
                      </p>
                    )}
                    {currentType === 'meeting' && chain.meeting.summary && (
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-4">
                        {chain.meeting.summary}
                      </p>
                    )}
                    {currentType === 'meeting' && chain.meeting.issues.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <span className="text-[11px] font-medium text-muted-foreground">이슈:</span>
                        {chain.meeting.issues.map((issue, i) => (
                          <p key={i} className="text-xs text-muted-foreground pl-2">
                            &bull; {issue.title}
                          </p>
                        ))}
                      </div>
                    )}
                  </button>
                  <ChainConnector />
                </>
              )}

              {/* Focused decision (when viewing decision or task) */}
              {chain.focusedDecision && (
                <>
                  <SectionLabel
                    icon={<Lightbulb className="h-3.5 w-3.5 text-amber-500" />}
                    label="Decision"
                  />
                  <button
                    type="button"
                    onClick={() => navigateTo('decision', chain.focusedDecision!.id)}
                    className="w-full text-left rounded-xl bg-primary/5 hover:bg-primary/10 transition-colors p-3 group"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="font-mono text-[11px] text-primary">
                        {chain.focusedDecision.code}
                      </Badge>
                      <StatusBadge status={chain.focusedDecision.status} />
                    </div>
                    <p className="text-sm font-medium group-hover:text-primary transition-colors">
                      {chain.focusedDecision.title}
                    </p>
                    {chain.focusedDecision.rationale && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-3">
                        {chain.focusedDecision.rationale}
                      </p>
                    )}
                  </button>
                  <ChainConnector />
                </>
              )}

              {/* All decisions (meeting view) */}
              {currentType === 'meeting' && chain.decisions.length > 0 && (
                <>
                  <SectionLabel
                    icon={<Lightbulb className="h-3.5 w-3.5 text-amber-500" />}
                    label={`Decisions (${chain.decisions.length})`}
                  />
                  <div className="space-y-2">
                    {chain.decisions.map((dec) => (
                      <button
                        key={dec.id}
                        type="button"
                        onClick={() => navigateTo('decision', dec.id)}
                        className="w-full text-left rounded-xl bg-primary/5 hover:bg-primary/10 transition-colors p-3 group"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="font-mono text-[11px] text-primary">
                            {dec.code}
                          </Badge>
                          <StatusBadge status={dec.status} />
                        </div>
                        <p className="text-sm font-medium group-hover:text-primary transition-colors">
                          {dec.title}
                        </p>
                        {dec.rationale && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {dec.rationale}
                          </p>
                        )}
                      </button>
                    ))}
                  </div>
                  <ChainConnector />
                </>
              )}

              {/* Conflicts (decision view) */}
              {currentType === 'decision' && chain.decisions.length > 0 && (
                <>
                  <SectionLabel
                    icon={<AlertTriangle className="h-3.5 w-3.5 text-accent" />}
                    label={`Conflicts (${chain.decisions.length})`}
                  />
                  <div className="space-y-2">
                    {chain.decisions.map((dec) => (
                      <button
                        key={dec.id}
                        type="button"
                        onClick={() => navigateTo('decision', dec.id)}
                        className="w-full text-left rounded-xl border border-accent/20 bg-accent/5 hover:bg-accent/10 transition-colors p-3 group"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="font-mono text-[11px] text-accent">
                            {dec.code}
                          </Badge>
                          <StatusBadge status={dec.status} />
                        </div>
                        <p className="text-sm font-medium group-hover:text-accent transition-colors">
                          {dec.title}
                        </p>
                      </button>
                    ))}
                  </div>
                  <ChainConnector />
                </>
              )}

              {/* Tasks */}
              {chain.tasks.length > 0 && (
                <>
                  <SectionLabel
                    icon={<CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />}
                    label={`Tasks (${chain.tasks.length})`}
                  />
                  <div className="rounded-xl bg-primary/5 p-3 space-y-2">
                    {chain.tasks.map((task) => (
                      <button
                        key={task.id}
                        type="button"
                        onClick={() => navigateTo('task', task.id)}
                        className="w-full flex items-start gap-2 text-left hover:bg-primary/10 rounded-lg p-1.5 -m-1.5 transition-colors group"
                      >
                        {task.done ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                        ) : (
                          <Circle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p
                            className={`text-sm group-hover:text-primary transition-colors ${
                              task.done ? 'line-through text-muted-foreground' : ''
                            }`}
                          >
                            {task.title}
                          </p>
                          {task.assignee && (
                            <p className="text-[11px] text-muted-foreground">
                              {task.assignee}
                            </p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                  <ChainConnector />
                </>
              )}

              {/* Rejected alternatives */}
              {chain.rejected.length > 0 && (
                <>
                  <SectionLabel
                    icon={<XCircle className="h-3.5 w-3.5 text-red-400" />}
                    label={`Rejected (${chain.rejected.length})`}
                  />
                  <div className="space-y-2">
                    {chain.rejected.map((rej) => (
                      <div
                        key={rej.id}
                        className="rounded-xl border border-dashed border-muted-foreground/20 bg-muted/30 p-3"
                      >
                        <p className="text-sm text-muted-foreground line-through">
                          {rej.title}
                        </p>
                        {rej.reason && (
                          <p className="text-xs text-muted-foreground/70 mt-1">
                            사유: {rej.reason}
                          </p>
                        )}
                        {rej.proposedBy && (
                          <p className="text-[11px] text-muted-foreground/50 mt-0.5">
                            제안: {rej.proposedBy}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Empty state */}
              {!chain.meeting &&
                chain.decisions.length === 0 &&
                chain.tasks.length === 0 &&
                chain.rejected.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-sm text-muted-foreground">
                      연결된 맥락을 찾을 수 없습니다.
                    </p>
                  </div>
                )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

export default ContextPanel
