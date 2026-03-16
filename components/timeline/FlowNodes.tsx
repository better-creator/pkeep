'use client'

import { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { GitBranch, Calendar, MonitorSmartphone, Github, MessageSquare, Users, Mic, BookOpen, Phone, Mail, FileText, AlertTriangle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Person, Task } from './types'

export type FlowNodeType = 'meeting' | 'decision' | 'screen' | 'github' | 'slack'

export interface FlowNodeData {
  code: string
  title: string
  description?: string
  status?: 'confirmed' | 'changed' | 'pending' | 'superseded' | 'deprecated' | 'disabled' | 'draft' | 'hold'
  type: FlowNodeType
  owner?: Person
  contributors?: Person[]
  tasks?: Task[]
  area?: string           // 'planning' | 'design' | 'dev' | '기획' | '디자인' | '개발'
  sourceType?: string     // 'meeting' | 'slack' | 'notion' | 'call' | etc
  hasConflict?: boolean
  hasBlocker?: boolean
}

const nodeStyles: Record<FlowNodeType, {
  bg: string
  border: string
  iconBg: string
  iconColor: string
  icon: React.ElementType
  gradient: string
  handleColor: string
}> = {
  meeting: {
    bg: 'bg-blue-500/5',
    border: 'border-blue-500/40',
    iconBg: 'bg-blue-500',
    iconColor: 'text-white',
    icon: Calendar,
    gradient: 'from-blue-500/20 to-transparent',
    handleColor: '!bg-blue-500',
  },
  decision: {
    bg: 'bg-teal-500/5',
    border: 'border-teal-500/40',
    iconBg: 'bg-teal-500',
    iconColor: 'text-white',
    icon: GitBranch,
    gradient: 'from-teal-500/20 to-transparent',
    handleColor: '!bg-teal-500',
  },
  screen: {
    bg: 'bg-purple-500/5',
    border: 'border-purple-500/40',
    iconBg: 'bg-purple-500',
    iconColor: 'text-white',
    icon: MonitorSmartphone,
    gradient: 'from-purple-500/20 to-transparent',
    handleColor: '!bg-purple-500',
  },
  github: {
    bg: 'bg-zinc-500/5',
    border: 'border-zinc-500/40',
    iconBg: 'bg-zinc-700',
    iconColor: 'text-white',
    icon: Github,
    gradient: 'from-zinc-500/20 to-transparent',
    handleColor: '!bg-zinc-500',
  },
  slack: {
    bg: 'bg-amber-500/5',
    border: 'border-amber-500/40',
    iconBg: 'bg-amber-500',
    iconColor: 'text-white',
    icon: MessageSquare,
    gradient: 'from-amber-500/20 to-transparent',
    handleColor: '!bg-amber-500',
  },
}

const statusStyles: Record<string, {
  bg: string
  border: string
  iconBg: string
  badge: string
  label: string
  glow: string
  handleColor: string
}> = {
  confirmed: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500',
    iconBg: 'bg-emerald-500',
    badge: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    label: '확정',
    glow: 'shadow-emerald-500/20',
    handleColor: '!bg-emerald-500',
  },
  changed: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500',
    iconBg: 'bg-amber-500',
    badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    label: '변경됨',
    glow: 'shadow-amber-500/20',
    handleColor: '!bg-amber-500',
  },
  pending: {
    bg: 'bg-zinc-500/10',
    border: 'border-zinc-500/50',
    iconBg: 'bg-zinc-500',
    badge: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
    label: '검토중',
    glow: 'shadow-zinc-500/20',
    handleColor: '!bg-zinc-500',
  },
  superseded: {
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/50',
    iconBg: 'bg-purple-500',
    badge: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    label: '대체됨',
    glow: 'shadow-purple-500/20',
    handleColor: '!bg-purple-500',
  },
  deprecated: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/50',
    iconBg: 'bg-red-500',
    badge: 'bg-red-500/20 text-red-400 border-red-500/30',
    label: '폐기',
    glow: 'shadow-red-500/20',
    handleColor: '!bg-red-500',
  },
  disabled: {
    bg: 'bg-slate-500/10',
    border: 'border-slate-500/50',
    iconBg: 'bg-slate-500',
    badge: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    label: '비활성',
    glow: 'shadow-slate-500/20',
    handleColor: '!bg-slate-500',
  },
  draft: {
    bg: 'bg-gray-500/10',
    border: 'border-gray-500/50',
    iconBg: 'bg-gray-500',
    badge: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    label: '초안',
    glow: 'shadow-gray-500/20',
    handleColor: '!bg-gray-500',
  },
  hold: {
    bg: 'bg-gray-400/10',
    border: 'border-gray-400/50',
    iconBg: 'bg-gray-400',
    badge: 'bg-gray-400/20 text-gray-400 border-gray-400/30',
    label: '보류중',
    glow: 'shadow-gray-400/20',
    handleColor: '!bg-gray-400',
  },
}

// 영역 뱃지 색상
function getAreaBadgeStyle(area?: string): { bg: string; text: string; label: string } | null {
  if (!area) return null
  switch (area) {
    case 'planning':
    case '기획':
      return { bg: 'bg-purple-500/15', text: 'text-purple-400', label: '기획' }
    case 'design':
    case '디자인':
      return { bg: 'bg-pink-500/15', text: 'text-pink-400', label: '디자인' }
    case 'dev':
    case '개발':
      return { bg: 'bg-sky-500/15', text: 'text-sky-400', label: '개발' }
    default:
      return null
  }
}

// 소스 타입 아이콘 + 스타일 매핑
const sourceTypeConfig: Record<string, { icon: React.ElementType; label: string; bg: string; text: string }> = {
  meeting: { icon: Mic, label: '회의', bg: 'bg-blue-500/15', text: 'text-blue-500' },
  slack: { icon: MessageSquare, label: 'Slack', bg: 'bg-amber-500/15', text: 'text-amber-500' },
  notion: { icon: BookOpen, label: 'Notion', bg: 'bg-stone-500/15', text: 'text-stone-500' },
  call: { icon: Phone, label: '통화', bg: 'bg-green-500/15', text: 'text-green-500' },
  email: { icon: Mail, label: '이메일', bg: 'bg-rose-500/15', text: 'text-rose-500' },
  document: { icon: FileText, label: '문서', bg: 'bg-indigo-500/15', text: 'text-indigo-500' },
  text: { icon: FileText, label: '텍스트', bg: 'bg-stone-500/15', text: 'text-stone-500' },
}
const sourceTypeIcons: Record<string, React.ElementType> = Object.fromEntries(
  Object.entries(sourceTypeConfig).map(([k, v]) => [k, v.icon])
)

function BaseNode({ data, selected }: NodeProps<FlowNodeData>) {
  const nodeType = data.type
  const style = nodeStyles[nodeType]
  const Icon = style.icon

  // Decision 노드는 상태에 따라 스타일 변경
  const isDecision = nodeType === 'decision'
  const statusStyle = isDecision && data.status ? statusStyles[data.status] : null

  const bgClass = statusStyle?.bg || style.bg
  const borderClass = statusStyle?.border || style.border
  const iconBgClass = statusStyle?.iconBg || style.iconBg
  const glowClass = statusStyle?.glow || ''
  const handleColor = statusStyle?.handleColor || style.handleColor

  // 태스크 진행률 계산
  const taskProgress = data.tasks?.length
    ? {
        total: data.tasks.length,
        done: data.tasks.filter(t => t.status === 'done').length,
        inProgress: data.tasks.filter(t => t.status === 'in_progress').length,
      }
    : null

  return (
    <div
      className={`
        relative px-5 py-4 rounded-xl border-2 min-w-[240px] max-w-[300px]
        transition-all duration-200 cursor-pointer backdrop-blur-sm
        ${bgClass} ${borderClass}
        ${selected ? `ring-2 ring-primary shadow-xl scale-105 ${glowClass}` : 'hover:shadow-lg hover:scale-[1.02]'}
      `}
    >
      {/* 그라데이션 배경 */}
      <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${style.gradient} pointer-events-none`} />

      {/* 입력 핸들 */}
      <Handle
        type="target"
        position={Position.Left}
        className={`!w-3 !h-3 !border-2 !border-background ${handleColor}`}
      />

      {/* 충돌/블로커 인디케이터 */}
      {(data.hasConflict || data.hasBlocker) && (
        <div className="absolute top-2 right-2 z-10">
          <AlertTriangle className={`h-4 w-4 ${data.hasBlocker ? 'text-red-500' : 'text-amber-500'}`} />
        </div>
      )}

      {/* 소스 타입 뱃지 */}
      {data.sourceType && sourceTypeConfig[data.sourceType] && !(data.hasConflict || data.hasBlocker) && (
        <div className="absolute top-2 right-2 z-10">
          {(() => {
            const cfg = sourceTypeConfig[data.sourceType!]
            const SourceIcon = cfg.icon
            return (
              <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md ${cfg.bg}`}>
                <SourceIcon className={`h-3 w-3 ${cfg.text}`} />
                <span className={`text-[9px] font-medium ${cfg.text}`}>{cfg.label}</span>
              </div>
            )
          })()}
        </div>
      )}

      {/* 노드 내용 */}
      <div className="relative flex items-start gap-3">
        {/* 아이콘 */}
        <div className={`p-2.5 rounded-lg ${iconBgClass} shadow-sm`}>
          <Icon className={`h-5 w-5 ${style.iconColor}`} />
        </div>

        <div className="flex-1 min-w-0">
          {/* 코드 및 상태 */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-mono font-bold text-primary">
              {data.code}
            </span>
            {isDecision && data.status && statusStyle && (
              <Badge
                variant="outline"
                className={`text-xs px-2 py-0.5 h-5 border ${statusStyle.badge}`}
              >
                {statusStyle.label}
              </Badge>
            )}
          </div>

          {/* 제목 */}
          <p className="text-base font-medium leading-tight line-clamp-2" title={data.title}>
            {data.title}
          </p>

          {/* 영역 뱃지 */}
          {(() => {
            const areaBadge = getAreaBadgeStyle(data.area)
            return areaBadge ? (
              <div className={`inline-flex items-center rounded-full px-2 py-0.5 mt-1.5 text-[10px] font-medium ${areaBadge.bg} ${areaBadge.text}`}>
                {areaBadge.label}
              </div>
            ) : null
          })()}

          {/* 작업자 정보 */}
          {(data.owner || (data.contributors && data.contributors.length > 0)) && (
            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/30">
              {data.owner && (
                <div className="flex items-center gap-1.5">
                  <Avatar className="h-6 w-6 ring-2 ring-primary/30">
                    <AvatarFallback className="text-xs bg-primary/20 text-primary">
                      {data.owner.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs text-muted-foreground font-medium">
                    {data.owner.name}
                  </span>
                </div>
              )}
              {data.contributors && data.contributors.length > 0 && (
                <div className="flex items-center gap-1 ml-auto">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    +{data.contributors.length}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* 태스크 진행률 */}
          {taskProgress && (
            <div className="mt-2 pt-2 border-t border-border/30">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">태스크</span>
                <span className="text-xs font-medium">
                  {taskProgress.done}/{taskProgress.total}
                </span>
              </div>
              <div className="flex gap-0.5 h-2 rounded-full overflow-hidden bg-secondary/50">
                {taskProgress.done > 0 && (
                  <div
                    className="bg-emerald-500 transition-all"
                    style={{ width: `${(taskProgress.done / taskProgress.total) * 100}%` }}
                  />
                )}
                {taskProgress.inProgress > 0 && (
                  <div
                    className="bg-blue-500 transition-all"
                    style={{ width: `${(taskProgress.inProgress / taskProgress.total) * 100}%` }}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 출력 핸들 */}
      <Handle
        type="source"
        position={Position.Right}
        className={`!w-3 !h-3 !border-2 !border-background ${handleColor}`}
      />
    </div>
  )
}

// Meeting 노드
export const MeetingNode = memo((props: NodeProps<FlowNodeData>) => (
  <BaseNode {...props} />
))
MeetingNode.displayName = 'MeetingNode'

// Decision 노드
export const DecisionNode = memo((props: NodeProps<FlowNodeData>) => (
  <BaseNode {...props} />
))
DecisionNode.displayName = 'DecisionNode'

// Screen 노드
export const ScreenNode = memo((props: NodeProps<FlowNodeData>) => (
  <BaseNode {...props} />
))
ScreenNode.displayName = 'ScreenNode'

// Github 노드
export const GithubNode = memo((props: NodeProps<FlowNodeData>) => (
  <BaseNode {...props} />
))
GithubNode.displayName = 'GithubNode'

// Slack 노드
export const SlackNode = memo((props: NodeProps<FlowNodeData>) => (
  <BaseNode {...props} />
))
SlackNode.displayName = 'SlackNode'

// 노드 타입 맵핑
export const nodeTypes = {
  meeting: MeetingNode,
  decision: DecisionNode,
  screen: ScreenNode,
  github: GithubNode,
  slack: SlackNode,
}
