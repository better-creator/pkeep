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
import 'reactflow/dist/style.css'
import {
  Filter, Calendar, GitBranch, MonitorSmartphone, Github as GithubIcon,
  MessageSquare, Mic, BookOpen, Phone, Mail, FileText, X,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

import { nodeTypes, FlowNodeData, FlowNodeType } from './FlowNodes'
import { ContextCard, ContextCardData } from '@/components/context-card'
import { TimelineItem, relationColors, ConnectionRelation, Task } from './types'

interface FlowViewProps {
  items: TimelineItem[]
}

// 바둑판(그리드) 레이아웃 — 노드를 격자형으로 배치
const nodeWidth = 380
const nodeHeight = 220

function getGridLayout(nodes: Node[], edges: Edge[], columns = 3) {
  const gap = 60
  const layoutedNodes = nodes.map((node, index) => {
    const col = index % columns
    const row = Math.floor(index / columns)
    return {
      ...node,
      position: {
        x: col * (nodeWidth + gap),
        y: row * (nodeHeight + gap),
      },
    }
  })
  return { nodes: layoutedNodes, edges }
}

// 관계별 엣지 스타일
function getEdgeStyle(relation: ConnectionRelation) {
  const color = relationColors[relation] || '#888'
  return { stroke: color, strokeWidth: 2 }
}

function getEdgeLabel(relation: string): string {
  const labels: Record<string, string> = {
    created_from: '생성',
    changed_by: '변경',
    implemented_in: '구현',
    discussed_in: '논의',
    affects: '적용',
  }
  return labels[relation] || relation
}

// TimelineItem을 Flow 노드/엣지로 변환
function convertToFlowElements(items: TimelineItem[], highlightedIds?: Set<string>) {
  const nodes: Node<FlowNodeData>[] = []
  const edges: Edge[] = []
  const nodeMap = new Map<string, string>()

  items.forEach((item) => {
    const nodeId = item.id
    nodeMap.set(item.code, nodeId)

    const isHighlighted = !highlightedIds || highlightedIds.has(nodeId)

    nodes.push({
      id: nodeId,
      type: item.type as FlowNodeType,
      data: {
        code: item.code,
        title: item.title,
        description: item.description,
        status: item.status,
        type: item.type as FlowNodeType,
        owner: item.owner,
        contributors: item.contributors,
        tasks: item.tasks,
        area: item.area,
        sourceType: item.sourceType,
        hasConflict: item.hasConflict,
        hasBlocker: item.hasBlocker,
      },
      position: { x: 0, y: 0 },
      style: isHighlighted ? {} : { opacity: 0.15 },
    })
  })

  items.forEach((item) => {
    const sourceId = item.id

    item.connections.sources.forEach((source) => {
      const targetNodeId = nodeMap.get(source.code)
      if (targetNodeId) {
        const edgeId = `e-${targetNodeId}-${sourceId}`
        if (!edges.find(e => e.id === edgeId)) {
          const edgeStyle = getEdgeStyle(source.relation)
          const isHighlighted = !highlightedIds || (highlightedIds.has(sourceId) && highlightedIds.has(targetNodeId))

          edges.push({
            id: edgeId,
            source: targetNodeId,
            target: sourceId,
            label: getEdgeLabel(source.relation),
            animated: source.relation === 'implemented_in' || source.relation === 'affects',
            style: {
              ...edgeStyle,
              opacity: isHighlighted ? 1 : 0.1,
            },
            labelStyle: {
              fontSize: 12,
              fill: edgeStyle.stroke,
              fontWeight: 600,
              opacity: isHighlighted ? 1 : 0.2,
            },
            labelBgStyle: {
              fill: 'hsl(var(--background))',
              fillOpacity: isHighlighted ? 0.9 : 0.2,
            },
            labelBgPadding: [8, 5] as [number, number],
            labelBgBorderRadius: 6,
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: edgeStyle.stroke,
              width: 20,
              height: 20,
            },
          })
        }
      }
    })
  })

  return { nodes, edges }
}

// 필터 옵션 타입
type NodeTypeFilter = 'all' | FlowNodeType
type AreaFilter = 'all' | '기획' | '디자인' | '개발'
type SourceTypeFilter = 'all' | 'meeting' | 'slack' | 'notion' | 'call' | 'email' | 'document' | 'text'

const NODE_TYPE_OPTIONS: { value: NodeTypeFilter; label: string; icon: React.ElementType; color: string }[] = [
  { value: 'meeting', label: '미팅', icon: Calendar, color: 'bg-blue-500' },
  { value: 'decision', label: '결정', icon: GitBranch, color: 'bg-teal-500' },
  { value: 'screen', label: '화면', icon: MonitorSmartphone, color: 'bg-purple-500' },
  { value: 'github', label: 'Github', icon: GithubIcon, color: 'bg-zinc-600' },
  { value: 'slack', label: 'Slack', icon: MessageSquare, color: 'bg-amber-500' },
]

const AREA_OPTIONS: { value: AreaFilter; label: string; color: string }[] = [
  { value: '기획', label: '기획', color: 'bg-purple-500' },
  { value: '디자인', label: '디자인', color: 'bg-pink-500' },
  { value: '개발', label: '개발', color: 'bg-sky-500' },
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

const normalizeArea = (area?: string) => {
  switch (area) {
    case 'planning': return '기획'
    case 'design': return '디자인'
    case 'dev': return '개발'
    default: return area || ''
  }
}

export function FlowView({ items }: FlowViewProps) {
  const [nodeTypeFilter, setNodeTypeFilter] = useState<NodeTypeFilter>('all')
  const [areaFilter, setAreaFilter] = useState<AreaFilter>('all')
  const [sourceTypeFilter, setSourceTypeFilter] = useState<SourceTypeFilter>('all')

  const [contextCardOpen, setContextCardOpen] = useState(false)
  const [contextCardData, setContextCardData] = useState<ContextCardData | null>(null)

  // 존재하는 필터 옵션만 표시
  const existingNodeTypes = useMemo(() => {
    const types = new Set<string>(items.map(i => i.type))
    return NODE_TYPE_OPTIONS.filter(opt => types.has(opt.value))
  }, [items])

  const existingAreas = useMemo(() => {
    const areas = new Set(items.map(i => normalizeArea(i.area)).filter(Boolean))
    return AREA_OPTIONS.filter(opt => areas.has(opt.value))
  }, [items])

  const existingSourceTypes = useMemo(() => {
    const sources = new Set(items.map(i => i.sourceType).filter(Boolean))
    return SOURCE_TYPE_OPTIONS.filter(opt => sources.has(opt.value))
  }, [items])

  const hasActiveFilter = nodeTypeFilter !== 'all' || areaFilter !== 'all' || sourceTypeFilter !== 'all'

  // 필터링된 하이라이트 ID
  const highlightedIds = useMemo(() => {
    if (!hasActiveFilter) return undefined

    const ids = new Set<string>()
    items.forEach(item => {
      let match = true
      if (nodeTypeFilter !== 'all' && item.type !== nodeTypeFilter) match = false
      if (areaFilter !== 'all' && normalizeArea(item.area) !== areaFilter && item.type !== 'meeting') match = false
      if (sourceTypeFilter !== 'all' && item.sourceType !== sourceTypeFilter) match = false
      if (match) ids.add(item.id)
    })
    return ids
  }, [items, nodeTypeFilter, areaFilter, sourceTypeFilter, hasActiveFilter])

  // 그리드 컬럼 수 계산
  const columns = useMemo(() => {
    const count = items.length
    if (count <= 2) return 2
    if (count <= 6) return 3
    return 4
  }, [items.length])

  // 노드와 엣지 생성 및 그리드 레이아웃
  const { initialNodes, initialEdges } = useMemo(() => {
    const { nodes, edges } = convertToFlowElements(items, highlightedIds)
    const layouted = getGridLayout(nodes, edges, columns)
    return { initialNodes: layouted.nodes, initialEdges: layouted.edges }
  }, [items, highlightedIds, columns])

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  // initialNodes/initialEdges가 바뀌면 동기화
  useEffect(() => {
    setNodes(initialNodes)
    setEdges(initialEdges)
  }, [initialNodes, initialEdges, setNodes, setEdges])

  const loadContextData = useCallback(async (itemId: string) => {
    try {
      const response = await fetch(`/api/items/${itemId}/context`)
      if (response.ok) {
        const data = await response.json()
        setContextCardData(data)
        setContextCardOpen(true)
      }
    } catch (error) {
      console.error('Error loading context data:', error)
    }
  }, [])

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node<FlowNodeData>) => {
    loadContextData(node.id)
  }, [loadContextData])

  const handleContextNavigate = useCallback((itemId: string) => {
    loadContextData(itemId)
  }, [loadContextData])

  const handleViewInFlow = useCallback((itemId: string) => {
    console.log('Focus on node:', itemId)
  }, [])

  return (
    <div className="h-[calc(100vh-120px)] min-h-[500px] flex flex-col overflow-hidden">
      {/* 상단 필터바 */}
      <div className="shrink-0 flex items-center gap-3 px-4 py-3 border-b border-border/30 bg-muted/20 flex-wrap">
        <Filter className="h-4 w-4 text-muted-foreground shrink-0" />

        {/* 노드 타입 필터 */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground font-medium mr-1">타입</span>
          {existingNodeTypes.map((opt) => {
            const active = nodeTypeFilter === opt.value
            const OptIcon = opt.icon
            return (
              <button
                key={opt.value}
                onClick={() => setNodeTypeFilter(active ? 'all' : opt.value)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all
                  ${active
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
                  }`}
              >
                <OptIcon className="h-3.5 w-3.5" />
                {opt.label}
              </button>
            )
          })}
        </div>

        <div className="w-px h-5 bg-border/50" />

        {/* 영역 필터 */}
        {existingAreas.length > 0 && (
          <>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground font-medium mr-1">영역</span>
              {existingAreas.map((opt) => {
                const active = areaFilter === opt.value
                return (
                  <button
                    key={opt.value}
                    onClick={() => setAreaFilter(active ? 'all' : opt.value)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all
                      ${active
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
                      }`}
                  >
                    <div className={`w-2.5 h-2.5 rounded-full ${opt.color}`} />
                    {opt.label}
                  </button>
                )
              })}
            </div>
            <div className="w-px h-5 bg-border/50" />
          </>
        )}

        {/* 소스 타입 필터 */}
        {existingSourceTypes.length > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground font-medium mr-1">소스</span>
            {existingSourceTypes.map((opt) => {
              const active = sourceTypeFilter === opt.value
              const OptIcon = opt.icon
              return (
                <button
                  key={opt.value}
                  onClick={() => setSourceTypeFilter(active ? 'all' : opt.value)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all
                    ${active
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
                    }`}
                >
                  <OptIcon className="h-3.5 w-3.5" />
                  {opt.label}
                </button>
              )
            })}
          </div>
        )}

        {/* 필터 초기화 */}
        {hasActiveFilter && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-muted-foreground ml-auto"
            onClick={() => {
              setNodeTypeFilter('all')
              setAreaFilter('all')
              setSourceTypeFilter('all')
            }}
          >
            <X className="h-3.5 w-3.5 mr-1" />
            초기화
          </Button>
        )}
      </div>

      {/* ReactFlow 캔버스 */}
      <div className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          minZoom={0.2}
          maxZoom={1.5}
          attributionPosition="bottom-left"
          proOptions={{ hideAttribution: true }}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={24}
            size={1}
            color="hsl(var(--border))"
          />
          <Controls
            className="!bg-secondary/80 !border-border/50 !rounded-xl overflow-hidden"
            showInteractive={false}
          />

          {/* 안내 */}
          <Panel position="bottom-right" className="!m-4">
            <div className="bg-background/95 backdrop-blur-sm rounded-xl border border-border/50 px-4 py-2.5 shadow-lg">
              <p className="text-xs text-muted-foreground">
                노드 클릭 → 상세 정보 • 드래그 → 이동 • 스크롤 → 확대/축소
              </p>
            </div>
          </Panel>
        </ReactFlow>
      </div>

      {/* 맥락 카드 */}
      <ContextCard
        open={contextCardOpen}
        onOpenChange={setContextCardOpen}
        data={contextCardData}
        onNavigate={handleContextNavigate}
        onViewInFlow={handleViewInFlow}
      />
    </div>
  )
}
