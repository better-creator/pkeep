// ============================================================
// Permission 모듈 — 역할별 권한 매핑 (클라이언트 사이드 빠른 체크용)
// DB가 source of truth, 이 상수는 UI 가드/낙관적 체크에 사용
// ============================================================

import type { OrgRole, TeamRole, OrgAction, TeamAction, ProjectAction } from './types'

// Org 역할별 허용 액션
export const ORG_ROLE_PERMISSIONS: Record<OrgRole, readonly OrgAction[]> = {
  owner: [
    'org:update',
    'org:delete',
    'org:manage_billing',
    'org:invite_member',
    'org:remove_member',
    'org:manage_roles',
    'org:manage_integrations',
    'org:view_audit_log',
    'org:create_team',
    'org:delete_team',
  ],
  admin: [
    'org:update',
    'org:invite_member',
    'org:remove_member',
    'org:manage_roles',
    'org:manage_integrations',
    'org:view_audit_log',
    'org:create_team',
    'org:delete_team',
  ],
  member: [
    'org:view_audit_log',
  ],
} as const

// Team 역할별 허용 액션
export const TEAM_ROLE_PERMISSIONS: Record<TeamRole, readonly (TeamAction | ProjectAction)[]> = {
  lead: [
    'team:update',
    'team:manage_members',
    'team:create_project',
    'team:delete_project',
    'team:manage_channels',
    'project:update',
    'project:record_meeting',
    'project:create_decision',
    'project:manage_tasks',
    'project:view',
    'project:ai_chat',
    'project:export',
  ],
  contributor: [
    'project:record_meeting',
    'project:create_decision',
    'project:manage_tasks',
    'project:view',
    'project:ai_chat',
    'project:export',
  ],
  viewer: [
    'project:view',
    'project:ai_chat',
    'project:export',
  ],
} as const

// 역할 계층 (높을수록 상위)
export const ORG_ROLE_HIERARCHY: Record<OrgRole, number> = {
  owner: 3,
  admin: 2,
  member: 1,
}

export const TEAM_ROLE_HIERARCHY: Record<TeamRole, number> = {
  lead: 3,
  contributor: 2,
  viewer: 1,
}
