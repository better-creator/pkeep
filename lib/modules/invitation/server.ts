// ============================================================
// Invitation 모듈 — 초대 생성/수락 로직
// ============================================================

import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/modules/auth'
import { getUserOrgRole } from '@/lib/modules/permission/server'
import crypto from 'crypto'

/**
 * 초대 생성
 * - owner만 owner를 초대 가능 (실제로는 owner 초대 불가 — DB CHECK에 'owner' 없음)
 * - admin은 admin/member만 초대 가능
 */
export async function createInvitation(input: {
  orgId: string
  teamId?: string
  email: string
  orgRole?: 'admin' | 'member'
  teamRole?: 'lead' | 'contributor' | 'viewer'
}) {
  const user = await requireUser()
  const supabase = await createClient()

  // 초대자의 역할 확인
  const callerRole = await getUserOrgRole(input.orgId)
  if (!callerRole || (callerRole !== 'owner' && callerRole !== 'admin')) {
    return { error: '초대 권한이 없습니다.' }
  }

  // admin은 admin으로 초대 불가 (owner만 가능)
  if (callerRole === 'admin' && input.orgRole === 'admin') {
    return { error: '관리자 역할 초대는 소유자만 가능합니다.' }
  }

  const token = crypto.randomBytes(32).toString('hex')

  const { data, error } = await supabase
    .from('invitations')
    .insert({
      org_id: input.orgId,
      team_id: input.teamId || null,
      email: input.email,
      org_role: input.orgRole || 'member',
      team_role: input.teamRole || 'contributor',
      invited_by: user.id,
      token,
    })
    .select()
    .single()

  if (error) {
    console.error('createInvitation failed:', error)
    return { error: error.message }
  }

  // 감사 로그
  await supabase.rpc('log_audit', {
    p_org_id: input.orgId,
    p_action: 'invitation:created',
    p_target_type: 'invitation',
    p_target_id: data.id,
    p_metadata: { email: input.email, org_role: input.orgRole, team_role: input.teamRole },
  })

  return { invitation: data, token }
}

/**
 * 초대 토큰으로 초대 정보 조회
 */
export async function getInvitationByToken(token: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('invitations')
    .select(`
      *,
      organization:org_id (id, name, slug, logo_url),
      team:team_id (id, name)
    `)
    .eq('token', token)
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()

  if (error || !data) {
    return null
  }

  return data
}

/**
 * 만료된 초대인지 확인 (에러 메시지 분기용)
 */
async function isTokenExpired(token: string): Promise<boolean> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('invitations')
    .select('id, expires_at, status')
    .eq('token', token)
    .maybeSingle()

  if (!data) return false
  if (data.status !== 'pending') return false
  return new Date(data.expires_at) < new Date()
}

/**
 * 초대 수락 — org_member + team member 등록
 */
export async function acceptInvitation(token: string) {
  const user = await requireUser()
  const supabase = await createClient()

  // 1. 초대 정보 조회
  const invitation = await getInvitationByToken(token)
  if (!invitation) {
    const expired = await isTokenExpired(token)
    if (expired) {
      return { error: '초대가 만료되었습니다. 다시 초대를 요청해주세요.' }
    }
    return { error: '유효하지 않은 초대 코드입니다.' }
  }

  // 2. org_members에 등록 (이미 있으면 무시)
  const { error: orgError } = await supabase
    .from('org_members')
    .upsert(
      {
        org_id: invitation.org_id,
        user_id: user.id,
        org_role: invitation.org_role,
      },
      { onConflict: 'org_id,user_id' }
    )

  if (orgError) {
    console.error('acceptInvitation org_members failed:', orgError)
    return { error: '합류에 실패했습니다. 다시 시도해주세요.' }
  }

  // 3. 팀이 지정되어 있으면 팀 멤버로도 등록
  const teamId = invitation.team_id
  if (teamId) {
    const { error: memberError } = await supabase
      .from('members')
      .upsert(
        {
          team_id: teamId,
          user_id: user.id,
          name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Member',
          email: user.email,
          team_role: invitation.team_role || 'contributor',
        },
        { onConflict: 'team_id,user_id' }
      )

    if (memberError) {
      console.error('acceptInvitation members failed:', memberError)
      return { error: '팀 합류에 실패했습니다.' }
    }
  }

  // 4. 초대 상태 업데이트
  await supabase
    .from('invitations')
    .update({ status: 'accepted' })
    .eq('id', invitation.id)

  // 5. 감사 로그
  await supabase.rpc('log_audit', {
    p_org_id: invitation.org_id,
    p_action: 'invitation:accepted',
    p_target_type: 'invitation',
    p_target_id: invitation.id,
    p_metadata: { team_id: teamId },
  })

  // 6. 리다이렉트 경로 결정
  if (teamId) {
    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('team_id', teamId)
      .limit(1)
      .maybeSingle()

    if (project) {
      return { redirectTo: `/${teamId}/${project.id}/dashboard` }
    }
  }

  return { redirectTo: '/dashboard' }
}
