'use client'

import { useCallback, useMemo, useState, useEffect } from 'react'
import ReactFlow, {
  Node, Edge, Controls, Background, BackgroundVariant,
  useNodesState, useEdgesState, MarkerType,
} from 'reactflow'
import 'reactflow/dist/style.css'
import {
  Filter, Calendar, GitBranch, Mic, Phone, Mail, FileText, X,
  AlertTriangle, ListChecks, ArrowRight,
} from 'lucide-react'
import { SlackIcon, NotionIcon } from '@/components/brand/ServiceIcons'
import { Button } from '@/components/ui/button'
import { nodeTypes, FlowNodeData, FlowNodeType } from './FlowNodes'
import { TimelineItem, relationColors, ConnectionRelation } from './types'

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Shared filter logic
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const norm = (a?: string) => {
  if (a === 'planning') return '기획'
  if (a === 'design') return '디자인'
  if (a === 'dev') return '개발'
  return a || ''
}

const STATUS: Record<string, { bg: string; color: string; label: string }> = {
  confirmed: { bg: 'bg-emerald-500', color: 'text-emerald-600', label: '확정' },
  changed:   { bg: 'bg-amber-500',   color: 'text-amber-600',   label: '변경' },
  pending:   { bg: 'bg-zinc-400',     color: 'text-zinc-500',    label: '보류' },
  rejected:  { bg: 'bg-red-500',      color: 'text-red-600',     label: '기각' },
  hold:      { bg: 'bg-zinc-400',     color: 'text-zinc-500',    label: '보류' },
}

const AREA_OPTIONS: { value: string; label: string; dot: string }[] = [
  { value: '기획', label: '기획', dot: 'bg-purple-500' },
  { value: '디자인', label: '디자인', dot: 'bg-pink-500' },
  { value: '개발', label: '개발', dot: 'bg-sky-500' },
]

const AREA_STYLE: Record<string, { dot: string; label: string }> = {
  planning: { dot: 'bg-purple-500', label: '기획' }, '기획': { dot: 'bg-purple-500', label: '기획' },
  design: { dot: 'bg-pink-500', label: '디자인' }, '디자인': { dot: 'bg-pink-500', label: '디자인' },
  dev: { dot: 'bg-sky-500', label: '개발' }, '개발': { dot: 'bg-sky-500', label: '개발' },
}

const SOURCE_ICON: Record<string, React.ElementType> = {
  meeting: Mic, slack: SlackIcon, notion: NotionIcon,
  call: Phone, email: Mail, document: FileText, text: FileText,
}

type AreaFilter = 'all' | string
type StatusFilter = 'all' | string

function FilterBar({ areaFilter, setAreaFilter, statusFilter, setStatusFilter, items }: {
  areaFilter: string; setAreaFilter: (v: string) => void
  statusFilter: string; setStatusFilter: (v: string) => void
  items: TimelineItem[]
}) {
  const decisions = items.filter(i => i.type === 'decision')
  const existingAreas = useMemo(() => {
    const s = new Set(decisions.map(d => norm(d.area)).filter(Boolean))
    return AREA_OPTIONS.filter(o => s.has(o.value))
  }, [decisions])
  const existingStatuses = useMemo(() => {
    const s = new Set<string>(decisions.map(d => d.status).filter(Boolean) as string[])
    return Object.entries(STATUS).filter(([k]) => s.has(k))
  }, [decisions])
  const hasFilter = areaFilter !== 'all' || statusFilter !== 'all'

  return (
    <div className="shrink-0 flex items-center gap-2 px-5 py-2.5 border-b border-border/30 bg-muted/10 flex-wrap">
      <Filter className="h-3.5 w-3.5 text-muted-foreground" />
      {existingStatuses.map(([k, s]) => (
        <button key={k} onClick={() => setStatusFilter(statusFilter === k ? 'all' : k)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors
            ${statusFilter === k ? 'bg-foreground text-background' : 'bg-secondary/60 text-muted-foreground hover:bg-secondary'}`}>
          <span className={`w-2 h-2 rounded-full ${s.bg}`} />{s.label}
        </button>
      ))}
      {existingAreas.length > 0 && <div className="w-px h-4 bg-border/40" />}
      {existingAreas.map(o => (
        <button key={o.value} onClick={() => setAreaFilter(areaFilter === o.value ? 'all' : o.value)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors
            ${areaFilter === o.value ? 'bg-foreground text-background' : 'bg-secondary/60 text-muted-foreground hover:bg-secondary'}`}>
          <span className={`w-2 h-2 rounded-full ${o.dot}`} />{o.label}
        </button>
      ))}
      {hasFilter && (
        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground ml-auto"
          onClick={() => { setAreaFilter('all'); setStatusFilter('all') }}>
          <X className="h-3 w-3 mr-1" />초기화
        </Button>
      )}
    </div>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// LIST VIEW — 미팅별 그룹 + 결정 카드
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export function FlowListView({ items }: { items: TimelineItem[] }) {
  const [areaFilter, setAreaFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const meetings = useMemo(() => items.filter(i => i.type === 'meeting'), [items])
  const decisions = useMemo(() => items.filter(i => i.type === 'decision'), [items])

  const grouped = useMemo(() => {
    return meetings.map(mtg => ({
      meeting: mtg,
      decisions: decisions.filter(d =>
        d.connections.sources.some(s => s.code === mtg.code)
      ).filter(d => {
        if (areaFilter !== 'all' && norm(d.area) !== areaFilter) return false
        if (statusFilter !== 'all' && d.status !== statusFilter) return false
        return true
      }),
    })).filter(g => g.decisions.length > 0 || (areaFilter === 'all' && statusFilter === 'all'))
  }, [meetings, decisions, areaFilter, statusFilter])

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <FilterBar items={items} areaFilter={areaFilter} setAreaFilter={setAreaFilter}
        statusFilter={statusFilter} setStatusFilter={setStatusFilter} />
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-8 space-y-10">
          {grouped.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <GitBranch className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p>결정이 없습니다.</p>
            </div>
          ) : grouped.map(({ meeting, decisions: decs }) => (
            <div key={meeting.id}>
              {/* 미팅 헤더 */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
                  {(() => { const I = (meeting.sourceType && SOURCE_ICON[meeting.sourceType]) || Calendar; return <I className="h-4 w-4 text-blue-500" /> })()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-blue-600">{meeting.code}</span>
                    <span className="text-sm font-semibold truncate">{meeting.title}</span>
                  </div>
                  {meeting.date && <p className="text-xs text-muted-foreground">{meeting.date}</p>}
                </div>
                <span className="text-xs text-muted-foreground">{decs.length}건</span>
              </div>

              {/* 결정 카드 */}
              <div className="ml-[18px] border-l-2 border-blue-200 pl-7 space-y-2.5">
                {decs.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-2">추출된 결정이 없습니다.</p>
                ) : decs.map(dec => <ListDecisionCard key={dec.id} item={dec} />)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ListDecisionCard({ item }: { item: TimelineItem }) {
  const status = item.status ? STATUS[item.status] : null
  const area = item.area ? AREA_STYLE[item.area] : null
  const hasIssue = item.hasConflict || item.hasBlocker
  const taskProgress = item.tasks?.length
    ? { total: item.tasks.length, done: item.tasks.filter(t => t.status === 'done').length }
    : null
  const changedFrom = item.connections.sources.find(s => s.relation === 'changed_by')

  return (
    <div className={`relative rounded-xl border bg-card p-4 transition-colors hover:border-border
      ${hasIssue ? 'border-red-500/40 bg-red-500/[0.02]' : 'border-border/50'}`}>
      <div className={`absolute left-0 top-3 bottom-3 w-1 rounded-full ${hasIssue ? 'bg-red-500' : (status?.bg || 'bg-zinc-300')}`} />
      <div className="pl-3">
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          <span className="text-sm font-mono font-bold text-foreground/70">{item.code}</span>
          {status && <span className={`text-xs font-semibold ${hasIssue ? 'text-red-500' : status.color}`}>{hasIssue ? '이슈' : status.label}</span>}
          {area && <span className="flex items-center gap-1"><span className={`w-1.5 h-1.5 rounded-full ${area.dot}`} /><span className="text-xs text-muted-foreground">{area.label}</span></span>}
          {hasIssue && <AlertTriangle className="h-3.5 w-3.5 text-red-500" />}
          {taskProgress && (
            <span className="flex items-center gap-1.5 ml-auto text-xs text-muted-foreground">
              <ListChecks className="h-3.5 w-3.5" />{taskProgress.done}/{taskProgress.total}
              <span className="w-8 h-1.5 rounded-full bg-secondary overflow-hidden inline-block">
                <span className="block h-full bg-emerald-500 rounded-full" style={{ width: `${taskProgress.total > 0 ? (taskProgress.done / taskProgress.total) * 100 : 0}%` }} />
              </span>
            </span>
          )}
        </div>
        <p className="text-base font-semibold leading-snug">{item.title}</p>
        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
          {item.owner && (
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-foreground/60">{item.owner.name.charAt(0)}</span>
              {item.owner.name}
            </span>
          )}
          {changedFrom && (
            <span className="flex items-center gap-1 text-amber-600">
              <ArrowRight className="h-3 w-3" /><span className="font-medium">{changedFrom.code}</span>에서 변경
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MAP VIEW — ReactFlow 노드 맵 (유기적 연결)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const EDGE_LABELS: Record<string, string> = {
  created_from: '생성', changed_by: '변경', implemented_in: '구현',
  discussed_in: '논의', affects: '적용',
}

// 세로 스택 레이아웃 — 미팅별로 결정을 세로로 쌓음, 가로 확산 없음
function layoutVerticalStack(nodes: Node[], edges: Edge[], items: TimelineItem[]) {
  const meetings = items.filter(i => i.type === 'meeting')
  const codeToId = new Map<string, string>()
  items.forEach(i => codeToId.set(i.code, i.id))

  const COL_WIDTH = 320
  const MTG_HEIGHT = 50
  const DEC_HEIGHT = 80
  const GAP_Y = 24
  const COL_GAP = 40

  const posMap = new Map<string, { x: number; y: number }>()

  let colX = 0

  meetings.forEach((mtg) => {
    const mtgDecs = items.filter(i =>
      i.type === 'decision' && i.connections.sources.some(s => s.code === mtg.code)
    )

    // 미팅 위치
    posMap.set(mtg.id, { x: colX + (COL_WIDTH - 240) / 2, y: 0 })

    // 결정들을 세로로 쌓기
    let y = MTG_HEIGHT + GAP_Y
    mtgDecs.forEach(dec => {
      posMap.set(dec.id, { x: colX, y })
      y += DEC_HEIGHT + GAP_Y
    })

    colX += COL_WIDTH + COL_GAP
  })

  // 미팅에 연결 안 된 고아 노드
  let orphanY = 0
  nodes.forEach(n => {
    if (!posMap.has(n.id)) {
      posMap.set(n.id, { x: colX, y: orphanY })
      orphanY += DEC_HEIGHT + GAP_Y
    }
  })

  return {
    nodes: nodes.map(n => ({
      ...n,
      position: posMap.get(n.id) || { x: 0, y: 0 },
    })),
    edges,
  }
}

function buildFlowElements(items: TimelineItem[], highlightedIds?: Set<string>) {
  const nodes: Node<FlowNodeData>[] = []
  const edges: Edge[] = []
  const codeToId = new Map<string, string>()

  items.forEach(item => {
    codeToId.set(item.code, item.id)
    const on = !highlightedIds || highlightedIds.has(item.id)
    nodes.push({
      id: item.id, type: item.type as FlowNodeType,
      data: {
        code: item.code, title: item.title, description: item.description,
        status: item.status, type: item.type as FlowNodeType,
        owner: item.owner, contributors: item.contributors,
        tasks: item.tasks, area: item.area, sourceType: item.sourceType,
        hasConflict: item.hasConflict, hasBlocker: item.hasBlocker,
      },
      position: { x: 0, y: 0 },
      style: on ? {} : { opacity: 0.15 },
    })
  })

  items.forEach(item => {
    item.connections.sources.forEach(src => {
      const from = codeToId.get(src.code)
      if (!from) return
      const id = `e-${from}-${item.id}`
      if (edges.find(e => e.id === id)) return
      const color = relationColors[src.relation] || '#888'
      const on = !highlightedIds || (highlightedIds.has(item.id) && highlightedIds.has(from))
      edges.push({
        id, source: from, target: item.id,
        label: EDGE_LABELS[src.relation] || src.relation,
        animated: src.relation === 'changed_by',
        style: { stroke: color, strokeWidth: 1.5, opacity: on ? 0.6 : 0.1 },
        labelStyle: { fontSize: 10, fill: color, fontWeight: 600, opacity: on ? 1 : 0.2 },
        labelBgStyle: { fill: 'hsl(var(--background))', fillOpacity: on ? 0.8 : 0.2 },
        labelBgPadding: [4, 2] as [number, number],
        labelBgBorderRadius: 3,
        markerEnd: { type: MarkerType.ArrowClosed, color, width: 14, height: 14 },
      })
    })
  })

  return { nodes, edges }
}

export function FlowMapView({ items }: { items: TimelineItem[] }) {
  const [areaFilter, setAreaFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sourceFilter, setSourceFilter] = useState<string>('all') // 소스(미팅) 선택

  // 소스(미팅) 목록
  const meetings = useMemo(() => items.filter(i => i.type === 'meeting'), [items])

  // 소스 필터 적용 — 선택된 미팅 + 그 미팅의 결정만 표시
  const filteredItems = useMemo(() => {
    if (sourceFilter === 'all') return items
    const mtg = items.find(i => i.id === sourceFilter)
    if (!mtg) return items
    const relatedDecIds = new Set<string>()
    items.forEach(item => {
      if (item.connections.sources.some(s => s.code === mtg.code)) {
        relatedDecIds.add(item.id)
      }
    })
    return items.filter(i => i.id === sourceFilter || relatedDecIds.has(i.id))
  }, [items, sourceFilter])

  const hasFilter = areaFilter !== 'all' || statusFilter !== 'all'

  const highlightedIds = useMemo(() => {
    if (!hasFilter) return undefined
    const ids = new Set<string>()
    filteredItems.forEach(item => {
      let ok = true
      if (areaFilter !== 'all' && norm(item.area) !== areaFilter && item.type !== 'meeting') ok = false
      if (statusFilter !== 'all' && item.status !== statusFilter && item.type !== 'meeting') ok = false
      if (ok) ids.add(item.id)
    })
    return ids
  }, [filteredItems, areaFilter, statusFilter, hasFilter])

  const { initialNodes, initialEdges } = useMemo(() => {
    const { nodes, edges } = buildFlowElements(filteredItems, highlightedIds)
    const laid = layoutVerticalStack(nodes, edges, filteredItems)
    return { initialNodes: laid.nodes, initialEdges: laid.edges }
  }, [filteredItems, highlightedIds])

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  useEffect(() => { setNodes(initialNodes); setEdges(initialEdges) }, [initialNodes, initialEdges, setNodes, setEdges])

  if (items.filter(i => i.type === 'decision').length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-center text-stone-400">
        <div>
          <GitBranch className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">결정 데이터가 없습니다.</p>
          <p className="text-xs mt-1">미팅을 분석하면 결정 맵이 생성됩니다.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-130px)] min-h-[400px] flex flex-col overflow-hidden">
      {/* 소스 선택 + 필터 */}
      <div className="shrink-0 border-b border-border/30 bg-muted/10">
        {meetings.length > 0 && (
          <div className="flex items-center gap-1.5 px-5 py-2 overflow-x-auto">
            <span className="text-xs text-muted-foreground font-medium shrink-0 mr-1">소스</span>
            <button
              onClick={() => setSourceFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0
                ${sourceFilter === 'all' ? 'bg-foreground text-background' : 'bg-secondary/60 text-muted-foreground hover:bg-secondary'}`}
            >
              전체
            </button>
            {meetings.map(mtg => {
              const decCount = items.filter(i => i.connections.sources.some(s => s.code === mtg.code)).length
              return (
                <button
                  key={mtg.id}
                  onClick={() => setSourceFilter(sourceFilter === mtg.id ? 'all' : mtg.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0
                    ${sourceFilter === mtg.id ? 'bg-foreground text-background' : 'bg-secondary/60 text-muted-foreground hover:bg-secondary'}`}
                >
                  {mtg.code} {mtg.title.length > 12 ? mtg.title.slice(0, 12) + '…' : mtg.title}
                  <span className="opacity-60">({decCount})</span>
                </button>
              )
            })}
          </div>
        )}
        <FilterBar items={filteredItems} areaFilter={areaFilter} setAreaFilter={setAreaFilter}
          statusFilter={statusFilter} setStatusFilter={setStatusFilter} />
      </div>
      <div className="flex-1 min-h-0">
        <ReactFlow
          nodes={nodes} edges={edges}
          onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes} fitView fitViewOptions={{ padding: 0.5 }}
          minZoom={0.3} maxZoom={2}
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="hsl(var(--border) / 0.4)" />
          <Controls className="!bg-secondary/80 !border-border/50 !rounded-xl overflow-hidden" showInteractive={false} />
        </ReactFlow>
      </div>
    </div>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Legacy export (for backward compat with other pages)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export function FlowView({ items }: { items: TimelineItem[] }) {
  return <FlowListView items={items} />
}
