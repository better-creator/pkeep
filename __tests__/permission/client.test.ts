import { describe, it, expect } from 'vitest'
import {
  checkClientPermission,
  isOrgRoleAtLeast,
  isTeamRoleAtLeast,
} from '@/lib/modules/permission/client'

describe('checkClientPermission', () => {
  // ==========================================================
  // 시나리오 4: Org 역할 기반 권한 체크
  // ==========================================================
  describe('Org 액션', () => {
    it('owner는 org:delete 가능', () => {
      expect(checkClientPermission('org:delete', { orgRole: 'owner' })).toBe(true)
    })

    it('admin은 org:delete 불가', () => {
      expect(checkClientPermission('org:delete', { orgRole: 'admin' })).toBe(false)
    })

    it('member는 org:invite_member 불가', () => {
      expect(checkClientPermission('org:invite_member', { orgRole: 'member' })).toBe(false)
    })

    it('역할 없으면 모두 불가', () => {
      expect(checkClientPermission('org:update', { orgRole: null })).toBe(false)
      expect(checkClientPermission('org:update', {})).toBe(false)
    })
  })

  // ==========================================================
  // 시나리오 5: Team 역할 기반 권한 체크
  // ==========================================================
  describe('Team/Project 액션', () => {
    it('lead는 team:manage_members 가능', () => {
      expect(checkClientPermission('team:manage_members', { teamRole: 'lead' })).toBe(true)
    })

    it('contributor는 team:manage_members 불가', () => {
      expect(checkClientPermission('team:manage_members', { teamRole: 'contributor' })).toBe(false)
    })

    it('contributor는 project:create_decision 가능', () => {
      expect(checkClientPermission('project:create_decision', { teamRole: 'contributor' })).toBe(true)
    })

    it('viewer는 project:create_decision 불가', () => {
      expect(checkClientPermission('project:create_decision', { teamRole: 'viewer' })).toBe(false)
    })

    it('viewer는 project:view 가능', () => {
      expect(checkClientPermission('project:view', { teamRole: 'viewer' })).toBe(true)
    })
  })

  // ==========================================================
  // 시나리오 6: Org admin/owner의 하위 권한 통과
  // ==========================================================
  describe('Org role escalation', () => {
    it('org owner는 team 액션도 통과', () => {
      expect(checkClientPermission('team:create_project', { orgRole: 'owner' })).toBe(true)
    })

    it('org admin은 project 액션도 통과', () => {
      expect(checkClientPermission('project:create_decision', { orgRole: 'admin' })).toBe(true)
    })

    it('org member는 team 액션 불통과 (escalation 없음)', () => {
      expect(checkClientPermission('team:create_project', { orgRole: 'member' })).toBe(false)
    })
  })

  // ==========================================================
  // 시나리오 7: 복합 역할 (org + team 둘 다 있는 경우)
  // ==========================================================
  describe('복합 역할', () => {
    it('org member + team lead → team 권한 사용', () => {
      expect(checkClientPermission('team:manage_members', {
        orgRole: 'member',
        teamRole: 'lead',
      })).toBe(true)
    })

    it('org admin + team viewer → org escalation으로 team 권한 통과', () => {
      expect(checkClientPermission('team:create_project', {
        orgRole: 'admin',
        teamRole: 'viewer',
      })).toBe(true)
    })
  })
})

// ==========================================================
// 시나리오 8: 역할 비교 함수
// ==========================================================
describe('isOrgRoleAtLeast', () => {
  it('owner >= owner', () => expect(isOrgRoleAtLeast('owner', 'owner')).toBe(true))
  it('owner >= admin', () => expect(isOrgRoleAtLeast('owner', 'admin')).toBe(true))
  it('owner >= member', () => expect(isOrgRoleAtLeast('owner', 'member')).toBe(true))
  it('admin >= admin', () => expect(isOrgRoleAtLeast('admin', 'admin')).toBe(true))
  it('admin < owner', () => expect(isOrgRoleAtLeast('admin', 'owner')).toBe(false))
  it('member < admin', () => expect(isOrgRoleAtLeast('member', 'admin')).toBe(false))
})

describe('isTeamRoleAtLeast', () => {
  it('lead >= lead', () => expect(isTeamRoleAtLeast('lead', 'lead')).toBe(true))
  it('lead >= contributor', () => expect(isTeamRoleAtLeast('lead', 'contributor')).toBe(true))
  it('contributor >= viewer', () => expect(isTeamRoleAtLeast('contributor', 'viewer')).toBe(true))
  it('viewer < contributor', () => expect(isTeamRoleAtLeast('viewer', 'contributor')).toBe(false))
  it('contributor < lead', () => expect(isTeamRoleAtLeast('contributor', 'lead')).toBe(false))
})
