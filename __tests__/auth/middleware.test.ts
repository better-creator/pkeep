import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

// middleware.ts의 구조적 정합성 검증 (실제 Next.js 미들웨어는 통합테스트 필요)
const middlewarePath = path.resolve(__dirname, '../../middleware.ts')
const code = fs.readFileSync(middlewarePath, 'utf-8')

describe('Root Middleware 구조 검증', () => {
  // ==========================================================
  // 시나리오 27: PUBLIC_PATHS 설정
  // ==========================================================
  describe('PUBLIC_PATHS', () => {
    it('/ (홈) 포함', () => {
      expect(code).toContain("'/'")
    })

    it('/login 포함', () => {
      expect(code).toContain("'/login'")
    })

    it('/signup 포함', () => {
      expect(code).toContain("'/signup'")
    })

    it('/auth/callback 포함', () => {
      expect(code).toContain("'/auth/callback'")
    })

    it('/invite 포함', () => {
      expect(code).toContain("'/invite'")
    })
  })

  // ==========================================================
  // 시나리오 28: 인증 로직
  // ==========================================================
  describe('인증 로직', () => {
    it('supabase.auth.getUser() 호출 (세션 리프레시)', () => {
      expect(code).toContain('auth.getUser()')
    })

    it('미인증 유저 → /login 리다이렉트', () => {
      expect(code).toContain("pathname = '/login'")
    })

    it('redirect 쿼리 파라미터 전달', () => {
      expect(code).toContain("searchParams.set('redirect', pathname)")
    })

    it('인증된 유저가 /login 접근 시 → 대시보드 리다이렉트', () => {
      expect(code).toContain("pathname === '/login'")
      expect(code).toContain("pathname = '/dashboard'")
    })
  })

  // ==========================================================
  // 시나리오 29: API 라우트 통과
  // ==========================================================
  describe('API 라우트 처리', () => {
    it('API 라우트는 미들웨어에서 통과 (각 라우트에서 자체 체크)', () => {
      expect(code).toContain("pathname.startsWith('/api/')")
    })
  })

  // ==========================================================
  // 시나리오 30: AUTH_ONLY_PATHS
  // ==========================================================
  describe('AUTH_ONLY_PATHS', () => {
    it('/onboarding 정의', () => {
      expect(code).toContain("'/onboarding'")
    })
  })
})
