import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

// organization/server.ts의 구조적 정합성 검증
const codePath = path.resolve(__dirname, '../../lib/modules/organization/server.ts')
const code = fs.readFileSync(codePath, 'utf-8')

describe('Organization Module 구조 검증', () => {
  // ==========================================================
  // 시나리오 31: RPC 트랜잭션 사용 (리뷰 이슈 #2 수정 확인)
  // ==========================================================
  describe('createOrganization', () => {
    it('RPC create_organization_with_team 호출', () => {
      expect(code).toContain("supabase.rpc('create_organization_with_team'")
    })

    it('개별 INSERT 대신 RPC 사용 (트랜잭션 보장)', () => {
      // 4번의 개별 .from().insert()가 없어야 함
      const insertCount = (code.match(/\.from\(['"]organizations['"]\)[\s\S]*?\.insert/g) || []).length
      expect(insertCount).toBe(0)
    })

    it('에러 로깅 포함', () => {
      expect(code).toContain('console.error')
    })
  })

  // ==========================================================
  // 시나리오 32: Slug 생성
  // ==========================================================
  describe('generateSlug', () => {
    it('함수 정의 존재', () => {
      expect(code).toContain('function generateSlug')
    })

    it('랜덤 suffix로 유니크 보장', () => {
      expect(code).toContain('Math.random().toString(36)')
    })
  })

  // ==========================================================
  // 시나리오 33: hasOrganization
  // ==========================================================
  describe('hasOrganization', () => {
    it('org_members count 쿼리', () => {
      expect(code).toContain("count: 'exact'")
    })

    it('head: true (데이터 반환 없이 카운트만)', () => {
      expect(code).toContain('head: true')
    })
  })
})
