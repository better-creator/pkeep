// OAuth / 이메일 확인 콜백 핸들러
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // /dashboard 페이지가 자동으로 팀/프로젝트 찾아서 리다이렉트함
      // next 파라미터가 있으면 그쪽으로 (온보딩 등)
      const redirectTo = next ?? '/dashboard'
      return NextResponse.redirect(`${origin}${redirectTo}`)
    }
  }

  // 에러 시 로그인 페이지로
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
