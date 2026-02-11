import {
  Calendar,
  GitBranch,
  Layout,
  Code,
  FileText,
  Github,
  Figma,
  MessageSquare,
  HardDrive,
  BookOpen,
  Video,
  Edit3,
  LucideIcon,
} from 'lucide-react'

export type ConnectionRelation =
  | 'created_from'    // ~에서 결정됨
  | 'changed_by'      // ~로 인해 변경됨
  | 'implemented_in'  // ~에서 구현됨
  | 'discussed_in'    // ~에서 논의됨
  | 'affects'         // ~에 영향

// 카테고리: 노드의 성격 (색상 기준)
export type ItemCategory = 'meeting' | 'decision' | 'screen' | 'implementation' | 'document'

// 소스: 데이터 출처 (작은 뱃지로 표시)
export type ItemSource = 'github' | 'figma' | 'slack' | 'google_drive' | 'notion' | 'zoom' | 'manual'

// 기존 타입 (하위 호환성)
export type ItemType = 'decision' | 'meeting' | 'github' | 'slack' | 'screen'

export type Person = {
  id: string
  name: string
  avatar?: string
  role?: 'owner' | 'contributor' | 'reviewer'
}

export type Task = {
  id: string
  title: string
  status: 'todo' | 'in_progress' | 'done'
  assignee?: Person
}

export type Connection = {
  id: string
  type: ItemType
  category?: ItemCategory
  code: string
  title: string
  relation: ConnectionRelation
}

export type TimelineItem = {
  id: string
  // 새 구조: category + source
  category: ItemCategory
  source?: ItemSource
  // 기존 type 필드 (하위 호환성 유지)
  type: ItemType

  code: string
  title: string
  date: string
  description?: string
  status?: 'confirmed' | 'changed' | 'pending' | 'superseded' | 'deprecated' | 'disabled' | 'draft'
  event_type?: 'pr' | 'commit' | 'issue'
  url?: string

  // 작업자 정보
  owner?: Person
  contributors?: Person[]
  reviewers?: Person[]

  // 연결된 태스크
  tasks?: Task[]

  // 연결 정보
  connections: {
    sources: Connection[]
    impacts: Connection[]
  }
}

// 카테고리 설정 (색상, 아이콘, 라벨)
export type CategoryConfig = {
  icon: LucideIcon
  color: string
  bgColor: string
  label: string
}

export const categoryConfig: Record<ItemCategory, CategoryConfig> = {
  meeting: {
    icon: Calendar,
    color: '#3b82f6',
    bgColor: 'bg-blue-500',
    label: '미팅',
  },
  decision: {
    icon: GitBranch,
    color: '#14b8a6',
    bgColor: 'bg-teal-500',
    label: '결정',
  },
  screen: {
    icon: Layout,
    color: '#a855f7',
    bgColor: 'bg-purple-500',
    label: '화면',
  },
  implementation: {
    icon: Code,
    color: '#6b7280',
    bgColor: 'bg-gray-500',
    label: '구현',
  },
  document: {
    icon: FileText,
    color: '#f59e0b',
    bgColor: 'bg-amber-500',
    label: '문서',
  },
}

// 소스 설정 (아이콘, 라벨)
export type SourceConfig = {
  icon: LucideIcon
  label: string
}

export const sourceConfig: Record<ItemSource, SourceConfig> = {
  github: { icon: Github, label: 'Github' },
  figma: { icon: Figma, label: 'Figma' },
  slack: { icon: MessageSquare, label: 'Slack' },
  google_drive: { icon: HardDrive, label: 'Google Drive' },
  notion: { icon: BookOpen, label: 'Notion' },
  zoom: { icon: Video, label: 'Zoom' },
  manual: { icon: Edit3, label: '직접 입력' },
}

// 기존 type을 새 구조로 변환하는 헬퍼
export function migrateTypeToCategory(type: ItemType): { category: ItemCategory; source: ItemSource } {
  switch (type) {
    case 'meeting':
      return { category: 'meeting', source: 'manual' }
    case 'decision':
      return { category: 'decision', source: 'manual' }
    case 'screen':
      return { category: 'screen', source: 'figma' }
    case 'github':
      return { category: 'implementation', source: 'github' }
    case 'slack':
      return { category: 'meeting', source: 'slack' }
    default:
      return { category: 'document', source: 'manual' }
  }
}

// 상태별 스타일
export const statusConfig: Record<string, { bg: string; text: string; label: string; color: string }> = {
  confirmed: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: '확정', color: '#10b981' },
  changed: { bg: 'bg-amber-500/20', text: 'text-amber-400', label: '변경됨', color: '#f59e0b' },
  pending: { bg: 'bg-zinc-500/20', text: 'text-zinc-400', label: '검토중', color: '#71717a' },
  superseded: { bg: 'bg-purple-500/20', text: 'text-purple-400', label: '대체됨', color: '#8b5cf6' },
  deprecated: { bg: 'bg-red-500/20', text: 'text-red-400', label: '폐기', color: '#ef4444' },
  disabled: { bg: 'bg-slate-500/20', text: 'text-slate-400', label: '비활성', color: '#94a3b8' },
  draft: { bg: 'bg-gray-500/20', text: 'text-gray-400', label: '초안', color: '#6b7280' },
}

// 관계별 한국어 텍스트
export const relationLabels: Record<ConnectionRelation, string> = {
  created_from: '에서 결정됨',
  changed_by: '로 인해 변경됨',
  implemented_in: '에서 구현됨',
  discussed_in: '에서 논의됨',
  affects: '에 영향',
}

// 관계별 선 색상
export const relationColors: Record<ConnectionRelation, string> = {
  created_from: '#3b82f6',
  changed_by: '#f59e0b',
  implemented_in: '#22c55e',
  discussed_in: '#8b5cf6',
  affects: '#ec4899',
}

// 태스크 상태 스타일
export const taskStatusStyles: Record<Task['status'], { label: string; color: string; bg: string }> = {
  todo: { label: '할 일', color: 'text-zinc-500', bg: 'bg-zinc-500/10' },
  in_progress: { label: '진행 중', color: 'text-blue-500', bg: 'bg-blue-500/10' },
  done: { label: '완료', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
}

// 기존 타입 아이콘 (하위 호환성, deprecated)
export const typeIcons: Record<ItemType, string> = {
  meeting: 'Calendar',
  decision: 'GitBranch',
  screen: 'Layout',
  github: 'Code',
  slack: 'MessageSquare',
}
