'use client'

import { useMemo, useState } from 'react'
import {
  Filter, Calendar, GitBranch, MonitorSmartphone, Github as GithubIcon,
  MessageSquare, Mic, BookOpen, Phone, Mail, FileText, X,
  AlertTriangle, ChevronRight, ListChecks, ArrowRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TimelineItem } from './types'

interface FlowViewProps {
  items: TimelineItem[]
}

// ─── 필터 ───
type NodeTypeFilter = 'all' | string
type AreaFilter = 'all' | '기획' | '디자인' | '개발'

const norm = (a?: string) => {
  if (a === 'planning') return '기획'
  if (a === 'design') return '디자인'
  if (a === 'dev') return '개발'
  return a || ''
}

const STATUS: Record<string, { color: string; bg: string; label: string }> = {
  confirmed: { color: 'text-emerald-600', bg: 'bg-emerald-500', label: '확정' },
  changed:   { color: 'text-amber-600',   bg: 'bg-amber-500',   label: '변경' },
  pending:   { color: 'text-zinc-500',     bg: 'bg-zinc-400',    label: '보류' },
  rejected:  { color: 'text-red-600',      bg: 'bg-red-500',     label: '기각' },
  hold:      { color: 'text-zinc-500',     bg: 'bg-zinc-400',    label: '보류' },
}

const AREA_STYLE: Record<string, { dot: string; label: string }> = {
  planning: { dot: 'bg-purple-500', label: '기획' },
  '기획':   { dot: 'bg-purple-500', label: '기획' },
  design:   { dot: 'bg-pink-500',   label: '디자인' },
  '디자인': { dot: 'bg-pink-500',   label: '디자인' },
  dev:      { dot: 'bg-sky-500',    label: '개발' },
  '개발':   { dot: 'bg-sky-500',    label: '개발' },
}

const SOURCE_ICON: Record<string, React.ElementType> = {
  meeting: Mic, slack: MessageSquare, notion: BookOpen,
  call: Phone, email: Mail, document: FileText, text: FileText,
}

const AREA_OPTIONS: { value: AreaFilter; label: string; dot: string }[] = [
  { value: '기획', label: '기획', dot: 'bg-purple-500' },
  { value: '디자인', label: '디자인', dot: 'bg-pink-500' },
  { value: '개발', label: '개발', dot: 'bg-sky-500' },
]

export function FlowView({ items }: FlowViewProps) {
  const [areaFilter, setAreaFilter] = useState<AreaFilter>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // 미팅과 결정 분리
  const meetings = useMemo(() => items.filter(i => i.type === 'meeting'), [items])
  const decisions = useMemo(() => items.filter(i => i.type === 'decision'), [items])

  // 미팅별 결정 그룹
  const grouped = useMemo(() => {
    return meetings.map(mtg => {
      const relatedDecs = decisions.filter(d =>
        d.connections.sources.some(s => s.code === mtg.code)
      )
      return { meeting: mtg, decisions: relatedDecs }
    })
  }, [meetings, decisions])

  // 존재하는 영역/상태
  const existingAreas = useMemo(() => {
    const areas = new Set(decisions.map(d => norm(d.area)).filter(Boolean))
    return AREA_OPTIONS.filter(o => areas.has(o.value))
  }, [decisions])

  const existingStatuses = useMemo(() => {
    const statuses = new Set<string>(decisions.map(d => d.status).filter(Boolean) as string[])
    return Object.entries(STATUS).filter(([k]) => statuses.has(k))
  }, [decisions])

  // 필터 적용
  const filteredGrouped = useMemo(() => {
    return grouped.map(g => ({
      ...g,
      decisions: g.decisions.filter(d => {
        if (areaFilter !== 'all' && norm(d.area) !== areaFilter) return false
        if (statusFilter !== 'all' && d.status !== statusFilter) return false
        return true
      }),
    })).filter(g => g.decisions.length > 0 || (areaFilter === 'all' && statusFilter === 'all'))
  }, [grouped, areaFilter, statusFilter])

  const hasFilter = areaFilter !== 'all' || statusFilter !== 'all'
  const totalDecisions = decisions.length
  const filteredCount = filteredGrouped.reduce((sum, g) => sum + g.decisions.length, 0)

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* ─── 필터바 ─── */}
      <div className="shrink-0 flex items-center gap-2.5 px-5 py-3 border-b border-border/30 bg-muted/10 flex-wrap">
        <Filter className="h-3.5 w-3.5 text-muted-foreground" />

        {/* 상태 필터 */}
        {existingStatuses.map(([key, s]) => (
          <button
            key={key}
            onClick={() => setStatusFilter(statusFilter === key ? 'all' : key)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors
              ${statusFilter === key ? 'bg-foreground text-background' : 'bg-secondary/60 text-muted-foreground hover:bg-secondary'}`}
          >
            <span className={`w-2 h-2 rounded-full ${s.bg}`} />
            {s.label}
          </button>
        ))}

        {existingAreas.length > 0 && <div className="w-px h-4 bg-border/40" />}

        {/* 영역 필터 */}
        {existingAreas.map(o => (
          <button
            key={o.value}
            onClick={() => setAreaFilter(areaFilter === o.value ? 'all' : o.value)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors
              ${areaFilter === o.value ? 'bg-foreground text-background' : 'bg-secondary/60 text-muted-foreground hover:bg-secondary'}`}
          >
            <span className={`w-2 h-2 rounded-full ${o.dot}`} />
            {o.label}
          </button>
        ))}

        {hasFilter && (
          <>
            <span className="text-xs text-muted-foreground ml-2">{filteredCount}/{totalDecisions}</span>
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground ml-auto"
              onClick={() => { setAreaFilter('all'); setStatusFilter('all') }}>
              <X className="h-3 w-3 mr-1" />초기화
            </Button>
          </>
        )}
      </div>

      {/* ─── 메인 콘텐츠 ─── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-8 space-y-10">
          {filteredGrouped.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <GitBranch className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>필터에 해당하는 결정이 없습니다.</p>
            </div>
          ) : (
            filteredGrouped.map(({ meeting, decisions: decs }) => (
              <MeetingGroup key={meeting.id} meeting={meeting} decisions={decs} />
            ))
          )}
        </div>
      </div>
    </div>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 미팅 그룹
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function MeetingGroup({ meeting, decisions }: { meeting: TimelineItem; decisions: TimelineItem[] }) {
  const SourceIcon = (meeting.sourceType && SOURCE_ICON[meeting.sourceType]) || Calendar

  return (
    <div>
      {/* 미팅 헤더 */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/30">
          <SourceIcon className="h-5 w-5 text-blue-500" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono font-bold text-blue-600">{meeting.code}</span>
            <span className="text-base font-semibold">{meeting.title}</span>
          </div>
          {meeting.date && (
            <p className="text-xs text-muted-foreground">{meeting.date}</p>
          )}
        </div>
        <div className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
          <GitBranch className="h-3.5 w-3.5" />
          {decisions.length}건
        </div>
      </div>

      {/* 연결선 */}
      <div className="ml-5 border-l-2 border-blue-500/20 pl-8 space-y-3">
        {decisions.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">추출된 결정이 없습니다.</p>
        ) : (
          decisions.map(dec => (
            <DecisionCard key={dec.id} item={dec} />
          ))
        )}
      </div>
    </div>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 결정 카드
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function DecisionCard({ item }: { item: TimelineItem }) {
  const status = item.status ? STATUS[item.status] : null
  const area = item.area ? AREA_STYLE[item.area] : null
  const hasIssue = item.hasConflict || item.hasBlocker

  const taskProgress = item.tasks?.length
    ? { total: item.tasks.length, done: item.tasks.filter(t => t.status === 'done').length }
    : null

  // changed_by 연결 찾기
  const changedFrom = item.connections.sources.find(s => s.relation === 'changed_by')

  return (
    <div
      className={`
        relative rounded-xl border bg-card p-4 transition-colors hover:border-border
        ${hasIssue ? 'border-red-500/40 bg-red-500/[0.02]' : 'border-border/50'}
      `}
    >
      {/* 좌측 상태 바 */}
      <div className={`absolute left-0 top-3 bottom-3 w-1 rounded-full ${hasIssue ? 'bg-red-500' : (status?.bg || 'bg-zinc-300')}`} />

      <div className="pl-3">
        {/* 상단: 코드 + 상태 + 영역 + 이슈 */}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className="text-sm font-mono font-bold text-foreground/70">{item.code}</span>

          {status && (
            <span className={`text-xs font-semibold ${hasIssue ? 'text-red-500' : status.color}`}>
              {hasIssue ? '이슈' : status.label}
            </span>
          )}

          {area && (
            <span className="flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${area.dot}`} />
              <span className="text-xs text-muted-foreground">{area.label}</span>
            </span>
          )}

          {hasIssue && (
            <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
          )}

          {/* 태스크 진행 */}
          {taskProgress && (
            <span className="flex items-center gap-1.5 ml-auto text-xs text-muted-foreground">
              <ListChecks className="h-3.5 w-3.5" />
              {taskProgress.done}/{taskProgress.total}
              <span className="w-8 h-1.5 rounded-full bg-secondary overflow-hidden inline-block">
                <span
                  className="block h-full bg-emerald-500 rounded-full"
                  style={{ width: `${taskProgress.total > 0 ? (taskProgress.done / taskProgress.total) * 100 : 0}%` }}
                />
              </span>
            </span>
          )}
        </div>

        {/* 제목 */}
        <p className="text-base font-semibold leading-snug">{item.title}</p>

        {/* 하단: 제안자 + changed_by 연결 */}
        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
          {item.owner && (
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-foreground/60">
                {item.owner.name.charAt(0)}
              </span>
              {item.owner.name}
            </span>
          )}

          {changedFrom && (
            <span className="flex items-center gap-1 text-amber-600">
              <ArrowRight className="h-3 w-3" />
              <span className="font-medium">{changedFrom.code}</span>에서 변경됨
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
