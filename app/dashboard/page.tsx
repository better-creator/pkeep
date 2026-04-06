// /dashboard 진입 시 유저의 첫 번째 팀/프로젝트로 리다이렉트
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardRedirectPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 유저가 속한 첫 번째 조직 찾기
  const { data: orgMember } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (!orgMember) {
    // 조직이 없으면 온보딩으로
    redirect('/onboarding')
  }

  // 해당 조직의 첫 번째 팀에서 유저가 속한 팀 찾기
  const { data: member } = await supabase
    .from('members')
    .select('team_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (!member) {
    redirect('/onboarding')
  }

  // 해당 팀의 첫 번째 프로젝트 찾기
  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('team_id', member.team_id)
    .eq('status', 'active')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (!project) {
    redirect('/onboarding')
  }

  redirect(`/${member.team_id}/${project.id}/dashboard`)
}
