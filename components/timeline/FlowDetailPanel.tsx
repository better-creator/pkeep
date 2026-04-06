'use client'

import { Node } from 'reactflow'
import { X, GitBranch, Calendar, MonitorSmartphone, Github, ArrowDownLeft, ArrowUpRight, ExternalLink, User, Users, CheckCircle2, Circle, Clock, ListTodo } from 'lucide-react'
import { SlackIcon } from '@/components/brand/ServiceIcons'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { FlowNodeData, FlowNodeType } from './FlowNodes'
import { Connection as TimelineConnection, TimelineItem, Task } from './types'

interface FlowDetailPanelProps {
  node: Node<FlowNodeData>
  item?: TimelineItem
  connections: {
    sources: TimelineConnection[]
    impacts: TimelineConnection[]
  }
  onClose: () => void
}

const typeConfig: Record<FlowNodeType, {
  icon: React.ElementType
  color: string
  bgColor: string
  label: string
}> = {
  meeting: { icon: Calendar, color: 'text-blue-400', bgColor: 'bg-blue-500/10', label: '미팅' },
  decision: { icon: GitBranch, color: 'text-teal-400', bgColor: 'bg-teal-500/10', label: '결정' },
  screen: { icon: MonitorSmartphone, color: 'text-purple-400', bgColor: 'bg-purple-500/10', label: '화면' },
  github: { icon: Github, color: 'text-zinc-400', bgColor: 'bg-zinc-500/10', label: 'Github' },
  slack: { icon: SlackIcon, color: 'text-amber-400', bgColor: 'bg-amber-500/10', label: 'Slack' },
}

const statusLabels: Record<string, { text: string, className: string }> = {
  confirmed: { text: '확정', className: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  changed: { text: '변경됨', className: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  pending: { text: '검토중', className: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30' },
  superseded: { text: '대체됨', className: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
  deprecated: { text: '폐기', className: 'bg-red-500/20 text-red-400 border-red-500/30' },
  disabled: { text: '비활성', className: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
  draft: { text: '초안', className: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
}

const relationLabels: Record<string, { text: string, color: string }> = {
  created_from: { text: '에서 생성됨', color: 'text-blue-400' },
  changed_by: { text: '에 의해 변경됨', color: 'text-amber-400' },
  implemented_in: { text: '에서 구현됨', color: 'text-emerald-400' },
  discussed_in: { text: '에서 논의됨', color: 'text-violet-400' },
  affects: { text: '에 적용됨', color: 'text-pink-400' },
}

const typeIconMap: Record<string, React.ElementType> = {
  meeting: Calendar,
  decision: GitBranch,
  screen: MonitorSmartphone,
  github: Github,
  slack: SlackIcon,
}

// 태스크 상태 아이콘
function TaskStatusIcon({ status }: { status: Task['status'] }) {
  switch (status) {
    case 'done':
      return <CheckCircle2 className="h-4 w-4 text-emerald-500" />
    case 'in_progress':
      return <Clock className="h-4 w-4 text-blue-500" />
    default:
      return <Circle className="h-4 w-4 text-zinc-400" />
  }
}

const taskStatusLabels: Record<Task['status'], string> = {
  todo: '할 일',
  in_progress: '진행 중',
  done: '완료',
}

export function FlowDetailPanel({ node, item, connections, onClose }: FlowDetailPanelProps) {
  const { data } = node
  const config = typeConfig[data.type]
  const Icon = config.icon

  return (
    <div className="absolute top-0 right-0 h-full w-[420px] bg-background/98 backdrop-blur-md border-l border-border/50 shadow-2xl animate-slide-in-right">
      {/* 헤더 */}
      <div className={`flex items-center justify-between p-5 border-b border-border/50 ${config.bgColor}`}>
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-lg ${config.bgColor}`}>
            <Icon className={`h-6 w-6 ${config.color}`} />
          </div>
          <div>
            <span className="text-base font-mono text-primary font-bold">{data.code}</span>
            <p className="text-sm text-muted-foreground">{config.label}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* 내용 */}
      <div className="p-5 space-y-5 overflow-y-auto h-[calc(100%-85px)]">
        {/* 기본 정보 */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            {data.status && (
              <Badge variant="outline" className={`text-sm px-2.5 py-1 ${statusLabels[data.status].className}`}>
                {statusLabels[data.status].text}
              </Badge>
            )}
          </div>
          <h3 className="text-xl font-semibold leading-tight">{data.title}</h3>
          {data.description && (
            <p className="text-base text-muted-foreground mt-2 leading-relaxed">
              {data.description}
            </p>
          )}
        </div>

        {/* 작업자 정보 */}
        {(item?.owner || (item?.contributors && item.contributors.length > 0) || (item?.reviewers && item.reviewers.length > 0)) && (
          <div className="border-t border-border/50 pt-4">
            <div className="flex items-center gap-2 mb-3 text-base">
              <User className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">담당자</span>
            </div>
            <div className="space-y-3">
              {/* 주 작업자 */}
              {item?.owner && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/20">
                  <Avatar className="h-9 w-9 ring-2 ring-primary/30">
                    <AvatarFallback className="text-base bg-primary/20 text-primary font-medium">
                      {item.owner.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-base font-medium">{item.owner.name}</p>
                    <p className="text-sm text-primary">주 담당자</p>
                  </div>
                </div>
              )}

              {/* 참여자 */}
              {item?.contributors && item.contributors.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2 flex items-center gap-1.5">
                    <Users className="h-4 w-4" />
                    참여자
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {item.contributors.map((person) => (
                      <div key={person.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/50">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs bg-secondary text-foreground">
                            {person.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{person.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 리뷰어 */}
              {item?.reviewers && item.reviewers.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">참고자/리뷰어</p>
                  <div className="flex flex-wrap gap-2">
                    {item.reviewers.map((person) => (
                      <div key={person.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/30 border border-border/50">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs bg-muted text-muted-foreground">
                            {person.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-muted-foreground">{person.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 연결된 태스크 */}
        {item?.tasks && item.tasks.length > 0 && (
          <div className="border-t border-border/50 pt-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-base">
                <ListTodo className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">연결된 태스크</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {item.tasks.filter(t => t.status === 'done').length}/{item.tasks.length} 완료
              </span>
            </div>
            <div className="space-y-2">
              {item.tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors"
                >
                  <TaskStatusIcon status={task.status} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-base ${task.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>
                      {task.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs h-5 px-2">
                        {taskStatusLabels[task.status]}
                      </Badge>
                      {task.assignee && (
                        <span className="text-xs text-muted-foreground">
                          {task.assignee.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 출처 */}
        {connections.sources.length > 0 && (
          <div className="border-t border-border/50 pt-4">
            <div className="flex items-center gap-2 mb-3 text-base">
              <ArrowDownLeft className="h-5 w-5 text-blue-400" />
              <span className="font-medium">출처</span>
              <Badge variant="secondary" className="text-xs h-5 px-2">
                {connections.sources.length}
              </Badge>
            </div>
            <div className="space-y-2">
              {connections.sources.map((source) => {
                const SourceIcon = typeIconMap[source.type] || GitBranch
                const relation = relationLabels[source.relation] || { text: source.relation, color: 'text-muted-foreground' }
                return (
                  <div
                    key={source.id}
                    className="flex items-start gap-3 p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 cursor-pointer transition-colors group"
                  >
                    <SourceIcon className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-medium">{source.title}</p>
                      <p className="text-sm mt-0.5">
                        <span className="text-muted-foreground">{source.code}</span>
                        <span className={relation.color}> {relation.text}</span>
                      </p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary transition-colors shrink-0" />
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* 영향 */}
        {connections.impacts.length > 0 && (
          <div className="border-t border-border/50 pt-4">
            <div className="flex items-center gap-2 mb-3 text-base">
              <ArrowUpRight className="h-5 w-5 text-pink-400" />
              <span className="font-medium">영향</span>
              <Badge variant="secondary" className="text-xs h-5 px-2">
                {connections.impacts.length}
              </Badge>
            </div>
            <div className="space-y-2">
              {connections.impacts.map((impact) => {
                const ImpactIcon = typeIconMap[impact.type] || GitBranch
                const relation = relationLabels[impact.relation] || { text: impact.relation, color: 'text-muted-foreground' }
                return (
                  <div
                    key={impact.id}
                    className="flex items-start gap-3 p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 cursor-pointer transition-colors group"
                  >
                    <ImpactIcon className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-medium">{impact.title}</p>
                      <p className="text-sm mt-0.5">
                        <span className="text-muted-foreground">{impact.code}</span>
                        <span className={relation.color}> {relation.text}</span>
                      </p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary transition-colors shrink-0" />
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* 연결 없음 */}
        {connections.sources.length === 0 && connections.impacts.length === 0 && (
          <div className="text-center py-8 text-muted-foreground border-t border-border/50">
            <p className="text-base">연결된 항목이 없습니다</p>
          </div>
        )}

        {/* 액션 버튼 */}
        <div className="pt-2 border-t border-border/50">
          <Button variant="outline" className="w-full h-11 text-base rounded-xl border-primary/30 text-primary hover:bg-primary/10">
            상세 페이지로 이동
          </Button>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.2s ease-out;
        }
      `}</style>
    </div>
  )
}
