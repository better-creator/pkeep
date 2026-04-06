// 온보딩: 초대 코드로 합류
import { NextResponse } from 'next/server'
import { acceptInvitation } from '@/lib/modules/invitation'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { token } = body

    if (!token?.trim()) {
      return NextResponse.json(
        { error: '초대 코드를 입력해주세요.' },
        { status: 400 }
      )
    }

    const result = await acceptInvitation(token.trim())

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      redirectTo: result.redirectTo,
    })
  } catch (err) {
    console.error('POST /api/onboarding/join error:', err)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
