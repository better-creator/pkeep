// ============================================================
// Organization 모듈 — 서버 사이드 CRUD
// ============================================================

import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/modules/auth'

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 48) + '-' + Math.random().toString(36).slice(2, 6)
}

/**
 * 조직 생성 — RPC 트랜잭션으로 org+team+member+project 원자적 생성
 */
export async function createOrganization(input: {
  orgName: string
  teamName: string
  projectName: string
}) {
  const user = await requireUser()
  const supabase = await createClient()

  const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Me'

  const { data, error } = await supabase.rpc('create_organization_with_team', {
    p_org_name: input.orgName.trim(),
    p_org_slug: generateSlug(input.orgName),
    p_team_name: input.teamName.trim(),
    p_project_name: input.projectName.trim(),
    p_user_name: userName,
    p_user_email: user.email || '',
  })

  if (error) {
    console.error('createOrganization failed:', error)
    return { error: '조직 생성에 실패했습니다. 다시 시도해주세요.' }
  }

  const result = data as { org_id: string; team_id: string; project_id: string }

  return {
    org: { id: result.org_id },
    team: { id: result.team_id },
    project: { id: result.project_id },
    redirectTo: `/${result.team_id}/${result.project_id}/dashboard`,
  }
}

/**
 * 유저가 속한 조직 목록 조회
 */
export async function getUserOrganizations() {
  const user = await requireUser()
  const supabase = await createClient()

  const { data } = await supabase
    .from('org_members')
    .select(`
      org_role,
      organization:org_id (
        id, name, slug, logo_url, plan
      )
    `)
    .eq('user_id', user.id)

  return data ?? []
}

/**
 * 유저가 이미 조직에 속해있는지 확인
 */
export async function hasOrganization(): Promise<boolean> {
  const user = await requireUser()
  const supabase = await createClient()

  const { count } = await supabase
    .from('org_members')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)

  return (count ?? 0) > 0
}
