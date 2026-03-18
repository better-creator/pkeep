'use client'

import { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import {
  GitBranch, Calendar, MonitorSmartphone, Github, MessageSquare,
  Mic, BookOpen, Phone, Mail, FileText, AlertTriangle,
} from 'lucide-react'
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
  area?: string
  sourceType?: string
  hasConflict?: boolean
  hasBlocker?: boolean
}

// ─── 상태 색상 (좌측 바 + 텍스트) ───
const STATUS_COLORS: Record<string, { bar: string; text: string; label: string }> = {
  confirmed: { bar: 'bg-emerald-500', text: 'text-emerald-500', label: '확정' },
  changed:   { bar: 'bg-amber-500',   text: 'text-amber-500',   label: '변경' },
  pending:   { bar: 'bg-zinc-400',     text: 'text-zinc-400',    label: '보류' },
  rejected:  { bar: 'bg-red-500',      text: 'text-red-500',     label: '기각' },
  hold:      { bar: 'bg-zinc-400',     text: 'text-zinc-400',    label: '보류' },
}

// ─── 영역 색상 ───
const AREA_COLORS: Record<string, { dot: string; label: string }> = {
  planning: { dot: 'bg-purple-500', label: '기획' },
  '기획':   { dot: 'bg-purple-500', label: '기획' },
  design:   { dot: 'bg-pink-500',   label: '디자인' },
  '디자인': { dot: 'bg-pink-500',   label: '디자인' },
  dev:      { dot: 'bg-sky-500',    label: '개발' },
  '개발':   { dot: 'bg-sky-500',    label: '개발' },
}

// ─── 소스 아이콘 ───
const SOURCE_ICONS: Record<string, React.ElementType> = {
  meeting: Mic, slack: MessageSquare, notion: BookOpen,
  call: Phone, email: Mail, document: FileText, text: FileText,
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 미팅 노드 — 컴팩트 원형 + 라벨
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function MeetingNodeInner({ data, selected }: NodeProps<FlowNodeData>) {
  const SourceIcon = (data.sourceType && SOURCE_ICONS[data.sourceType]) || Calendar

  return (
    <div className="flex flex-col items-center gap-2">
      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !border-2 !border-background !bg-blue-500" />

      {/* 원형 아이콘 */}
      <div
        className={`
          relative w-16 h-16 rounded-full flex items-center justify-center
          bg-blue-500/10 border-2 border-blue-500/50
          transition-all duration-150 cursor-pointer
          ${selected ? 'ring-3 ring-blue-500 shadow-lg scale-110' : 'hover:shadow-md hover:scale-105'}
        `}
      >
        <SourceIcon className="h-7 w-7 text-blue-500" />
      </div>

      {/* 라벨 */}
      <div className="text-center max-w-[160px]">
        <p className="text-xs font-mono font-bold text-blue-500">{data.code}</p>
        <p className="text-sm font-medium leading-tight line-clamp-2 mt-0.5">{data.title}</p>
      </div>

      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !border-2 !border-background !bg-blue-500" />
    </div>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 결정 노드 — 카드형, 좌측 상태 바
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function DecisionNodeInner({ data, selected }: NodeProps<FlowNodeData>) {
  const statusColor = data.status ? STATUS_COLORS[data.status] : null
  const areaColor = data.area ? AREA_COLORS[data.area] : null
  const barColor = statusColor?.bar || 'bg-zinc-300'

  const taskProgress = data.tasks?.length
    ? { total: data.tasks.length, done: data.tasks.filter(t => t.status === 'done').length }
    : null

  // 충돌: 붉은 좌측 바 + 아이콘
  const hasIssue = data.hasConflict || data.hasBlocker
  const conflictClass = hasIssue ? 'ring-2 ring-red-500/50' : ''

  return (
    <div
      className={`
        relative flex rounded-xl border border-border/60 bg-card
        min-w-[280px] max-w-[340px] overflow-hidden
        transition-all duration-150 cursor-pointer
        ${conflictClass}
        ${selected ? 'ring-2 ring-primary shadow-xl scale-[1.03]' : 'hover:shadow-md hover:border-border'}
      `}
    >
      <Handle type="target" position={Position.Top} className={`!w-3 !h-3 !border-2 !border-background ${hasIssue ? '!bg-red-500' : '!bg-teal-500'}`} />

      {/* 좌측 상태 컬러 바 */}
      <div className={`w-1.5 shrink-0 ${hasIssue ? 'bg-red-500' : barColor}`} />

      {/* 내용 */}
      <div className="flex-1 px-4 py-3.5 min-w-0">
        {/* 상단: 코드 + 상태 + 영역 */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-mono font-bold text-foreground/80">{data.code}</span>

          {statusColor && (
            <span className={`text-xs font-semibold ${statusColor.text}`}>
              {statusColor.label}
            </span>
          )}

          {areaColor && (
            <span className="flex items-center gap-1 ml-auto">
              <span className={`w-2 h-2 rounded-full ${areaColor.dot}`} />
              <span className="text-xs text-muted-foreground">{areaColor.label}</span>
            </span>
          )}

          {/* 충돌 아이콘 */}
          {hasIssue && (
            <AlertTriangle className="h-4 w-4 text-red-500 ml-auto shrink-0" />
          )}
        </div>

        {/* 제목 */}
        <p className="text-base font-semibold leading-snug line-clamp-2">{data.title}</p>

        {/* 하단: 제안자 + 태스크 */}
        <div className="flex items-center gap-3 mt-2.5 text-xs text-muted-foreground">
          {data.owner && (
            <span className="flex items-center gap-1">
              <span className="w-4 h-4 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold">
                {data.owner.name.charAt(0)}
              </span>
              {data.owner.name}
            </span>
          )}

          {taskProgress && (
            <span className="flex items-center gap-1.5 ml-auto">
              <span className="font-medium">{taskProgress.done}/{taskProgress.total}</span>
              <div className="w-12 h-1.5 rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${taskProgress.total > 0 ? (taskProgress.done / taskProgress.total) * 100 : 0}%` }}
                />
              </div>
            </span>
          )}
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className={`!w-3 !h-3 !border-2 !border-background ${hasIssue ? '!bg-red-500' : '!bg-teal-500'}`} />
    </div>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 기타 노드 (screen, github, slack) — 컴팩트 카드
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const OTHER_STYLES: Record<string, { icon: React.ElementType; color: string; border: string; handle: string }> = {
  screen: { icon: MonitorSmartphone, color: 'text-purple-500', border: 'border-purple-500/40', handle: '!bg-purple-500' },
  github: { icon: Github,           color: 'text-zinc-500',   border: 'border-zinc-500/40',   handle: '!bg-zinc-500' },
  slack:  { icon: MessageSquare,     color: 'text-amber-500',  border: 'border-amber-500/40',  handle: '!bg-amber-500' },
}

function OtherNodeInner({ data, selected }: NodeProps<FlowNodeData>) {
  const s = OTHER_STYLES[data.type] || OTHER_STYLES.github
  const Icon = s.icon

  return (
    <div
      className={`
        relative flex items-center gap-3 px-4 py-3 rounded-xl border bg-card
        min-w-[200px] max-w-[280px]
        transition-all duration-150 cursor-pointer
        ${s.border}
        ${selected ? 'ring-2 ring-primary shadow-lg scale-[1.03]' : 'hover:shadow-md'}
      `}
    >
      <Handle type="target" position={Position.Top} className={`!w-3 !h-3 !border-2 !border-background ${s.handle}`} />
      <Icon className={`h-5 w-5 ${s.color} shrink-0`} />
      <div className="min-w-0">
        <p className="text-xs font-mono font-bold text-muted-foreground">{data.code}</p>
        <p className="text-sm font-medium leading-tight line-clamp-1">{data.title}</p>
      </div>
      <Handle type="source" position={Position.Bottom} className={`!w-3 !h-3 !border-2 !border-background ${s.handle}`} />
    </div>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Exports
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const MeetingNode = memo(MeetingNodeInner)
MeetingNode.displayName = 'MeetingNode'

export const DecisionNode = memo(DecisionNodeInner)
DecisionNode.displayName = 'DecisionNode'

export const ScreenNode = memo(OtherNodeInner)
ScreenNode.displayName = 'ScreenNode'

export const GithubNode = memo(OtherNodeInner)
GithubNode.displayName = 'GithubNode'

export const SlackNode = memo(OtherNodeInner)
SlackNode.displayName = 'SlackNode'

export const nodeTypes = {
  meeting: MeetingNode,
  decision: DecisionNode,
  screen: ScreenNode,
  github: GithubNode,
  slack: SlackNode,
}
