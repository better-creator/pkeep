'use client'

import { useCallback, useMemo, useState, useEffect } from 'react'
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  MarkerType,
  Panel,
} from 'reactflow'
import dagre from 'dagre'
import 'reactflow/dist/style.css'
import {
  Filter, Calendar, GitBranch, MonitorSmartphone, Github as GithubIcon,
  MessageSquare, Mic, BookOpen, Phone, Mail, FileText, X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

import { nodeTypes, FlowNodeData, FlowNodeType } from './FlowNodes'
import { ContextCard, ContextCardData } from '@/components/context-card'
import { TimelineItem, relationColors, ConnectionRelation } from './types'

interface FlowViewProps {
  items: TimelineItem[]
}

// ─── Dagre 레이아웃 (TB: 위→아래 흐름) ───
function getLayoutedElements(nodes: Node[], edges: Edge[]) {
  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: 'TB', nodesep: 80, ranksep: 100, align: 'UL' })

  nodes.forEach((node) => {
    // 미팅 노드는 작게, 결정 노드는 카드 크기
    const isMeeting = node.type === 'meeting'
    g.setNode(node.id, {
      width: isMeeting ? 180 : 320,
      height: isMeeting ? 120 : 140,
    })
  })

  edges.forEach((edge) => g.setEdge(edge.source, edge.target))
  dagre.layout(g)

  return {
    nodes: nodes.map((node) => {
      const pos = g.node(node.id)
      const isMeeting = node.type === 'meeting'
      const w = isMeeting ? 180 : 320
      const h = isMeeting ? 120 : 140
      return { ...node, position: { x: pos.x - w / 2, y: pos.y - h / 2 } }
    }),
    edges,
  }
}

// ─── 엣지 스타일 ───
function getEdgeStyle(relation: ConnectionRelation) {
  return { stroke: relationColors[relation] || '#888', strokeWidth: 2 }
}

const EDGE_LABELS: Record<string, string> = {
  created_from: '생성', changed_by: '변경', implemented_in: '구현',
  discussed_in: '논의', affects: '적용',
}

// ─── 변환 ───
function convertToFlowElements(items: TimelineItem[], highlightedIds?: Set<string>) {
  const nodes: Node<FlowNodeData>[] = []
  const edges: Edge[] = []
  const codeToId = new Map<string, string>()

  items.forEach((item) => {
    codeToId.set(item.code, item.id)
    const on = !highlightedIds || highlightedIds.has(item.id)

    nodes.push({
      id: item.id,
      type: item.type as FlowNodeType,
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

  items.forEach((item) => {
    item.connections.sources.forEach((src) => {
      const from = codeToId.get(src.code)
      if (!from) return
      const id = `e-${from}-${item.id}`
      if (edges.find(e => e.id === id)) return

      const style = getEdgeStyle(src.relation)
      const on = !highlightedIds || (highlightedIds.has(item.id) && highlightedIds.has(from))

      edges.push({
        id, source: from, target: item.id,
        label: EDGE_LABELS[src.relation] || src.relation,
        animated: src.relation === 'changed_by',
        style: { ...style, opacity: on ? 0.7 : 0.1 },
        labelStyle: { fontSize: 11, fill: style.stroke, fontWeight: 600, opacity: on ? 1 : 0.2 },
        labelBgStyle: { fill: 'hsl(var(--background))', fillOpacity: on ? 0.85 : 0.2 },
        labelBgPadding: [6, 3] as [number, number],
        labelBgBorderRadius: 4,
        markerEnd: { type: MarkerType.ArrowClosed, color: style.stroke, width: 16, height: 16 },
      })
    })
  })

  return { nodes, edges }
}

// ─── 필터 타입 ───
type NodeTypeFilter = 'all' | FlowNodeType
type AreaFilter = 'all' | '기획' | '디자인' | '개발'
type SourceTypeFilter = 'all' | 'meeting' | 'slack' | 'notion' | 'call' | 'email' | 'document' | 'text'

const NODE_TYPE_OPTIONS: { value: NodeTypeFilter; label: string; icon: React.ElementType }[] = [
  { value: 'meeting', label: '미팅', icon: Calendar },
  { value: 'decision', label: '결정', icon: GitBranch },
  { value: 'screen', label: '화면', icon: MonitorSmartphone },
  { value: 'github', label: 'Github', icon: GithubIcon },
  { value: 'slack', label: 'Slack', icon: MessageSquare },
]

const AREA_OPTIONS: { value: AreaFilter; label: string; dot: string }[] = [
  { value: '기획', label: '기획', dot: 'bg-purple-500' },
  { value: '디자인', label: '디자인', dot: 'bg-pink-500' },
  { value: '개발', label: '개발', dot: 'bg-sky-500' },
]

const SOURCE_TYPE_OPTIONS: { value: SourceTypeFilter; label: string; icon: React.ElementType }[] = [
  { value: 'meeting', label: '회의', icon: Mic },
  { value: 'slack', label: 'Slack', icon: MessageSquare },
  { value: 'notion', label: 'Notion', icon: BookOpen },
  { value: 'call', label: '통화', icon: Phone },
  { value: 'email', label: '이메일', icon: Mail },
  { value: 'document', label: '문서', icon: FileText },
  { value: 'text', label: '텍스트', icon: FileText },
]

const norm = (a?: string) => {
  if (a === 'planning') return '기획'
  if (a === 'design') return '디자인'
  if (a === 'dev') return '개발'
  return a || ''
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// FlowView
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export function FlowView({ items }: FlowViewProps) {
  const [nodeTypeFilter, setNodeTypeFilter] = useState<NodeTypeFilter>('all')
  const [areaFilter, setAreaFilter] = useState<AreaFilter>('all')
  const [sourceTypeFilter, setSourceTypeFilter] = useState<SourceTypeFilter>('all')
  const [contextCardOpen, setContextCardOpen] = useState(false)
  const [contextCardData, setContextCardData] = useState<ContextCardData | null>(null)

  const existing = useMemo(() => {
    const types = new Set<string>(items.map(i => i.type))
    const areas = new Set(items.map(i => norm(i.area)).filter(Boolean))
    const sources = new Set(items.map(i => i.sourceType).filter(Boolean))
    return {
      nodeTypes: NODE_TYPE_OPTIONS.filter(o => types.has(o.value)),
      areas: AREA_OPTIONS.filter(o => areas.has(o.value)),
      sources: SOURCE_TYPE_OPTIONS.filter(o => sources.has(o.value as string)),
    }
  }, [items])

  const hasFilter = nodeTypeFilter !== 'all' || areaFilter !== 'all' || sourceTypeFilter !== 'all'

  const highlightedIds = useMemo(() => {
    if (!hasFilter) return undefined
    const ids = new Set<string>()
    items.forEach(item => {
      let ok = true
      if (nodeTypeFilter !== 'all' && item.type !== nodeTypeFilter) ok = false
      if (areaFilter !== 'all' && norm(item.area) !== areaFilter && item.type !== 'meeting') ok = false
      if (sourceTypeFilter !== 'all' && item.sourceType !== sourceTypeFilter) ok = false
      if (ok) ids.add(item.id)
    })
    return ids
  }, [items, nodeTypeFilter, areaFilter, sourceTypeFilter, hasFilter])

  const { initialNodes, initialEdges } = useMemo(() => {
    const { nodes: rawNodes, edges: rawEdges } = convertToFlowElements(items, highlightedIds)
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(rawNodes, rawEdges)
    return { initialNodes: layoutedNodes, initialEdges: layoutedEdges }
  }, [items, highlightedIds])

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  useEffect(() => {
    setNodes(initialNodes)
    setEdges(initialEdges)
  }, [initialNodes, initialEdges, setNodes, setEdges])

  const loadContextData = useCallback(async (itemId: string) => {
    try {
      const res = await fetch(`/api/items/${itemId}/context`)
      if (res.ok) { setContextCardData(await res.json()); setContextCardOpen(true) }
    } catch {}
  }, [])

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node<FlowNodeData>) => {
    loadContextData(node.id)
  }, [loadContextData])

  // ─── 필터 버튼 컴포넌트 ───
  const FilterBtn = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors
        ${active ? 'bg-foreground text-background' : 'bg-secondary/60 text-muted-foreground hover:bg-secondary'}`}
    >
      {children}
    </button>
  )

  return (
    <div className="h-[calc(100vh-120px)] min-h-[500px] flex flex-col overflow-hidden">
      {/* ─── 상단 필터바 ─── */}
      <div className="shrink-0 flex items-center gap-2.5 px-4 py-2.5 border-b border-border/30 bg-muted/10 flex-wrap">
        <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />

        {existing.nodeTypes.map(o => (
          <FilterBtn key={o.value} active={nodeTypeFilter === o.value} onClick={() => setNodeTypeFilter(nodeTypeFilter === o.value ? 'all' : o.value)}>
            <o.icon className="h-3.5 w-3.5" />{o.label}
          </FilterBtn>
        ))}

        {existing.areas.length > 0 && (
          <>
            <div className="w-px h-4 bg-border/40" />
            {existing.areas.map(o => (
              <FilterBtn key={o.value} active={areaFilter === o.value} onClick={() => setAreaFilter(areaFilter === o.value ? 'all' : o.value)}>
                <span className={`w-2 h-2 rounded-full ${o.dot}`} />{o.label}
              </FilterBtn>
            ))}
          </>
        )}

        {existing.sources.length > 0 && (
          <>
            <div className="w-px h-4 bg-border/40" />
            {existing.sources.map(o => (
              <FilterBtn key={o.value} active={sourceTypeFilter === o.value} onClick={() => setSourceTypeFilter(sourceTypeFilter === o.value ? 'all' : o.value)}>
                <o.icon className="h-3.5 w-3.5" />{o.label}
              </FilterBtn>
            ))}
          </>
        )}

        {hasFilter && (
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground ml-auto"
            onClick={() => { setNodeTypeFilter('all'); setAreaFilter('all'); setSourceTypeFilter('all') }}>
            <X className="h-3 w-3 mr-1" />초기화
          </Button>
        )}
      </div>

      {/* ─── 캔버스 ─── */}
      <div className="flex-1">
        <ReactFlow
          nodes={nodes} edges={edges}
          onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView fitViewOptions={{ padding: 0.4 }}
          minZoom={0.15} maxZoom={2}
          attributionPosition="bottom-left"
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="hsl(var(--border) / 0.5)" />
          <Controls className="!bg-secondary/80 !border-border/50 !rounded-xl overflow-hidden" showInteractive={false} />

          <Panel position="bottom-right" className="!m-3">
            <div className="bg-background/90 backdrop-blur rounded-lg border border-border/40 px-3 py-1.5 shadow">
              <p className="text-[11px] text-muted-foreground">클릭 → 상세 • 드래그 → 이동 • 스크롤 → 줌</p>
            </div>
          </Panel>
        </ReactFlow>
      </div>

      <ContextCard
        open={contextCardOpen} onOpenChange={setContextCardOpen}
        data={contextCardData}
        onNavigate={(id) => loadContextData(id)}
        onViewInFlow={() => {}}
      />
    </div>
  )
}
