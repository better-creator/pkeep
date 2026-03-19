'use client'

import { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import {
  GitBranch, Calendar, MonitorSmartphone, Github, MessageSquare,
  Mic, BookOpen, Phone, Mail, FileText, AlertTriangle, ListChecks,
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
// 미팅 노드
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
// 결정 노드 — 이슈 강조 + 선택 시 확장
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function DecisionNodeInner({ data, selected }: NodeProps<FlowNodeData>) {
  const hasIssue = data.hasConflict || data.hasBlocker
  const bar = hasIssue ? 'bg-red-500' : (data.status ? STATUS_BAR[data.status] || 'bg-zinc-300' : 'bg-zinc-300')

  const taskProgress = data.tasks?.length
    ? { total: data.tasks.length, done: data.tasks.filter(t => t.status === 'done').length }
    : null

  // description에서 근거 추출 (형식: "[영역] 근거 텍스트")
  const rationale = data.description?.replace(/^\[.*?\]\s*/, '') || ''

  return (
    <div className={`flex rounded-xl border overflow-hidden cursor-pointer transition-all
      ${selected ? 'min-w-[300px] max-w-[380px]' : 'min-w-[220px] max-w-[280px]'}
      ${hasIssue
        ? 'border-red-400 bg-red-50/80 shadow-[0_0_12px_rgba(239,68,68,0.15)]'
        : 'bg-card border-border/50'}
      ${selected ? 'ring-2 ring-orange-500 shadow-lg' : 'hover:shadow-md hover:border-border'}`}>
      <Handle type="target" position={Position.Top} className={`!w-2.5 !h-2.5 !border-2 !border-white ${hasIssue ? '!bg-red-500' : '!bg-teal-500'} !-top-1.5`} />

      {/* 상태 바 */}
      <div className={`w-1.5 shrink-0 ${bar}`} />

      <div className="px-3 py-2.5 min-w-0 flex-1">
        {/* 코드 + 메타 */}
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-xs font-mono font-bold text-foreground/60">{data.code}</span>
          {data.status && STATUS_LABEL[data.status] && (
            <span className={`text-[10px] font-semibold ${hasIssue ? 'text-red-600' : ''}`}>
              {hasIssue ? '이슈' : STATUS_LABEL[data.status]}
            </span>
          )}
          {/* 이슈 강조 아이콘 */}
          {hasIssue && (
            <span className="flex items-center gap-0.5 ml-auto bg-red-100 rounded-md px-1.5 py-0.5">
              <AlertTriangle className="h-3 w-3 text-red-600" />
              <span className="text-[9px] font-bold text-red-600">주의</span>
            </span>
          )}
          {data.area && AREA_DOT[data.area] && !hasIssue && (
            <span className="flex items-center gap-0.5 ml-auto">
              <span className={`w-1.5 h-1.5 rounded-full ${AREA_DOT[data.area]}`} />
              <span className="text-[10px] text-muted-foreground">{AREA_LABEL[data.area]}</span>
            </span>
          )}
        </div>

        {/* 제목 */}
        <p className={`font-semibold leading-snug ${selected ? 'text-sm' : 'text-sm line-clamp-2'}`}>{data.title}</p>

        {/* 제안자 */}
        {data.owner && (
          <p className="text-[11px] text-muted-foreground mt-1 truncate">{data.owner.name}</p>
        )}

        {/* ─── 선택 시 확장 영역 ─── */}
        {selected && (
          <div className="mt-2 pt-2 border-t border-border/30 space-y-2">
            {/* 근거(Why) */}
            {rationale && (
              <div className="rounded-lg bg-amber-50 border border-amber-200/50 px-2.5 py-2">
                <p className="text-[10px] font-semibold text-amber-600 mb-0.5">왜?</p>
                <p className="text-xs text-amber-900/80 leading-relaxed">{rationale}</p>
              </div>
            )}

            {/* 영역 (이슈인 경우에도 표시) */}
            {hasIssue && data.area && AREA_DOT[data.area] && (
              <div className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${AREA_DOT[data.area]}`} />
                <span className="text-xs text-muted-foreground">{AREA_LABEL[data.area]}</span>
              </div>
            )}

            {/* 태스크 진행률 */}
            {taskProgress && (
              <div className="flex items-center gap-2">
                <ListChecks className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{taskProgress.done}/{taskProgress.total}</span>
                <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${taskProgress.total > 0 ? (taskProgress.done / taskProgress.total) * 100 : 0}%` }} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} className={`!w-2.5 !h-2.5 !border-2 !border-white ${hasIssue ? '!bg-red-500' : '!bg-teal-500'} !-bottom-1.5`} />
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
