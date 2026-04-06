// ============================================================
// Auth 모듈 — 서버 사이드 인증 헬퍼
// ============================================================

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

/**
 * 현재 로그인 유저를 반환. 미인증이면 null.
 */
export async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

/**
 * 현재 로그인 유저를 반환. 미인증이면 /login으로 리다이렉트.
 * Server Component / Server Action에서 사용.
 */
export async function requireUser() {
  const user = await getUser()
  if (!user) {
    redirect('/login')
  }
  return user
}

/**
 * 현재 세션 반환 (access token 등 필요한 경우)
 */
export async function getSession() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

/**
 * 이메일/비밀번호 회원가입
 */
export async function signUpWithEmail(email: string, password: string, name: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: name },
    },
  })
  return { data, error }
}

/**
 * 이메일/비밀번호 로그인
 */
export async function signInWithEmail(email: string, password: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
}

/**
 * OAuth 로그인 (Google, Kakao 등)
 */
export async function signInWithOAuth(provider: 'google' | 'kakao' | 'github') {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  })
  return { data, error }
}

/**
 * 로그아웃
 */
export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
