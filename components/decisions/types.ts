'use client'

import { LucideIcon, CheckCircle, Clock, XCircle, History, AlertTriangle, Archive } from 'lucide-react'

// 결정 상태
export type DecisionStatus =
  | 'draft'        // 초안 - 아직 확정되지 않음
  | 'pending'      // 검토중 - 리뷰어 승인 대기
  | 'confirmed'    // 확정됨 - 최종 결정
  | 'superseded'   // 대체됨 - 새 결정으로 변경됨
  | 'deprecated'   // 폐기됨 - 더 이상 유효하지 않음
  | 'disabled'     // 비활성 - 일시적으로 적용 안 함

// 결정 위계
export type DecisionHierarchy =
  | 'root'         // 최상위 결정 (다른 결정에 의존 안 함)
  | 'child'        // 하위 결정 (상위 결정에 의존)
  | 'revision'     // 수정본 (기존 결정의 변경)

// 결정자 정보
export interface DecisionMaker {
  id: string
  name: string
  avatar?: string
  role: 'owner' | 'approver' | 'contributor'
  decidedAt?: string
}

// 결정 변경 이력
export interface DecisionRevision {
  id: string
  version: number
  title: string
  content?: string
  changedBy: DecisionMaker
  changedAt: string
  changeReason?: string
  previousDecisionId?: string
}

// 결정 타입 (확장)
export interface Decision {
  id: string
  code: string
  title: string
  content?: string
  date: string

  // 상태 & 위계
  status: DecisionStatus
  hierarchy: DecisionHierarchy

  // 결정자 정보
  owner: DecisionMaker
  approvers?: DecisionMaker[]
  contributors?: DecisionMaker[]

  // 위계 관계
  parentDecisionId?: string     // 상위 결정
  supersededById?: string       // 이 결정을 대체한 새 결정
  supersedes?: string           // 이 결정이 대체한 이전 결정

  // 수정 이력
  revisions?: DecisionRevision[]
  currentVersion: number

  // 메타
  area?: string
  keywords?: string[]
  projectId: string
  meetingId?: string

  // 영향받는 화면
  affectedScreenIds?: string[]

  createdAt: string
  updatedAt: string
}

// 결정 상태 설정
export interface DecisionStatusConfig {
  icon: LucideIcon
  label: string
  color: string
  bgColor: string
  textColor: string
  description: string
}

export const decisionStatusConfig: Record<DecisionStatus, DecisionStatusConfig> = {
  draft: {
    icon: Clock,
    label: '초안',
    color: '#6b7280',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-600',
    description: '아직 확정되지 않은 결정',
  },
  pending: {
    icon: AlertTriangle,
    label: '검토중',
    color: '#f59e0b',
    bgColor: 'bg-amber-100',
    textColor: 'text-amber-700',
    description: '리뷰어 승인 대기중',
  },
  confirmed: {
    icon: CheckCircle,
    label: '확정',
    color: '#10b981',
    bgColor: 'bg-emerald-100',
    textColor: 'text-emerald-700',
    description: '최종 확정된 결정',
  },
  superseded: {
    icon: History,
    label: '대체됨',
    color: '#8b5cf6',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-700',
    description: '새로운 결정으로 대체됨',
  },
  deprecated: {
    icon: XCircle,
    label: '폐기',
    color: '#ef4444',
    bgColor: 'bg-red-100',
    textColor: 'text-red-700',
    description: '더 이상 유효하지 않음',
  },
  disabled: {
    icon: Archive,
    label: '비활성',
    color: '#94a3b8',
    bgColor: 'bg-slate-100',
    textColor: 'text-slate-600',
    description: '일시적으로 비활성화됨',
  },
}

// 결정 위계 설정
export interface DecisionHierarchyConfig {
  label: string
  description: string
}

export const decisionHierarchyConfig: Record<DecisionHierarchy, DecisionHierarchyConfig> = {
  root: {
    label: '최상위',
    description: '독립적인 결정',
  },
  child: {
    label: '하위',
    description: '상위 결정에 의존',
  },
  revision: {
    label: '수정본',
    description: '기존 결정의 변경',
  },
}

// 뷰 타입
export type DecisionViewType = 'timeline' | 'hierarchy' | 'status' | 'list'

// 필터 타입
export interface DecisionFilter {
  status?: DecisionStatus[]
  hierarchy?: DecisionHierarchy[]
  ownerId?: string
  area?: string
  dateRange?: {
    start: string
    end: string
  }
  showDisabled?: boolean
  showSuperseded?: boolean
}

// 그룹핑 타입
export type DecisionGroupBy = 'none' | 'status' | 'owner' | 'area' | 'date' | 'hierarchy'
