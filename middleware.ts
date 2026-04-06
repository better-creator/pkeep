import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// 인증 없이 접근 가능한 경로
const PUBLIC_PATHS = [
  '/',
  '/login',
  '/signup',
  '/auth/callback',
  '/invite',
]

// 인증 필요하지만 조직 없어도 접근 가능한 경로
const AUTH_ONLY_PATHS = [
  '/onboarding',
]

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.some((path) =>
    pathname === path || pathname.startsWith(path + '/')
  )
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // 세션 리프레시 (중요: getUser()가 토큰 갱신을 트리거)
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // API 라우트는 통과 (각 라우트에서 자체 인증 체크)
  if (pathname.startsWith('/api/')) {
    return supabaseResponse
  }

  // 정적 파일, 이미지 등은 통과
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/icons/') ||
    pathname.includes('.') // .css, .js, .png, etc
  ) {
    return supabaseResponse
  }

  // [임시 비활성화] 로그인 없이 접근 허용
  // 미인증 유저가 보호 경로 접근 시 → 로그인으로 리다이렉트
  // if (!user && !isPublicPath(pathname)) {
  //   const url = request.nextUrl.clone()
  //   url.pathname = '/login'
  //   url.searchParams.set('redirect', pathname)
  //   return NextResponse.redirect(url)
  // }

  // 인증된 유저가 로그인/회원가입 접근 시 → 대시보드로 리다이렉트
  // if (user && (pathname === '/login' || pathname === '/signup')) {
  //   const url = request.nextUrl.clone()
  //   url.pathname = '/dashboard'
  //   return NextResponse.redirect(url)
  // }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * 모든 경로에 적용 (static 파일 제외)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
