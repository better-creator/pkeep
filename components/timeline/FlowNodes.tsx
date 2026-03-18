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
  status?: string
  type: FlowNodeType
  owner?: Person
  contributors?: Person[]
  tasks?: Task[]
  area?: string
  sourceType?: string
  hasConflict?: boolean
  hasBlocker?: boolean
}

// ─── 색상 ───
const STATUS_BAR: Record<string, string> = {
  confirmed: 'bg-emerald-500', changed: 'bg-amber-500', pending: 'bg-zinc-400',
  rejected: 'bg-red-500', hold: 'bg-zinc-400',
}
const STATUS_LABEL: Record<string, string> = {
  confirmed: '확정', changed: '변경', pending: '보류', rejected: '기각', hold: '보류',
}
const AREA_DOT: Record<string, string> = {
  planning: 'bg-purple-500', '기획': 'bg-purple-500',
  design: 'bg-pink-500', '디자인': 'bg-pink-500',
  dev: 'bg-sky-500', '개발': 'bg-sky-500',
}
const AREA_LABEL: Record<string, string> = {
  planning: '기획', design: '디자인', dev: '개발', '기획': '기획', '디자인': '디자인', '개발': '개발',
}
const SOURCE_ICON: Record<string, React.ElementType> = {
  meeting: Mic, slack: MessageSquare, notion: BookOpen,
  call: Phone, email: Mail, document: FileText, text: FileText,
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 미팅 노드 — 컴팩트 pill
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function MeetingNodeInner({ data, selected }: NodeProps<FlowNodeData>) {
  const SrcIcon = (data.sourceType && SOURCE_ICON[data.sourceType]) || Calendar
  return (
    <div className={`flex items-center gap-2.5 px-4 py-2.5 rounded-full border-2 bg-blue-50 border-blue-400/50 cursor-pointer transition-all
      ${selected ? 'ring-2 ring-blue-500 shadow-lg' : 'hover:shadow-md'}`}>
      <Handle type="target" position={Position.Top} className="!w-2.5 !h-2.5 !border-2 !border-white !bg-blue-500 !-top-1.5" />
      <SrcIcon className="h-4 w-4 text-blue-500 shrink-0" />
      <span className="text-xs font-mono font-bold text-blue-600">{data.code}</span>
      <span className="text-sm font-medium truncate max-w-[140px]">{data.title}</span>
      <Handle type="source" position={Position.Bottom} className="!w-2.5 !h-2.5 !border-2 !border-white !bg-blue-500 !-bottom-1.5" />
    </div>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 결정 노드 — 좌측 상태 바 카드
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function DecisionNodeInner({ data, selected }: NodeProps<FlowNodeData>) {
  const hasIssue = data.hasConflict || data.hasBlocker
  const bar = hasIssue ? 'bg-red-500' : (data.status ? STATUS_BAR[data.status] || 'bg-zinc-300' : 'bg-zinc-300')

  return (
    <div className={`flex rounded-xl border bg-card overflow-hidden min-w-[220px] max-w-[280px] cursor-pointer transition-all
      ${hasIssue ? 'border-red-400/50' : 'border-border/50'}
      ${selected ? 'ring-2 ring-orange-500 shadow-lg' : 'hover:shadow-md hover:border-border'}`}>
      <Handle type="target" position={Position.Top} className="!w-2.5 !h-2.5 !border-2 !border-white !bg-teal-500 !-top-1.5" />

      {/* 상태 바 */}
      <div className={`w-1 shrink-0 ${bar}`} />

      <div className="px-3 py-2.5 min-w-0 flex-1">
        {/* 코드 + 메타 */}
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-xs font-mono font-bold text-foreground/60">{data.code}</span>
          {data.status && STATUS_LABEL[data.status] && (
            <span className={`text-[10px] font-semibold ${hasIssue ? 'text-red-500' : ''}`}>
              {hasIssue ? '이슈' : STATUS_LABEL[data.status]}
            </span>
          )}
          {hasIssue && <AlertTriangle className="h-3 w-3 text-red-500 ml-auto" />}
          {data.area && AREA_DOT[data.area] && !hasIssue && (
            <span className="flex items-center gap-0.5 ml-auto">
              <span className={`w-1.5 h-1.5 rounded-full ${AREA_DOT[data.area]}`} />
              <span className="text-[10px] text-muted-foreground">{AREA_LABEL[data.area]}</span>
            </span>
          )}
        </div>

        {/* 제목 */}
        <p className="text-sm font-semibold leading-snug line-clamp-2">{data.title}</p>

        {/* 제안자 */}
        {data.owner && (
          <p className="text-[11px] text-muted-foreground mt-1 truncate">{data.owner.name}</p>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} className="!w-2.5 !h-2.5 !border-2 !border-white !bg-teal-500 !-bottom-1.5" />
    </div>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 기타 노드
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const OTHER: Record<string, { icon: React.ElementType; color: string; handle: string }> = {
  screen: { icon: MonitorSmartphone, color: 'text-purple-500', handle: '!bg-purple-500' },
  github: { icon: Github, color: 'text-zinc-500', handle: '!bg-zinc-500' },
  slack:  { icon: MessageSquare, color: 'text-amber-500', handle: '!bg-amber-500' },
}

function OtherNodeInner({ data, selected }: NodeProps<FlowNodeData>) {
  const s = OTHER[data.type] || OTHER.github
  const Icon = s.icon
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border bg-card min-w-[160px] max-w-[220px] cursor-pointer transition-all
      border-border/50 ${selected ? 'ring-2 ring-primary shadow-lg' : 'hover:shadow-md'}`}>
      <Handle type="target" position={Position.Top} className={`!w-2.5 !h-2.5 !border-2 !border-white ${s.handle} !-top-1.5`} />
      <Icon className={`h-4 w-4 ${s.color} shrink-0`} />
      <div className="min-w-0">
        <p className="text-[10px] font-mono font-bold text-muted-foreground">{data.code}</p>
        <p className="text-xs font-medium truncate">{data.title}</p>
      </div>
      <Handle type="source" position={Position.Bottom} className={`!w-2.5 !h-2.5 !border-2 !border-white ${s.handle} !-bottom-1.5`} />
    </div>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const MeetingNode = memo(MeetingNodeInner); MeetingNode.displayName = 'MeetingNode'
export const DecisionNode = memo(DecisionNodeInner); DecisionNode.displayName = 'DecisionNode'
export const ScreenNode = memo(OtherNodeInner); ScreenNode.displayName = 'ScreenNode'
export const GithubNode = memo(OtherNodeInner); GithubNode.displayName = 'GithubNode'
export const SlackNode = memo(OtherNodeInner); SlackNode.displayName = 'SlackNode'

export const nodeTypes = {
  meeting: MeetingNode, decision: DecisionNode,
  screen: ScreenNode, github: GithubNode, slack: SlackNode,
}
