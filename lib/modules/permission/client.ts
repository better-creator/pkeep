// ============================================================
// Permission 모듈 — 클라이언트 사이드 유틸리티
// UI에서 버튼/메뉴 표시 여부 등 낙관적 권한 체크에 사용
// DB가 source of truth이므로, 서버 API 호출 시 다시 검증됨
// ============================================================

import type { OrgRole, TeamRole, PermissionAction } from './types'
import {
  ORG_ROLE_PERMISSIONS,
  TEAM_ROLE_PERMISSIONS,
  ORG_ROLE_HIERARCHY,
  TEAM_ROLE_HIERARCHY,
} from './constants'

/**
 * 클라이언트에서 빠른 권한 체크 (낙관적)
 *
 * @example
 * const canCreate = checkClientPermission('team:create_project', { teamRole: 'lead' })
 * {canCreate && <Button>새 프로젝트</Button>}
 */
export function checkClientPermission(
  action: PermissionAction,
  roles: { orgRole?: OrgRole | null; teamRole?: TeamRole | null }
): boolean {
  const scope = action.split(':')[0] as 'org' | 'team' | 'project'

  // Org 레벨 액션
  if (scope === 'org' && roles.orgRole) {
    return (ORG_ROLE_PERMISSIONS[roles.orgRole] as readonly string[]).includes(action)
  }

  // Team/Project 레벨 — Org admin/owner escalation을 먼저 체크
  if (scope === 'team' || scope === 'project') {
    if (roles.orgRole === 'owner' || roles.orgRole === 'admin') {
      return true
    }
    if (roles.teamRole) {
      return (TEAM_ROLE_PERMISSIONS[roles.teamRole] as readonly string[]).includes(action)
    }
  }

  return false
}

/**
 * Org 역할이 최소 요구 역할 이상인지 확인
 *
 * @example
 * isOrgRoleAtLeast('admin', 'member') // true (admin >= member)
 * isOrgRoleAtLeast('member', 'admin') // false
 */
export function isOrgRoleAtLeast(userRole: OrgRole, requiredRole: OrgRole): boolean {
  return ORG_ROLE_HIERARCHY[userRole] >= ORG_ROLE_HIERARCHY[requiredRole]
}

/**
 * Team 역할이 최소 요구 역할 이상인지 확인
 */
export function isTeamRoleAtLeast(userRole: TeamRole, requiredRole: TeamRole): boolean {
  return TEAM_ROLE_HIERARCHY[userRole] >= TEAM_ROLE_HIERARCHY[requiredRole]
}
