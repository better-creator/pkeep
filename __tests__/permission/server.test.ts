import { describe, it, expect } from 'vitest'
import { checkPermission } from '@/lib/modules/permission/server'
import type { UserRoles } from '@/lib/modules/permission/types'

// checkPermission은 DB 호출 없이 순수 함수이므로 바로 테스트 가능

function makeRoles(overrides: Partial<UserRoles>): UserRoles {
  return {
    userId: 'user-1',
    orgRole: null,
    teamRole: null,
    orgId: null,
    teamId: null,
    ...overrides,
  }
}

describe('checkPermission (서버 순수 로직)', () => {
  // ==========================================================
  // 시나리오 9: Org Owner 시나리오
  // ==========================================================
  describe('Org Owner', () => {
    const roles = makeRoles({ orgRole: 'owner', orgId: 'org-1' })

    it('org:delete 가능', () => {
      expect(checkPermission('org:delete', roles)).toBe(true)
    })

    it('org:manage_billing 가능', () => {
      expect(checkPermission('org:manage_billing', roles)).toBe(true)
    })

    it('team:create_project — org owner escalation으로 통과', () => {
      expect(checkPermission('team:create_project', roles)).toBe(true)
    })

    it('project:create_decision — org owner escalation으로 통과', () => {
      expect(checkPermission('project:create_decision', roles)).toBe(true)
    })
  })

  // ==========================================================
  // 시나리오 10: Org Admin 시나리오
  // ==========================================================
  describe('Org Admin', () => {
    const roles = makeRoles({ orgRole: 'admin', orgId: 'org-1' })

    it('org:invite_member 가능', () => {
      expect(checkPermission('org:invite_member', roles)).toBe(true)
    })

    it('org:delete 불가', () => {
      expect(checkPermission('org:delete', roles)).toBe(false)
    })

    it('org:manage_billing 불가', () => {
      expect(checkPermission('org:manage_billing', roles)).toBe(false)
    })

    it('team 액션은 escalation으로 통과', () => {
      expect(checkPermission('team:manage_members', roles)).toBe(true)
    })
  })

  // ==========================================================
  // 시나리오 11: Org Member (최소 권한)
  // ==========================================================
  describe('Org Member', () => {
    const roles = makeRoles({ orgRole: 'member', orgId: 'org-1' })

    it('org:view_audit_log 가능', () => {
      expect(checkPermission('org:view_audit_log', roles)).toBe(true)
    })

    it('org:invite_member 불가', () => {
      expect(checkPermission('org:invite_member', roles)).toBe(false)
    })

    it('team 액션 — escalation 없음 (member는 admin/owner가 아님)', () => {
      expect(checkPermission('team:create_project', roles)).toBe(false)
    })
  })

  // ==========================================================
  // 시나리오 12: Team Lead
  // ==========================================================
  describe('Team Lead', () => {
    const roles = makeRoles({ teamRole: 'lead', teamId: 'team-1' })

    it('team:manage_members 가능', () => {
      expect(checkPermission('team:manage_members', roles)).toBe(true)
    })

    it('project:update 가능', () => {
      expect(checkPermission('project:update', roles)).toBe(true)
    })

    it('org 액션 불가 (orgRole 없음)', () => {
      expect(checkPermission('org:update', roles)).toBe(false)
    })
  })

  // ==========================================================
  // 시나리오 13: Team Contributor
  // ==========================================================
  describe('Team Contributor', () => {
    const roles = makeRoles({ teamRole: 'contributor', teamId: 'team-1' })

    it('project:create_decision 가능', () => {
      expect(checkPermission('project:create_decision', roles)).toBe(true)
    })

    it('project:record_meeting 가능', () => {
      expect(checkPermission('project:record_meeting', roles)).toBe(true)
    })

    it('project:update 불가 (lead만)', () => {
      expect(checkPermission('project:update', roles)).toBe(false)
    })

    it('team:manage_members 불가', () => {
      expect(checkPermission('team:manage_members', roles)).toBe(false)
    })
  })

  // ==========================================================
  // 시나리오 14: Team Viewer (읽기 전용)
  // ==========================================================
  describe('Team Viewer', () => {
    const roles = makeRoles({ teamRole: 'viewer', teamId: 'team-1' })

    it('project:view 가능', () => {
      expect(checkPermission('project:view', roles)).toBe(true)
    })

    it('project:ai_chat 가능', () => {
      expect(checkPermission('project:ai_chat', roles)).toBe(true)
    })

    it('project:export 가능', () => {
      expect(checkPermission('project:export', roles)).toBe(true)
    })

    it('project:create_decision 불가', () => {
      expect(checkPermission('project:create_decision', roles)).toBe(false)
    })

    it('project:record_meeting 불가', () => {
      expect(checkPermission('project:record_meeting', roles)).toBe(false)
    })

    it('project:manage_tasks 불가', () => {
      expect(checkPermission('project:manage_tasks', roles)).toBe(false)
    })
  })

  // ==========================================================
  // 시나리오 15: 역할 없음 (비인증/비소속)
  // ==========================================================
  describe('No roles', () => {
    const roles = makeRoles({})

    it('모든 org 액션 불가', () => {
      expect(checkPermission('org:update', roles)).toBe(false)
    })

    it('모든 team 액션 불가', () => {
      expect(checkPermission('team:create_project', roles)).toBe(false)
    })

    it('모든 project 액션 불가', () => {
      expect(checkPermission('project:view', roles)).toBe(false)
    })
  })

  // ==========================================================
  // 시나리오 16: Org member + Team lead (복합)
  // ==========================================================
  describe('Org member + Team lead', () => {
    const roles = makeRoles({
      orgRole: 'member',
      orgId: 'org-1',
      teamRole: 'lead',
      teamId: 'team-1',
    })

    it('org:invite_member 불가 (member)', () => {
      expect(checkPermission('org:invite_member', roles)).toBe(false)
    })

    it('team:manage_members 가능 (lead)', () => {
      expect(checkPermission('team:manage_members', roles)).toBe(true)
    })

    it('project:update 가능 (lead)', () => {
      expect(checkPermission('project:update', roles)).toBe(true)
    })
  })
})
