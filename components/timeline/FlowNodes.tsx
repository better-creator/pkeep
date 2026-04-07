'use client'

import { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import {
  GitBranch, Calendar, MonitorSmartphone, Github,
  Mic, Phone, Mail, FileText, AlertTriangle, ListChecks,
  Image, Palette, Camera, Type, PenTool, Users, Building2,
} from 'lucide-react'
import { SlackIcon, NotionIcon } from '@/components/brand/ServiceIcons'
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
  // Content-specific
  colorChips?: string[]
  thumbnail?: string
  channel?: string
  teamName?: string
}

const STATUS_BAR: Record<string, string> = {
  confirmed: 'bg-emerald-500', changed: 'bg-amber-500', pending: 'bg-zinc-400',
  rejected: 'bg-red-500', hold: 'bg-zinc-400',
}
const STATUS_LABEL: Record<string, { label: string; bg: string; text: string }> = {
  confirmed: { label: '확정', bg: 'bg-emerald-100', text: 'text-emerald-700' },
  changed: { label: '변경', bg: 'bg-amber-100', text: 'text-amber-700' },
  pending: { label: '대기', bg: 'bg-zinc-100', text: 'text-zinc-600' },
  rejected: { label: '기각', bg: 'bg-red-100', text: 'text-red-700' },
  hold: { label: '보류', bg: 'bg-zinc-100', text: 'text-zinc-600' },
}

const AREA_CONFIG: Record<string, { icon: React.ElementType; bg: string; text: string; label: string }> = {
  '컬러': { icon: Palette, bg: 'bg-pink-100', text: 'text-pink-700', label: '컬러' },
  '촬영': { icon: Camera, bg: 'bg-amber-100', text: 'text-amber-700', label: '촬영' },
  '채널': { icon: MonitorSmartphone, bg: 'bg-sky-100', text: 'text-sky-700', label: '채널' },
  '카피': { icon: PenTool, bg: 'bg-purple-100', text: 'text-purple-700', label: '카피' },
  '브랜딩': { icon: Type, bg: 'bg-violet-100', text: 'text-violet-700', label: '브랜딩' },
  '디자인': { icon: Palette, bg: 'bg-pink-100', text: 'text-pink-700', label: '디자인' },
  '기획': { icon: FileText, bg: 'bg-blue-100', text: 'text-blue-700', label: '기획' },
  planning: { icon: FileText, bg: 'bg-blue-100', text: 'text-blue-700', label: '기획' },
  design: { icon: Palette, bg: 'bg-pink-100', text: 'text-pink-700', label: '디자인' },
  dev: { icon: Github, bg: 'bg-sky-100', text: 'text-sky-700', label: '개발' },
}

const SOURCE_ICON: Record<string, React.ElementType> = {
  meeting: Mic, slack: SlackIcon, notion: NotionIcon,
  call: Phone, email: Mail, document: FileText, text: FileText, zoom: Mic,
}

// Unsplash thumbnails for screen nodes
const SCREEN_THUMBS: Record<string, string> = {
  'SCR-001': 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=160&h=100&fit=crop&q=80',
  'SCR-002': 'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=160&h=100&fit=crop&q=80',
  'SCR-003': 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=160&h=100&fit=crop&q=80',
  'SCR-004': 'https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?w=160&h=100&fit=crop&q=80',
}

// Color chips for color-related decisions
const DECISION_COLORS: Record<string, string[]> = {
  'DEC-001': ['#E8734A', '#FFF8F0', '#1B1D1F'],
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 미팅 노드 — 더 크고, 참여자 표시
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function MeetingNodeInner({ data, selected }: NodeProps<FlowNodeData>) {
  const SrcIcon = (data.sourceType && SOURCE_ICON[data.sourceType]) || Calendar
  return (
    <div className={`px-5 py-3.5 rounded-2xl border-2 bg-blue-50 border-blue-400/50 cursor-pointer transition-all min-w-[280px]
      ${selected ? 'ring-2 ring-blue-500 shadow-lg' : 'hover:shadow-md'}`}>
      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !border-2 !border-white !bg-blue-500 !-top-2" />

      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
          <SrcIcon className="h-5 w-5 text-blue-600" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-blue-600">{data.code}</span>
          </div>
          <p className="text-base font-semibold truncate">{data.title}</p>
        </div>
      </div>

      {/* 참여자 */}
      {(data.owner || (data.contributors && data.contributors.length > 0)) && (
        <div className="flex items-center gap-1.5 mt-2.5 pt-2.5 border-t border-blue-200/50">
          <Users className="h-3.5 w-3.5 text-blue-400" />
          <div className="flex -space-x-1.5">
            {data.owner && (
              <div className="h-6 w-6 rounded-full bg-blue-200 flex items-center justify-center text-xs font-bold text-blue-700 border-2 border-blue-50">
                {data.owner.name.slice(0, 1)}
              </div>
            )}
            {data.contributors?.slice(0, 3).map((c, i) => (
              <div key={i} className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-medium text-blue-600 border-2 border-blue-50">
                {c.name.slice(0, 1)}
              </div>
            ))}
          </div>
          <span className="text-xs text-blue-500 ml-1">
            {data.owner?.name}{data.contributors && data.contributors.length > 0 ? ` 외 ${data.contributors.length}명` : ''}
          </span>
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !border-2 !border-white !bg-blue-500 !-bottom-2" />
    </div>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 결정 노드 — 컬러칩, 영역 아이콘, 담당자+업체, 확장
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function DecisionNodeInner({ data, selected }: NodeProps<FlowNodeData>) {
  const hasIssue = data.hasConflict || data.hasBlocker
  const bar = hasIssue ? 'bg-red-500' : (data.status ? STATUS_BAR[data.status] || 'bg-zinc-300' : 'bg-zinc-300')
  const statusCfg = data.status ? STATUS_LABEL[data.status] : null
  const areaCfg = data.area ? AREA_CONFIG[data.area] : null
  const AreaIcon = areaCfg?.icon || GitBranch
  const colorChips = data.colorChips || DECISION_COLORS[data.code]

  const taskProgress = data.tasks?.length
    ? { total: data.tasks.length, done: data.tasks.filter(t => t.status === 'done').length }
    : null

  const rationale = data.description?.replace(/^\[.*?\]\s*/, '') || ''

  return (
    <div className={`flex rounded-2xl border overflow-hidden cursor-pointer transition-all
      ${selected ? 'min-w-[380px] max-w-[460px]' : 'min-w-[300px] max-w-[360px]'}
      ${hasIssue
        ? 'border-red-400 bg-red-50/80 shadow-[0_0_12px_rgba(239,68,68,0.15)]'
        : 'bg-card border-border/50'}
      ${selected ? 'ring-2 ring-primary shadow-lg' : 'hover:shadow-md hover:border-border'}`}>
      <Handle type="target" position={Position.Top} className={`!w-3 !h-3 !border-2 !border-white ${hasIssue ? '!bg-red-500' : '!bg-teal-500'} !-top-2`} />

      {/* 상태 바 */}
      <div className={`w-2 shrink-0 ${bar}`} />

      <div className="px-4 py-3.5 min-w-0 flex-1">
        {/* 상단: 코드 + 상태 + 영역 */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-mono font-bold text-foreground/50">{data.code}</span>
          {statusCfg && !hasIssue && (
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusCfg.bg} ${statusCfg.text}`}>
              {statusCfg.label}
            </span>
          )}
          {hasIssue && (
            <span className="flex items-center gap-1 bg-red-100 rounded-full px-2 py-0.5">
              <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
              <span className="text-xs font-bold text-red-600">주의</span>
            </span>
          )}
          {areaCfg && (
            <span className={`flex items-center gap-1 ml-auto px-2 py-0.5 rounded-full ${areaCfg.bg}`}>
              <AreaIcon className={`h-3 w-3 ${areaCfg.text}`} />
              <span className={`text-xs font-medium ${areaCfg.text}`}>{areaCfg.label}</span>
            </span>
          )}
        </div>

        {/* 제목 */}
        <p className={`font-semibold leading-snug ${selected ? 'text-base' : 'text-base line-clamp-2'}`}>{data.title}</p>

        {/* 컬러칩 (컬러 관련 결정) */}
        {colorChips && colorChips.length > 0 && (
          <div className="flex items-center gap-2 mt-2">
            {colorChips.map((hex, i) => (
              <div key={i} className="flex items-center gap-1">
                <div className="h-5 w-5 rounded-md border border-black/10 shadow-inner" style={{ backgroundColor: hex }} />
                <span className="text-xs font-mono text-muted-foreground">{hex}</span>
              </div>
            ))}
          </div>
        )}

        {/* 담당자 + 업체 */}
        {data.owner && (
          <div className="flex items-center gap-2 mt-2.5">
            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
              {data.owner.name.slice(0, 1)}
            </div>
            <span className="text-sm text-muted-foreground">{data.owner.name}</span>
            {data.teamName && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground/70">
                <Building2 className="h-3 w-3" />
                {data.teamName}
              </span>
            )}
          </div>
        )}

        {/* ─── 선택 시 확장 ─── */}
        {selected && (
          <div className="mt-3 pt-3 border-t border-border/30 space-y-2.5">
            {rationale && (
              <div className="rounded-xl bg-amber-50 border border-amber-200/50 px-3 py-2.5">
                <p className="text-xs font-semibold text-amber-600 mb-0.5">왜?</p>
                <p className="text-sm text-amber-900/80 leading-relaxed">{rationale}</p>
              </div>
            )}

            {taskProgress && (
              <div className="flex items-center gap-2">
                <ListChecks className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{taskProgress.done}/{taskProgress.total}</span>
                <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${taskProgress.total > 0 ? (taskProgress.done / taskProgress.total) * 100 : 0}%` }} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} className={`!w-3 !h-3 !border-2 !border-white ${hasIssue ? '!bg-red-500' : '!bg-teal-500'} !-bottom-2`} />
    </div>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 산출물 노드 — 썸네일 + 채널 배지
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function ScreenNodeInner({ data, selected }: NodeProps<FlowNodeData>) {
  const thumb = SCREEN_THUMBS[data.code]
  const hasIssue = data.hasConflict || data.hasBlocker

  return (
    <div className={`rounded-2xl border bg-card overflow-hidden cursor-pointer transition-all min-w-[200px] max-w-[260px]
      ${hasIssue
        ? 'border-red-400 shadow-[0_0_12px_rgba(239,68,68,0.15)]'
        : 'border-purple-300/50'}
      ${selected ? 'ring-2 ring-purple-500 shadow-lg' : 'hover:shadow-md hover:border-purple-300'}`}>
      <Handle type="target" position={Position.Top} className={`!w-3 !h-3 !border-2 !border-white ${hasIssue ? '!bg-red-500' : '!bg-purple-500'} !-top-2`} />

      {/* 썸네일 */}
      {thumb ? (
        <div className="h-20 bg-muted/30 overflow-hidden">
          <img src={thumb} alt={data.title} className="w-full h-full object-cover" loading="lazy" />
        </div>
      ) : (
        <div className="h-16 bg-purple-50 flex items-center justify-center">
          <Image className="h-6 w-6 text-purple-300" />
        </div>
      )}

      <div className="px-3.5 py-2.5">
        <div className="flex items-center gap-1.5 mb-1">
          <MonitorSmartphone className="h-3.5 w-3.5 text-purple-500" />
          <span className="text-xs font-mono font-bold text-purple-500">{data.code}</span>
        </div>
        <p className="text-sm font-semibold truncate">{data.title}</p>
        {data.channel && (
          <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">{data.channel}</span>
        )}
        {hasIssue && (
          <div className="flex items-center gap-1 mt-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
            <span className="text-xs font-semibold text-red-600">검증 이슈</span>
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !border-2 !border-white !bg-purple-500 !-bottom-2" />
    </div>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 기타 노드 (github, slack — 거의 안 쓰이지만 유지)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const OTHER: Record<string, { icon: React.ElementType; color: string; handle: string }> = {
  github: { icon: Github, color: 'text-zinc-500', handle: '!bg-zinc-500' },
  slack:  { icon: SlackIcon, color: 'text-amber-500', handle: '!bg-amber-500' },
}

function OtherNodeInner({ data, selected }: NodeProps<FlowNodeData>) {
  const s = OTHER[data.type] || OTHER.github
  const Icon = s.icon
  return (
    <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border bg-card min-w-[180px] max-w-[240px] cursor-pointer transition-all
      border-border/50 ${selected ? 'ring-2 ring-primary shadow-lg' : 'hover:shadow-md'}`}>
      <Handle type="target" position={Position.Top} className={`!w-3 !h-3 !border-2 !border-white ${s.handle} !-top-2`} />
      <Icon className={`h-5 w-5 ${s.color} shrink-0`} />
      <div className="min-w-0">
        <p className="text-xs font-mono font-bold text-muted-foreground">{data.code}</p>
        <p className="text-sm font-medium truncate">{data.title}</p>
      </div>
      <Handle type="source" position={Position.Bottom} className={`!w-3 !h-3 !border-2 !border-white ${s.handle} !-bottom-2`} />
    </div>
  )
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const MeetingNode = memo(MeetingNodeInner); MeetingNode.displayName = 'MeetingNode'
export const DecisionNode = memo(DecisionNodeInner); DecisionNode.displayName = 'DecisionNode'
export const ScreenNode = memo(ScreenNodeInner); ScreenNode.displayName = 'ScreenNode'
export const GithubNode = memo(OtherNodeInner); GithubNode.displayName = 'GithubNode'
export const SlackNode = memo(OtherNodeInner); SlackNode.displayName = 'SlackNode'

export const nodeTypes = {
  meeting: MeetingNode, decision: DecisionNode,
  screen: ScreenNode, github: GithubNode, slack: SlackNode,
}
