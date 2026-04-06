// ============================================================
// Permission 모듈 — 서버 사이드 권한 체크
// API Route, Server Component, Server Action에서 사용
// ============================================================

import { createClient } from '@/lib/supabase/server'
import type {
  PermissionAction,
  PermissionContext,
  OrgRole,
  TeamRole,
  UserRoles,
} from './types'
import {
  ORG_ROLE_PERMISSIONS,
  TEAM_ROLE_PERMISSIONS,
} from './constants'

// ----------------------------------------------------------
// 현재 로그인 유저 정보 조회
// ----------------------------------------------------------

export async function getCurrentUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null
  return user
}

// ----------------------------------------------------------
// 유저의 Org/Team 역할 조회
// ----------------------------------------------------------

export async function getUserOrgRole(orgId: string): Promise<OrgRole | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('org_members')
    .select('org_role')
    .eq('org_id', orgId)
    .eq('user_id', user.id)
    .single()

  return (data?.org_role as OrgRole) ?? null
}

export async function getUserTeamRole(teamId: string): Promise<TeamRole | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('members')
    .select('team_role')
    .eq('team_id', teamId)
    .eq('user_id', user.id)
    .single()

  return (data?.team_role as TeamRole) ?? null
}

// ----------------------------------------------------------
// 유저의 전체 역할 정보 한 번에 조회
// ----------------------------------------------------------

export async function getUserRoles(ctx: PermissionContext): Promise<UserRoles | null> {
  const user = await getCurrentUser()
  if (!user) return null

  const result: UserRoles = {
    userId: user.id,
    orgRole: null,
    teamRole: null,
    orgId: ctx.orgId ?? null,
    teamId: ctx.teamId ?? null,
  }

  if (ctx.orgId) {
    result.orgRole = await getUserOrgRole(ctx.orgId)
  }

  if (ctx.teamId) {
    result.teamRole = await getUserTeamRole(ctx.teamId)
    // teamId가 있으면 orgId도 자동으로 조회
    if (!ctx.orgId) {
      const supabase = await createClient()
      const { data: team } = await supabase
        .from('teams')
        .select('org_id')
        .eq('id', ctx.teamId)
        .single()
      if (team?.org_id) {
        result.orgId = team.org_id
        result.orgRole = await getUserOrgRole(team.org_id)
      }
    }
  }

  return result
}

// ----------------------------------------------------------
// 권한 체크 (핵심 함수)
// ----------------------------------------------------------

/**
 * 유저가 특정 액션을 수행할 수 있는지 확인
 *
 * @example
 * // API Route에서
 * const allowed = await canUser('team:create_project', { teamId: 'xxx' })
 * if (!allowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
 *
 * @example
 * // Server Component에서
 * const canEdit = await canUser('project:update', { teamId })
 */
export async function canUser(
  action: PermissionAction,
  ctx: PermissionContext
): Promise<boolean> {
  const roles = await getUserRoles(ctx)
  if (!roles) return false

  return checkPermission(action, roles)
}

/**
 * 이미 조회된 역할 정보로 권한 체크 (DB 호출 없음)
 * getUserRoles()를 먼저 호출한 뒤 여러 권한을 체크할 때 효율적
 */
export function checkPermission(
  action: PermissionAction,
  roles: UserRoles
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

// ----------------------------------------------------------
// DB RPC를 통한 권한 체크 (RLS와 동일한 소스)
// 클라이언트 상수와 DB가 불일치할 때의 안전장치
// ----------------------------------------------------------

export async function canUserDB(
  action: PermissionAction,
  ctx: PermissionContext
): Promise<boolean> {
  const user = await getCurrentUser()
  if (!user) return false

  const supabase = await createClient()
  const { data, error } = await supabase.rpc('has_permission', {
    p_user_id: user.id,
    p_action: action,
    p_org_id: ctx.orgId ?? null,
    p_team_id: ctx.teamId ?? null,
  })

  if (error) return false
  return data === true
}

// ----------------------------------------------------------
// 유저가 속한 조직 목록
// ----------------------------------------------------------

export async function getUserOrganizations() {
  const user = await getCurrentUser()
  if (!user) return []

  const supabase = await createClient()
  const { data } = await supabase
    .from('org_members')
    .select(`
      org_role,
      organizations:org_id (
        id, name, slug, logo_url, plan
      )
    `)
    .eq('user_id', user.id)

  return data ?? []
}

// ----------------------------------------------------------
// 유저가 속한 팀 목록 (특정 org 내)
// ----------------------------------------------------------

export async function getUserTeams(orgId: string) {
  const user = await getCurrentUser()
  if (!user) return []

  const supabase = await createClient()
  const { data } = await supabase
    .from('members')
    .select(`
      team_role,
      teams:team_id (
        id, name, org_id, description
      )
    `)
    .eq('user_id', user.id)

  // org 필터
  return (data ?? []).filter(
    (d) => (d.teams as any)?.org_id === orgId
  )
}
