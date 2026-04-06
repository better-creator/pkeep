'use client'

import { useMemo } from 'react'
import { GitBranch, Calendar, MonitorSmartphone, Github, GripVertical, User } from 'lucide-react'
import { SlackIcon } from '@/components/brand/ServiceIcons'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { TimelineItem } from '@/components/timeline/types'

interface KanbanViewProps {
  items: TimelineItem[]
}

type KanbanColumn = {
  id: string
  title: string
  color: string
  bgColor: string
  items: TimelineItem[]
}

const typeConfig = {
  meeting: { icon: Calendar, color: 'bg-blue-500', label: '미팅' },
  decision: { icon: GitBranch, color: 'bg-teal-500', label: '결정' },
  screen: { icon: MonitorSmartphone, color: 'bg-purple-500', label: '화면' },
  github: { icon: Github, color: 'bg-zinc-600', label: 'Github' },
  slack: { icon: SlackIcon, color: 'bg-amber-500', label: 'Slack' },
}

// 결정 아이템을 상태별로 칸반 컬럼에 배치
function buildKanbanColumns(items: TimelineItem[]): KanbanColumn[] {
  const decisions = items.filter(item => item.type === 'decision')
  const implementations = items.filter(item => item.type === 'github' || item.type === 'screen')
  const meetings = items.filter(item => item.type === 'meeting')

  // 검토중 결정
  const pendingDecisions = decisions.filter(d => d.status === 'pending' || !d.status)

  // 확정된 결정 중 구현이 진행 중인 것
  const inProgressDecisions = decisions.filter(d => {
    if (d.status !== 'confirmed') return false
    // 연결된 구현이 있지만 모두 완료되지 않은 경우
    const relatedImpls = d.connections.impacts.filter(i =>
      implementations.some(impl => impl.code === i.code)
    )
    return relatedImpls.length > 0
  })

  // 완료된 결정 (구현까지 완료)
  const doneDecisions = decisions.filter(d => {
    if (d.status !== 'confirmed' && d.status !== 'changed') return false
    const relatedImpls = d.connections.impacts.filter(i =>
      implementations.some(impl => impl.code === i.code)
    )
    return relatedImpls.length === 0 || d.status === 'changed'
  }).filter(d => !pendingDecisions.includes(d) && !inProgressDecisions.includes(d))

  return [
    {
      id: 'backlog',
      title: '백로그',
      color: 'text-zinc-400',
      bgColor: 'bg-zinc-500/10',
      items: meetings,
    },
    {
      id: 'review',
      title: '검토 중',
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      items: pendingDecisions,
    },
    {
      id: 'in-progress',
      title: '진행 중',
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      items: inProgressDecisions,
    },
    {
      id: 'done',
      title: '완료',
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      items: [...doneDecisions, ...implementations],
    },
  ]
}

function KanbanCard({ item }: { item: TimelineItem }) {
  const config = typeConfig[item.type as keyof typeof typeConfig]
  const Icon = config?.icon || GitBranch

  return (
    <div className="group p-3 rounded-xl bg-background border border-border/50 hover:border-primary/30 hover:shadow-md transition-all cursor-grab active:cursor-grabbing">
      {/* 드래그 핸들 */}
      <div className="flex items-center gap-2 mb-2">
        <GripVertical className="h-4 w-4 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className={`p-1 rounded ${config?.color || 'bg-zinc-500'}`}>
          <Icon className="h-3 w-3 text-white" />
        </div>
        <span className="text-[10px] font-mono text-primary font-medium">
          {item.code}
        </span>
      </div>

      {/* 제목 */}
      <p className="text-sm font-medium leading-tight line-clamp-2 mb-2">
        {item.title}
      </p>

      {/* 메타 정보 */}
      <div className="flex items-center justify-between">
        {/* 담당자 */}
        {item.owner ? (
          <div className="flex items-center gap-1.5">
            <Avatar className="h-5 w-5">
              <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                {item.owner.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <span className="text-[10px] text-muted-foreground">
              {item.owner.name}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-muted-foreground/50">
            <User className="h-3 w-3" />
            <span className="text-[10px]">미지정</span>
          </div>
        )}

        {/* 태스크 수 */}
        {item.tasks && item.tasks.length > 0 && (
          <Badge variant="secondary" className="text-[10px] h-5">
            {item.tasks.filter(t => t.status === 'done').length}/{item.tasks.length}
          </Badge>
        )}
      </div>

      {/* 태스크 진행률 */}
      {item.tasks && item.tasks.length > 0 && (
        <div className="mt-2 pt-2 border-t border-border/30">
          <div className="flex gap-0.5 h-1 rounded-full overflow-hidden bg-secondary/50">
            {item.tasks.map((task, i) => (
              <div
                key={i}
                className={`flex-1 ${
                  task.status === 'done'
                    ? 'bg-emerald-500'
                    : task.status === 'in_progress'
                    ? 'bg-blue-500'
                    : 'bg-zinc-400/30'
                }`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function KanbanColumn({ column }: { column: KanbanColumn }) {
  return (
    <div className="flex flex-col min-w-[280px] max-w-[320px]">
      {/* 컬럼 헤더 */}
      <div className={`flex items-center justify-between p-3 rounded-t-xl ${column.bgColor}`}>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${column.color.replace('text-', 'bg-')}`} />
          <h3 className={`font-medium text-sm ${column.color}`}>{column.title}</h3>
        </div>
        <Badge variant="secondary" className="text-xs">
          {column.items.length}
        </Badge>
      </div>

      {/* 카드 목록 */}
      <div className={`flex-1 p-2 rounded-b-xl ${column.bgColor} space-y-2 min-h-[400px]`}>
        {column.items.map(item => (
          <KanbanCard key={item.id} item={item} />
        ))}
        {column.items.length === 0 && (
          <div className="flex items-center justify-center h-24 text-muted-foreground/50 text-sm">
            항목 없음
          </div>
        )}
      </div>
    </div>
  )
}

export function KanbanView({ items }: KanbanViewProps) {
  const columns = useMemo(() => buildKanbanColumns(items), [items])

  return (
    <div className="space-y-4">
      {/* 안내 */}
      <div className="flex items-center gap-2 p-3 rounded-xl bg-secondary/30">
        <span className="text-xs text-muted-foreground">
          결정 사항의 진행 상태를 칸반 보드 형식으로 확인합니다. 드래그 앤 드롭으로 상태를 변경할 수 있습니다.
        </span>
      </div>

      {/* 칸반 보드 */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map(column => (
          <KanbanColumn key={column.id} column={column} />
        ))}
      </div>
    </div>
  )
}
