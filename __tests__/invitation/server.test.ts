import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

// invitation/server.ts의 구조적 정합성 검증
const codePath = path.resolve(__dirname, '../../lib/modules/invitation/server.ts')
const code = fs.readFileSync(codePath, 'utf-8')

describe('Invitation Module 구조 검증', () => {
  // ==========================================================
  // 시나리오 34: Owner 초대 방어 (리뷰 이슈 #8 수정 확인)
  // ==========================================================
  describe('createInvitation 권한 검증', () => {
    it('초대자 역할 확인 (getUserOrgRole 호출)', () => {
      expect(code).toContain('getUserOrgRole')
    })

    it('admin이 admin 초대 차단', () => {
      expect(code).toContain("callerRole === 'admin' && input.orgRole === 'admin'")
    })

    it('권한 없으면 에러 반환', () => {
      expect(code).toContain('초대 권한이 없습니다')
    })
  })

  // ==========================================================
  // 시나리오 35: 감사 로그 (리뷰 이슈 #10 수정 확인)
  // ==========================================================
  describe('감사 로그', () => {
    it('초대 생성 시 log_audit 호출', () => {
      expect(code).toContain("'invitation:created'")
    })

    it('초대 수락 시 log_audit 호출', () => {
      expect(code).toContain("'invitation:accepted'")
    })
  })

  // ==========================================================
  // 시나리오 36: 만료/무효 에러 분기 (리뷰 이슈 #15 수정)
  // ==========================================================
  describe('에러 메시지 분기', () => {
    it('만료된 초대 체크 함수 존재', () => {
      expect(code).toContain('isTokenExpired')
    })

    it('만료 시 별도 에러 메시지', () => {
      expect(code).toContain('초대가 만료되었습니다')
    })

    it('무효 시 별도 에러 메시지', () => {
      expect(code).toContain('유효하지 않은 초대 코드입니다')
    })
  })

  // ==========================================================
  // 시나리오 37: getInvitationByToken
  // ==========================================================
  describe('getInvitationByToken', () => {
    it('.maybeSingle() 사용 (리뷰 이슈 #5 패턴)', () => {
      expect(code).toContain('.maybeSingle()')
    })

    it('status=pending 필터', () => {
      expect(code).toContain("'pending'")
    })

    it('expires_at 만료 체크', () => {
      expect(code).toContain('expires_at')
    })

    it('organization, team 조인', () => {
      expect(code).toContain('organization:org_id')
      expect(code).toContain('team:team_id')
    })
  })

  // ==========================================================
  // 시나리오 38: acceptInvitation upsert
  // ==========================================================
  describe('acceptInvitation', () => {
    it('org_members upsert (onConflict)', () => {
      expect(code).toContain("onConflict: 'org_id,user_id'")
    })

    it('members upsert (onConflict)', () => {
      expect(code).toContain("onConflict: 'team_id,user_id'")
    })

    it('초대 상태를 accepted로 업데이트', () => {
      expect(code).toContain("status: 'accepted'")
    })

    it('팀의 첫 프로젝트로 리다이렉트', () => {
      expect(code).toContain('projects')
      expect(code).toContain('redirectTo')
    })
  })
})
