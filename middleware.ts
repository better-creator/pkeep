import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // [임시] 모든 경로 통과 — 로그인 없이 접근 허용
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
