// ============================================================
// Permission 모듈 — API Route 미들웨어
// Next.js API Route에서 인증 + 권한 체크를 래핑
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { canUser } from './server'
import type { PermissionAction, PermissionContext } from './types'

type RouteHandler = (
  req: NextRequest,
  context: { params: Record<string, string>; userId: string }
) => Promise<NextResponse>

// ----------------------------------------------------------
// 인증만 체크하는 래퍼
// ----------------------------------------------------------

export function withAuth(handler: RouteHandler) {
  return async (req: NextRequest, routeContext: { params: Record<string, string> }) => {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    return handler(req, { ...routeContext, userId: user.id })
  }
}

// ----------------------------------------------------------
// 인증 + 권한 체크 래퍼
// ----------------------------------------------------------

interface WithPermissionOptions {
  action: PermissionAction
  /** PermissionContext를 request에서 추출하는 함수 */
  getContext: (
    req: NextRequest,
    params: Record<string, string>
  ) => PermissionContext | Promise<PermissionContext>
}

export function withPermission(options: WithPermissionOptions, handler: RouteHandler) {
  return withAuth(async (req, routeContext) => {
    const ctx = await options.getContext(req, routeContext.params)
    const allowed = await canUser(options.action, ctx)

    if (!allowed) {
      return NextResponse.json(
        { error: 'Forbidden', action: options.action },
        { status: 403 }
      )
    }

    return handler(req, routeContext)
  })
}

// ----------------------------------------------------------
// URL 파라미터에서 컨텍스트 추출하는 헬퍼
// ----------------------------------------------------------

/** /api/...?orgId=xxx&teamId=yyy 또는 params에서 추출 */
export function contextFromParams(
  req: NextRequest,
  params: Record<string, string>
): PermissionContext {
  const url = new URL(req.url)
  return {
    orgId: params.orgId || url.searchParams.get('orgId') || undefined,
    teamId: params.teamId || url.searchParams.get('teamId') || undefined,
    projectId: params.projectId || url.searchParams.get('projectId') || undefined,
  }
}

/** teamId로부터 orgId를 자동 resolve */
export async function contextFromTeamId(teamId: string): Promise<PermissionContext> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('teams')
    .select('org_id')
    .eq('id', teamId)
    .single()

  return {
    orgId: data?.org_id ?? undefined,
    teamId,
  }
}

/** projectId로부터 teamId, orgId를 자동 resolve */
export async function contextFromProjectId(projectId: string): Promise<PermissionContext> {
  const supabase = await createClient()
  const { data: project } = await supabase
    .from('projects')
    .select('team_id')
    .eq('id', projectId)
    .single()

  if (!project?.team_id) {
    return { projectId }
  }

  const { data: team } = await supabase
    .from('teams')
    .select('org_id')
    .eq('id', project.team_id)
    .single()

  return {
    orgId: team?.org_id ?? undefined,
    teamId: project.team_id,
    projectId,
  }
}
