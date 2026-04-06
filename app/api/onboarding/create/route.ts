// 온보딩: 조직 + 팀 + 프로젝트 일괄 생성
import { NextResponse } from 'next/server'
import { createOrganization } from '@/lib/modules/organization'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { orgName, teamName, projectName } = body

    if (
      !orgName?.trim() || !teamName?.trim() || !projectName?.trim() ||
      orgName.trim().length < 2 || teamName.trim().length < 2 || projectName.trim().length < 2 ||
      orgName.trim().length > 100 || teamName.trim().length > 100 || projectName.trim().length > 100
    ) {
      return NextResponse.json(
        { error: '모든 항목을 입력해주세요.' },
        { status: 400 }
      )
    }

    const result = await createOrganization({
      orgName: orgName.trim(),
      teamName: teamName.trim(),
      projectName: projectName.trim(),
    })

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      org: result.org,
      team: result.team,
      project: result.project,
      redirectTo: result.redirectTo,
    })
  } catch (err) {
    console.error('POST /api/onboarding/create error:', err)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
