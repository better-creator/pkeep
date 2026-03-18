'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CircleDot, FileText, List, Network } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { FlowMapView } from '@/components/timeline/FlowView'
import type { TimelineItem as TLItem } from '@/components/timeline/types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Decision {
  id: string
  meetingId: string
  code: string
  title: string
  rationale: string
  area: string
  status: string
  proposedBy?: string
  createdAt: string
}

interface Meeting {
  id: string
  code: string
  title: string
  date: string
  duration_seconds: number
  source: string
  summary: string
  keywords: string[]
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STATUS_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: 'confirmed', label: '확정' },
  { value: 'pending', label: '보류' },
  { value: 'changed', label: '변경' },
  { value: 'rejected', label: '기각' },
]

const AREA_OPTIONS = [
  { value: 'all', label: '전체' },
  { value: '기획', label: '기획' },
  { value: '디자인', label: '디자인' },
  { value: '개발', label: '개발' },
]

// Also accept English area keys from StoredDecision.area
function getAreaLabel(area: string) {
  switch (area) {
    case 'planning': return '기획'
    case 'design': return '디자인'
    case 'dev': return '개발'
    default: return area
  }
}

function normalizeArea(area: string) {
  switch (area) {
    case 'planning': return '기획'
    case 'design': return '디자인'
    case 'dev': return '개발'
    default: return area
  }
}

// ---------------------------------------------------------------------------
// Styling helpers
// ---------------------------------------------------------------------------

function getStatusBadgeClass(status: string) {
  switch (status) {
    case 'confirmed':
      return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
    case 'pending':
      return 'bg-amber-500/10 text-amber-600 border-amber-500/20'
    case 'changed':
      return 'bg-amber-500/10 text-amber-600 border-amber-500/20'
    case 'rejected':
      return 'bg-red-500/10 text-red-600 border-red-500/20'
    default:
      return 'bg-gray-500/10 text-gray-600 border-gray-500/20'
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case 'confirmed': return '확정'
    case 'pending': return '보류'
    case 'changed': return '변경'
    case 'rejected': return '기각'
    default: return status
  }
}

function getAreaBadgeClass(area: string) {
  const norm = normalizeArea(area)
  switch (norm) {
    case '기획':
      return 'bg-purple-500/10 text-purple-600 border-purple-500/20'
    case '디자인':
      return 'bg-pink-500/10 text-pink-600 border-pink-500/20'
    case '개발':
      return 'bg-sky-500/10 text-sky-600 border-sky-500/20'
    default:
      return 'bg-gray-500/10 text-gray-600 border-gray-500/20'
  }
}

function getMeetingCode(meetingId: string): string {
  if (meetingId.startsWith('mtg-')) {
    const num = meetingId.replace('mtg-', '')
    return `MTG-${num.padStart(3, '0')}`
  }
  return `MTG-${meetingId}`
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

type ViewMode = 'list' | 'map'

/** List View — decision cards with filters & status dropdown */
function ListView({
  decisions,
  filtered,
  statusFilter,
  areaFilter,
  setStatusFilter,
  setAreaFilter,
  onStatusChange,
}: {
  decisions: Decision[]
  filtered: Decision[]
  statusFilter: string
  areaFilter: string
  setStatusFilter: (v: string) => void
  setAreaFilter: (v: string) => void
  onStatusChange: (id: string, status: string) => void
}) {
  const params = useParams()
  const teamId = params.teamId as string
  const projectId = params.projectId as string

  return (
    <>
      {/* Filter Bar */}
      {decisions.length > 0 && (
        <div className="flex items-center gap-3 px-6 py-3 border-b border-border/30 bg-muted/20">
          <span className="text-xs text-muted-foreground font-medium">필터</span>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[120px] h-8 text-xs rounded-lg">
              <SelectValue placeholder="상태" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-xs">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={areaFilter} onValueChange={setAreaFilter}>
            <SelectTrigger className="w-[120px] h-8 text-xs rounded-lg">
              <SelectValue placeholder="영역" />
            </SelectTrigger>
            <SelectContent>
              {AREA_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value} className="text-xs">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {(statusFilter !== 'all' || areaFilter !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-muted-foreground"
              onClick={() => {
                setStatusFilter('all')
                setAreaFilter('all')
              }}
            >
              초기화
            </Button>
          )}
        </div>
      )}

      {/* Cards */}
      <div className="flex-1 overflow-auto p-6">
        {decisions.length === 0 ? (
          <EmptyState />
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[50vh] text-center">
            <p className="text-muted-foreground">
              선택한 필터에 해당하는 결정이 없습니다.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 max-w-3xl">
            {filtered.map((decision) => (
              <Card key={decision.id} className="border-border/50">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        variant="outline"
                        className="font-mono text-[11px] px-2 py-0.5 bg-muted/50"
                      >
                        {decision.code}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`text-[11px] px-2 py-0.5 ${getAreaBadgeClass(decision.area)}`}
                      >
                        {getAreaLabel(decision.area)}
                      </Badge>
                    </div>
                    <Select
                      value={decision.status}
                      onValueChange={(val) => onStatusChange(decision.id, val)}
                    >
                      <SelectTrigger
                        className={`w-auto h-7 text-[11px] rounded-md border px-2.5 gap-1 ${getStatusBadgeClass(decision.status)}`}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="confirmed" className="text-xs">확정</SelectItem>
                        <SelectItem value="pending" className="text-xs">보류</SelectItem>
                        <SelectItem value="changed" className="text-xs">변경</SelectItem>
                        <SelectItem value="rejected" className="text-xs">기각</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <CardTitle className="text-base mt-2">{decision.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {decision.rationale && (
                    <div className="rounded-lg bg-amber-500/5 border border-amber-500/20 px-3 py-2.5">
                      <p className="text-[11px] font-semibold text-amber-600 mb-1">왜?</p>
                      <p className="text-sm text-foreground/80">{decision.rationale}</p>
                    </div>
                  )}
                  <div className="flex items-center gap-3 flex-wrap text-xs text-muted-foreground">
                    <Link
                      href={`/${teamId}/${projectId}/meetings`}
                      className="flex items-center gap-1 hover:text-foreground transition-colors"
                    >
                      <FileText className="h-3 w-3" />
                      {getMeetingCode(decision.meetingId)}에서 추출 →
                    </Link>
                    {decision.proposedBy && (
                      <span>제안: {decision.proposedBy}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

/** localStorage → TimelineItem 변환 (풍부한 연결 정보 포함) */
function buildTimelineItems(meetings: Meeting[], decisions: Decision[]): TLItem[] {
  const items: TLItem[] = []

  // 태스크도 읽어서 결정에 연결
  let storedTasks: { id: string; meetingId: string; decisionId?: string; title: string; assignee?: string; done: boolean }[] = []
  try {
    const raw = localStorage.getItem('pkeep-tasks')
    if (raw) storedTasks = JSON.parse(raw)
  } catch {}

  // 롤(area) → Person role 매핑
  const areaToRole = (area?: string): 'owner' | 'contributor' | 'reviewer' => {
    switch (area) {
      case 'planning': return 'owner'
      case 'design': return 'contributor'
      case 'dev': return 'contributor'
      default: return 'owner'
    }
  }

  // sourceType → FlowNodeType 매핑
  const sourceTypeToNodeType = (st?: string): 'meeting' | 'slack' | 'github' => {
    if (st === 'slack') return 'slack'
    return 'meeting'
  }

  // 변경된 결정 간 연결을 위한 매핑 구축
  // "changed" 결정은 같은 영역의 이전 "confirmed" 결정을 대체한 것으로 연결
  const changedDecisionLinks = new Map<string, string>() // changedDecId → originalDecId
  const rejectedItems: { id: string; meetingId: string; title: string; reason: string; relatedDecision: string; proposedBy?: string }[] = (() => {
    try {
      const raw = localStorage.getItem('pkeep-rejected')
      return raw ? JSON.parse(raw) : []
    } catch { return [] }
  })()

  // changed 결정 → 관련 결정 연결 찾기 (같은 영역 + 이전 날짜의 결정)
  for (const dec of decisions) {
    if (dec.status === 'changed') {
      // 같은 영역의 이전 confirmed 결정 중 관련된 것 찾기
      const relatedDecs = decisions.filter(d =>
        d.id !== dec.id &&
        d.area === dec.area &&
        d.createdAt < dec.createdAt &&
        (d.status === 'confirmed' || d.status === 'pending')
      )
      if (relatedDecs.length > 0) {
        changedDecisionLinks.set(dec.id, relatedDecs[relatedDecs.length - 1].id)
      }
    }
  }

  // 회의/소스 노드 — sourceType에 따라 다른 노드 타입 부여
  for (const mtg of meetings) {
    const mtgDecisions = decisions.filter(d => d.meetingId === mtg.id)
    const st = (mtg as any).sourceType || 'meeting'
    items.push({
      id: mtg.id,
      type: sourceTypeToNodeType(st),
      category: 'meeting',
      source: 'manual',
      code: mtg.code,
      title: mtg.title,
      date: mtg.date,
      description: mtg.summary,
      sourceType: st,
      connections: {
        sources: [],
        impacts: mtgDecisions.map(d => ({
          id: d.id,
          type: 'decision' as const,
          category: 'decision' as const,
          code: d.code,
          title: d.title,
          relation: 'created_from' as const,
        })),
      },
    })
  }

  // 결정 노드 — 회의 연결 + 변경 결정 간 연결 + 소스타입 반영
  for (const dec of decisions) {
    const meeting = meetings.find(m => m.id === dec.meetingId)
    const decTasks = storedTasks.filter(t =>
      (t.decisionId && t.decisionId === dec.id) || t.meetingId === dec.meetingId
    )
    const meetingSourceType = (meeting as any)?.sourceType || 'meeting'

    const sources: TLItem['connections']['sources'] = []
    const impacts: TLItem['connections']['impacts'] = []

    // 원본 회의/소스 연결
    if (meeting) {
      sources.push({
        id: meeting.id,
        type: sourceTypeToNodeType(meetingSourceType) as any,
        category: 'meeting' as const,
        code: meeting.code,
        title: meeting.title,
        relation: 'created_from' as const,
      })
    }

    // changed 결정 → 이전 결정 연결 (changed_by)
    const originalDecId = changedDecisionLinks.get(dec.id)
    if (originalDecId) {
      const origDec = decisions.find(d => d.id === originalDecId)
      if (origDec) {
        sources.push({
          id: origDec.id,
          type: 'decision' as const,
          category: 'decision' as const,
          code: origDec.code,
          title: origDec.title,
          relation: 'changed_by' as const,
        })
      }
    }

    // 이 결정이 다른 결정에 의해 변경된 경우 impacts에 추가
    changedDecisionLinks.forEach((origId, changedId) => {
      if (origId === dec.id) {
        const changedDec = decisions.find(d => d.id === changedId)
        if (changedDec) {
          impacts.push({
            id: changedDec.id,
            type: 'decision' as const,
            category: 'decision' as const,
            code: changedDec.code,
            title: changedDec.title,
            relation: 'changed_by' as const,
          })
        }
      }
    })

    // 관련 rejected alternative가 있으면 충돌 표시
    const hasRelatedRejection = rejectedItems.some(r =>
      r.meetingId === dec.meetingId && r.relatedDecision === dec.title
    )

    items.push({
      id: dec.id,
      type: 'decision',
      category: 'decision',
      source: 'manual',
      code: dec.code,
      title: dec.title,
      date: dec.createdAt?.split('T')[0] || meeting?.date || '',
      description: `[${getAreaLabel(dec.area || '')}] ${dec.rationale}`,
      status: dec.status as any,
      area: dec.area,
      sourceType: meetingSourceType,
      hasConflict: hasRelatedRejection || dec.status === 'changed',
      owner: dec.proposedBy ? {
        id: dec.proposedBy,
        name: dec.proposedBy,
        role: areaToRole(dec.area),
      } : undefined,
      tasks: decTasks.slice(0, 3).map(t => ({
        id: t.id,
        title: t.title,
        status: t.done ? 'done' as const : 'in_progress' as const,
        assignee: t.assignee ? { id: t.assignee, name: t.assignee } : undefined,
      })),
      connections: { sources, impacts },
    })
  }

  return items
}

/** Map View Wrapper — ReactFlow 노드 맵 */
function MapViewWrapper({ decisions, meetings }: { decisions: Decision[]; meetings: Meeting[] }) {
  const timelineItems = useMemo(() => buildTimelineItems(meetings, decisions), [meetings, decisions])
  if (decisions.length === 0) return <div className="flex-1 overflow-auto p-6"><EmptyState /></div>
  return <div className="flex-1 overflow-hidden h-full"><FlowMapView items={timelineItems} /></div>
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
        <CircleDot className="h-8 w-8 text-muted-foreground/50" />
      </div>
      <p className="text-muted-foreground font-medium mb-1">
        아직 추출된 결정이 없습니다.
      </p>
      <p className="text-sm text-muted-foreground/70">
        소스 페이지에서 회의를 분석하세요.
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function DecisionsPage() {
  const params = useParams()
  const teamId = params.teamId as string
  const projectId = params.projectId as string
  const [decisions, setDecisions] = useState<Decision[]>([])
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [statusFilter, setStatusFilter] = useState('all')
  const [areaFilter, setAreaFilter] = useState('all')
  const [viewMode, setViewMode] = useState<ViewMode>('list')

  // Load from localStorage
  useEffect(() => {
    try {
      const storedDec = localStorage.getItem('pkeep-decisions')
      if (storedDec) setDecisions(JSON.parse(storedDec))
    } catch (e) {
      console.error('Failed to load decisions:', e)
    }
    try {
      const storedMtg = localStorage.getItem('pkeep-meetings')
      if (storedMtg) setMeetings(JSON.parse(storedMtg))
    } catch (e) {
      console.error('Failed to load meetings:', e)
    }
  }, [])

  const saveDecisions = useCallback((updated: Decision[]) => {
    setDecisions(updated)
    try {
      localStorage.setItem('pkeep-decisions', JSON.stringify(updated))
    } catch (e) {
      console.error('Failed to save decisions:', e)
    }
  }, [])

  const handleStatusChange = useCallback(
    (decisionId: string, newStatus: string) => {
      const updated = decisions.map((d) =>
        d.id === decisionId ? { ...d, status: newStatus } : d
      )
      saveDecisions(updated)
    },
    [decisions, saveDecisions]
  )

  const filtered = useMemo(() => {
    return decisions.filter((d) => {
      if (statusFilter !== 'all' && d.status !== statusFilter) return false
      if (areaFilter !== 'all' && normalizeArea(d.area) !== areaFilter) return false
      return true
    })
  }, [decisions, statusFilter, areaFilter])

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <CircleDot className="h-5 w-5 text-orange-500" />
          <h1 className="text-xl font-semibold">결정</h1>
          {decisions.length > 0 && (
            <span className="text-sm text-muted-foreground ml-2">
              {viewMode === 'list' ? `${filtered.length}건` : `${decisions.length}건`}
            </span>
          )}
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-0.5">
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="sm"
            className="h-7 px-3 text-xs rounded-md gap-1.5"
            onClick={() => setViewMode('list')}
          >
            <List className="h-3.5 w-3.5" />
            리스트
          </Button>
          <Button
            variant={viewMode === 'map' ? 'secondary' : 'ghost'}
            size="sm"
            className="h-7 px-3 text-xs rounded-md gap-1.5"
            onClick={() => setViewMode('map')}
          >
            <Network className="h-3.5 w-3.5" />
            맵
          </Button>
        </div>
      </div>

      {/* View content */}
      {viewMode === 'list' ? (
        <ListView
          decisions={decisions}
          filtered={filtered}
          statusFilter={statusFilter}
          areaFilter={areaFilter}
          setStatusFilter={setStatusFilter}
          setAreaFilter={setAreaFilter}
          onStatusChange={handleStatusChange}
        />
      ) : (
        <MapViewWrapper decisions={decisions} meetings={meetings} />
      )}
    </div>
  )
}
