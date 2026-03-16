'use client'

import { useCallback, useMemo, useState } from 'react'
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
import { Filter, ListTodo, Mic, MessageSquare, BookOpen, Phone, Mail, FileText } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { nodeTypes, FlowNodeData, FlowNodeType } from './FlowNodes'
import { ContextCard, ContextCardData } from '@/components/context-card'
import { TimelineItem, relationColors, ConnectionRelation, Task } from './types'

interface FlowViewProps {
  items: TimelineItem[]
}

// Dagre 레이아웃 설정
const nodeWidth = 260
const nodeHeight = 120

function getLayoutedElements(
  nodes: Node[],
  edges: Edge[],
  direction: 'TB' | 'LR' = 'LR'
) {
  // 매번 새 그래프 생성 (이전 데이터 누적 방지)
  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({
    rankdir: direction,
    nodesep: 40,
    ranksep: 80,
    align: 'UL',
  })

  nodes.forEach((node) => {
    g.setNode(node.id, { width: nodeWidth, height: nodeHeight })
  })

  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target)
  })

  dagre.layout(g)

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = g.node(node.id)
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    }
  })

  return { nodes: layoutedNodes, edges }
}

// 관계별 엣지 스타일
function getEdgeStyle(relation: ConnectionRelation) {
  const color = relationColors[relation] || '#888'
  return {
    stroke: color,
    strokeWidth: 2,
  }
}

// TimelineItem을 Flow 노드/엣지로 변환
function convertToFlowElements(items: TimelineItem[], highlightedIds?: Set<string>) {
  const nodes: Node<FlowNodeData>[] = []
  const edges: Edge[] = []
  const nodeMap = new Map<string, string>() // code -> id 맵핑

  // 노드 생성
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
      style: isHighlighted ? {} : { opacity: 0.3 },
    })
  })

  // 엣지 생성 (connections 기반)
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
              opacity: isHighlighted ? 1 : 0.2,
            },
            labelStyle: {
              fontSize: 10,
              fill: edgeStyle.stroke,
              fontWeight: 500,
              opacity: isHighlighted ? 1 : 0.3,
            },
            labelBgStyle: {
              fill: 'hsl(var(--background))',
              fillOpacity: isHighlighted ? 0.9 : 0.3,
            },
            labelBgPadding: [6, 4] as [number, number],
            labelBgBorderRadius: 4,
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: edgeStyle.stroke,
              width: 18,
              height: 18,
            },
          })
        }
      }
    })
  })

  return { nodes, edges }
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

// 모든 태스크 추출
function extractAllTasks(items: TimelineItem[]): Task[] {
  const tasks: Task[] = []
  items.forEach(item => {
    if (item.tasks) {
      tasks.push(...item.tasks)
    }
  })
  return tasks
}

// 태스크와 연결된 아이템 ID 찾기
function findItemsWithTask(items: TimelineItem[], taskId: string): Set<string> {
  const connectedIds = new Set<string>()

  items.forEach(item => {
    if (item.tasks?.some(t => t.id === taskId)) {
      connectedIds.add(item.id)
      // 연결된 아이템도 포함
      item.connections.sources.forEach(s => {
        const sourceItem = items.find(i => i.code === s.code)
        if (sourceItem) connectedIds.add(sourceItem.id)
      })
      item.connections.impacts.forEach(i => {
        const impactItem = items.find(it => it.code === i.code)
        if (impactItem) connectedIds.add(impactItem.id)
      })
    }
  })

  return connectedIds
}

export function FlowView({ items }: FlowViewProps) {
  const [taskFilter, setTaskFilter] = useState<string>('all')
  const [areaFilter, setAreaFilter] = useState<string>('all')

  // 맥락 카드 상태
  const [contextCardOpen, setContextCardOpen] = useState(false)
  const [contextCardData, setContextCardData] = useState<ContextCardData | null>(null)

  // 모든 태스크 목록
  const allTasks = useMemo(() => extractAllTasks(items), [items])

  // 영역 필터 normalization
  const normalizeArea = (area?: string) => {
    switch (area) {
      case 'planning': return '기획'
      case 'design': return '디자인'
      case 'dev': return '개발'
      default: return area || ''
    }
  }

  // 필터링된 하이라이트 ID
  const highlightedIds = useMemo(() => {
    let ids: Set<string> | undefined = undefined

    // 태스크 필터
    if (taskFilter !== 'all') {
      ids = findItemsWithTask(items, taskFilter)
    }

    // 영역 필터
    if (areaFilter !== 'all') {
      const areaIds = new Set<string>()
      items.forEach(item => {
        if (normalizeArea(item.area) === areaFilter || item.type === 'meeting') {
          areaIds.add(item.id)
        }
      })
      if (ids) {
        // 둘 다 적용 시 intersection
        const combined = new Set<string>()
        ids.forEach(id => { if (areaIds.has(id)) combined.add(id) })
        ids = combined
      } else {
        ids = areaIds
      }
    }

    return ids
  }, [items, taskFilter, areaFilter])

  // 노드와 엣지 생성 및 레이아웃
  const { initialNodes, initialEdges } = useMemo(() => {
    const { nodes, edges } = convertToFlowElements(items, highlightedIds)
    const layouted = getLayoutedElements(nodes, edges, 'TB')
    return { initialNodes: layouted.nodes, initialEdges: layouted.edges }
  }, [items, highlightedIds])

  const [nodes, , onNodesChange] = useNodesState(initialNodes)
  const [edges, , onEdgesChange] = useEdgesState(initialEdges)

  // 맥락 카드 데이터 로드
  const loadContextData = useCallback(async (itemId: string) => {
    try {
      const response = await fetch(`/api/items/${itemId}/context`)
      if (response.ok) {
        const data = await response.json()
        setContextCardData(data)
        setContextCardOpen(true)
      } else {
        console.error('Failed to load context data')
      }
    } catch (error) {
      console.error('Error loading context data:', error)
    }
  }, [])

  // 노드 클릭 핸들러 - 맥락 카드 열기
  const onNodeClick = useCallback((_: React.MouseEvent, node: Node<FlowNodeData>) => {
    // 노드 ID에서 실제 아이템 ID 추출 (예: 'dec-004')
    loadContextData(node.id)
  }, [loadContextData])

  // 맥락 카드 내 네비게이션
  const handleContextNavigate = useCallback((itemId: string) => {
    loadContextData(itemId)
  }, [loadContextData])

  // 플로우에서 보기 (노드 하이라이트)
  const handleViewInFlow = useCallback((itemId: string) => {
    // TODO: 해당 노드로 스크롤 및 하이라이트
    const node = nodes.find(n => n.id === itemId)
    if (node) {
      // ReactFlow의 fitView를 사용하여 해당 노드로 이동
      console.log('Focus on node:', itemId)
    }
  }, [nodes])

  return (
    <div className="h-[calc(100vh-220px)] min-h-[500px] rounded-2xl overflow-hidden border border-border/50 bg-background/50">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.3}
        maxZoom={1.5}
        attributionPosition="bottom-left"
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="hsl(var(--border))"
        />
        <Controls
          className="!bg-secondary/80 !border-border/50 !rounded-xl overflow-hidden"
          showInteractive={false}
        />

        {/* 필터 패널 */}
        <Panel position="top-right" className="!m-4">
          <div className="bg-background/95 backdrop-blur-sm rounded-xl border border-border/50 p-3 shadow-lg space-y-3">
            {/* 영역 필터 */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Filter className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold">영역 필터</span>
              </div>
              <Select value={areaFilter} onValueChange={setAreaFilter}>
                <SelectTrigger className="w-48 h-9 text-xs rounded-lg bg-secondary/50 border-0">
                  <SelectValue placeholder="영역 선택" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all" className="text-xs">전체 보기</SelectItem>
                  <SelectItem value="기획" className="text-xs">기획</SelectItem>
                  <SelectItem value="디자인" className="text-xs">디자인</SelectItem>
                  <SelectItem value="개발" className="text-xs">개발</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 태스크 필터 */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <ListTodo className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold">태스크 필터</span>
              </div>
              <Select value={taskFilter} onValueChange={setTaskFilter}>
                <SelectTrigger className="w-48 h-9 text-xs rounded-lg bg-secondary/50 border-0">
                  <SelectValue placeholder="태스크 선택" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all" className="text-xs">전체 보기</SelectItem>
                  {allTasks.map(task => (
                    <SelectItem key={task.id} value={task.id} className="text-xs">
                      {task.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {(taskFilter !== 'all' || areaFilter !== 'all') && (
              <p className="text-[10px] text-muted-foreground">
                {areaFilter !== 'all' && '선택된 영역의 노드만 강조됩니다'}
                {taskFilter !== 'all' && areaFilter !== 'all' && ' · '}
                {taskFilter !== 'all' && '선택된 태스크와 연결된 결정만 강조됩니다'}
              </p>
            )}
          </div>
        </Panel>

        {/* 범례 */}
        <Panel position="top-left" className="!m-4">
          <div className="bg-background/95 backdrop-blur-sm rounded-xl border border-border/50 p-4 shadow-lg">
            <p className="text-xs font-semibold text-foreground mb-3">노드 타입</p>
            <div className="space-y-2">
              <div className="flex items-center gap-2.5 text-xs">
                <div className="w-4 h-4 rounded bg-blue-500 shadow-sm" />
                <span className="text-muted-foreground">미팅</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs">
                <div className="w-4 h-4 rounded bg-emerald-500 shadow-sm" />
                <span className="text-muted-foreground">결정 (확정)</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs">
                <div className="w-4 h-4 rounded bg-amber-500 shadow-sm" />
                <span className="text-muted-foreground">결정 (변경됨)</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs">
                <div className="w-4 h-4 rounded bg-purple-500 shadow-sm" />
                <span className="text-muted-foreground">화면</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs">
                <div className="w-4 h-4 rounded bg-zinc-600 shadow-sm" />
                <span className="text-muted-foreground">Github</span>
              </div>
            </div>

            <div className="border-t border-border/50 mt-3 pt-3">
              <p className="text-xs font-semibold text-foreground mb-3">영역</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2.5 text-xs">
                  <div className="w-4 h-4 rounded-full bg-purple-500/15 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-purple-400" />
                  </div>
                  <span className="text-muted-foreground">기획</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs">
                  <div className="w-4 h-4 rounded-full bg-pink-500/15 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-pink-400" />
                  </div>
                  <span className="text-muted-foreground">디자인</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs">
                  <div className="w-4 h-4 rounded-full bg-sky-500/15 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-sky-400" />
                  </div>
                  <span className="text-muted-foreground">개발</span>
                </div>
              </div>
            </div>

            <div className="border-t border-border/50 mt-3 pt-3">
              <p className="text-xs font-semibold text-foreground mb-3">소스 타입</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2.5 text-xs">
                  <Mic className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">미팅</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs">
                  <MessageSquare className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">Slack</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs">
                  <BookOpen className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">Notion</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs">
                  <Phone className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">전화</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs">
                  <Mail className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">이메일</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs">
                  <FileText className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">문서</span>
                </div>
              </div>
            </div>

            <div className="border-t border-border/50 mt-3 pt-3">
              <p className="text-xs font-semibold text-foreground mb-3">연결 타입</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2.5 text-xs">
                  <div className="w-6 h-0.5 bg-blue-500 rounded" />
                  <span className="text-muted-foreground">생성</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs">
                  <div className="w-6 h-0.5 bg-amber-500 rounded" />
                  <span className="text-muted-foreground">변경</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs">
                  <div className="w-6 h-0.5 bg-emerald-500 rounded" />
                  <span className="text-muted-foreground">구현</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs">
                  <div className="w-6 h-0.5 bg-violet-500 rounded" />
                  <span className="text-muted-foreground">논의</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs">
                  <div className="w-6 h-0.5 bg-pink-500 rounded" />
                  <span className="text-muted-foreground">적용</span>
                </div>
              </div>
            </div>
          </div>
        </Panel>

        {/* 안내 */}
        <Panel position="bottom-right" className="!m-4">
          <div className="bg-background/95 backdrop-blur-sm rounded-xl border border-border/50 px-4 py-2.5 shadow-lg">
            <p className="text-xs text-muted-foreground">
              노드 클릭 → 상세 정보 • 드래그 → 이동 • 스크롤 → 확대/축소
            </p>
          </div>
        </Panel>
      </ReactFlow>

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
