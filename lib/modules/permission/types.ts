// ============================================================
// Permission 모듈 — 타입 정의
// ============================================================

// Org 레벨 역할
export type OrgRole = 'owner' | 'admin' | 'member'

// Team 레벨 역할
export type TeamRole = 'lead' | 'contributor' | 'viewer'

// Org 권한 액션
export type OrgAction =
  | 'org:update'
  | 'org:delete'
  | 'org:manage_billing'
  | 'org:invite_member'
  | 'org:remove_member'
  | 'org:manage_roles'
  | 'org:manage_integrations'
  | 'org:view_audit_log'
  | 'org:create_team'
  | 'org:delete_team'

// Team 권한 액션
export type TeamAction =
  | 'team:update'
  | 'team:manage_members'
  | 'team:create_project'
  | 'team:delete_project'
  | 'team:manage_channels'

// Project 권한 액션
export type ProjectAction =
  | 'project:update'
  | 'project:record_meeting'
  | 'project:create_decision'
  | 'project:manage_tasks'
  | 'project:view'
  | 'project:ai_chat'
  | 'project:export'

export type PermissionAction = OrgAction | TeamAction | ProjectAction

// 권한 체크 컨텍스트
export interface PermissionContext {
  orgId?: string
  teamId?: string
  projectId?: string
}

// 유저 역할 정보 (서버에서 조회 후 사용)
export interface UserRoles {
  userId: string
  orgRole: OrgRole | null
  teamRole: TeamRole | null
  orgId: string | null
  teamId: string | null
}

// DB 테이블 타입
export interface Organization {
  id: string
  name: string
  slug: string
  logo_url: string | null
  plan: 'free' | 'pro' | 'enterprise'
  allowed_domains: string[]
  allowed_ips: string[]
  billing_email: string | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface OrgMember {
  id: string
  org_id: string
  user_id: string
  org_role: OrgRole
  created_at: string
}

export interface TeamMember {
  id: string
  team_id: string
  user_id: string | null
  name: string
  email: string | null
  role: string | null       // 직책 (PM, 디자이너 등)
  team_role: TeamRole       // 권한 역할
  area: 'planning' | 'design' | 'dev' | null
  created_at: string
}

export interface Invitation {
  id: string
  org_id: string
  team_id: string | null
  email: string
  org_role: OrgRole
  team_role: TeamRole | null
  invited_by: string
  token: string
  status: 'pending' | 'accepted' | 'expired' | 'revoked'
  expires_at: string
  created_at: string
}
