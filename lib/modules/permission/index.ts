// ============================================================
// Permission 모듈 — Public API
// ============================================================

// 타입
export type {
  OrgRole,
  TeamRole,
  OrgAction,
  TeamAction,
  ProjectAction,
  PermissionAction,
  PermissionContext,
  UserRoles,
  Organization,
  OrgMember,
  TeamMember,
  Invitation,
} from './types'

// 상수
export {
  ORG_ROLE_PERMISSIONS,
  TEAM_ROLE_PERMISSIONS,
  ORG_ROLE_HIERARCHY,
  TEAM_ROLE_HIERARCHY,
} from './constants'

// 클라이언트 유틸 (UI 가드용)
export {
  checkClientPermission,
  isOrgRoleAtLeast,
  isTeamRoleAtLeast,
} from './client'

// 서버 사이드 (API Route, Server Component, Server Action)
// 주의: 클라이언트 컴포넌트에서 import하면 에러 발생
export {
  canUser,
  checkPermission,
  canUserDB,
  getCurrentUser,
  getUserRoles,
  getUserOrgRole,
  getUserTeamRole,
  getUserOrganizations,
  getUserTeams,
} from './server'

// API Route 미들웨어
export {
  withAuth,
  withPermission,
  contextFromParams,
  contextFromTeamId,
  contextFromProjectId,
} from './middleware'
