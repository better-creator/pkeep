import { describe, it, expect } from 'vitest'
import {
  ORG_ROLE_PERMISSIONS,
  TEAM_ROLE_PERMISSIONS,
  ORG_ROLE_HIERARCHY,
  TEAM_ROLE_HIERARCHY,
} from '@/lib/modules/permission/constants'

describe('Permission Constants', () => {
  // ==========================================================
  // 시나리오 1: Org 역할별 권한 정합성
  // ==========================================================
  describe('Org Role Permissions', () => {
    it('owner는 모든 org 권한을 가진다', () => {
      const ownerPerms = ORG_ROLE_PERMISSIONS.owner
      expect(ownerPerms).toContain('org:update')
      expect(ownerPerms).toContain('org:delete')
      expect(ownerPerms).toContain('org:manage_billing')
      expect(ownerPerms).toContain('org:invite_member')
      expect(ownerPerms).toContain('org:remove_member')
      expect(ownerPerms).toContain('org:manage_roles')
      expect(ownerPerms).toContain('org:manage_integrations')
      expect(ownerPerms).toContain('org:view_audit_log')
      expect(ownerPerms).toContain('org:create_team')
      expect(ownerPerms).toContain('org:delete_team')
    })

    it('admin은 org:delete, org:manage_billing 을 가지지 않는다', () => {
      const adminPerms = ORG_ROLE_PERMISSIONS.admin
      expect(adminPerms).not.toContain('org:delete')
      expect(adminPerms).not.toContain('org:manage_billing')
    })

    it('admin은 멤버 초대/제거/팀 생성 권한을 가진다', () => {
      const adminPerms = ORG_ROLE_PERMISSIONS.admin
      expect(adminPerms).toContain('org:invite_member')
      expect(adminPerms).toContain('org:remove_member')
      expect(adminPerms).toContain('org:create_team')
      expect(adminPerms).toContain('org:delete_team')
    })

    it('member는 감사로그 조회만 가능하다', () => {
      const memberPerms = ORG_ROLE_PERMISSIONS.member
      expect(memberPerms).toEqual(['org:view_audit_log'])
    })

    it('owner 권한은 admin 권한의 상위집합이다', () => {
      const ownerPerms = new Set(ORG_ROLE_PERMISSIONS.owner)
      ORG_ROLE_PERMISSIONS.admin.forEach((perm) => {
        expect(ownerPerms.has(perm)).toBe(true)
      })
    })
  })

  // ==========================================================
  // 시나리오 2: Team 역할별 권한 정합성
  // ==========================================================
  describe('Team Role Permissions', () => {
    it('lead는 모든 team + project 권한을 가진다', () => {
      const leadPerms = TEAM_ROLE_PERMISSIONS.lead
      expect(leadPerms).toContain('team:update')
      expect(leadPerms).toContain('team:manage_members')
      expect(leadPerms).toContain('team:create_project')
      expect(leadPerms).toContain('team:delete_project')
      expect(leadPerms).toContain('team:manage_channels')
      expect(leadPerms).toContain('project:update')
      expect(leadPerms).toContain('project:record_meeting')
      expect(leadPerms).toContain('project:create_decision')
      expect(leadPerms).toContain('project:manage_tasks')
      expect(leadPerms).toContain('project:view')
      expect(leadPerms).toContain('project:ai_chat')
      expect(leadPerms).toContain('project:export')
    })

    it('contributor는 team 관리 권한이 없다', () => {
      const contribPerms = TEAM_ROLE_PERMISSIONS.contributor
      expect(contribPerms).not.toContain('team:update')
      expect(contribPerms).not.toContain('team:manage_members')
      expect(contribPerms).not.toContain('team:create_project')
      expect(contribPerms).not.toContain('team:delete_project')
      expect(contribPerms).not.toContain('team:manage_channels')
    })

    it('contributor는 프로젝트 작업 권한을 가진다 (update 제외)', () => {
      const contribPerms = TEAM_ROLE_PERMISSIONS.contributor
      expect(contribPerms).toContain('project:record_meeting')
      expect(contribPerms).toContain('project:create_decision')
      expect(contribPerms).toContain('project:manage_tasks')
      expect(contribPerms).not.toContain('project:update')
    })

    it('viewer는 조회/AI/내보내기만 가능하다', () => {
      const viewerPerms = TEAM_ROLE_PERMISSIONS.viewer
      expect(viewerPerms).toHaveLength(3)
      expect(viewerPerms).toContain('project:view')
      expect(viewerPerms).toContain('project:ai_chat')
      expect(viewerPerms).toContain('project:export')
    })

    it('lead 권한은 contributor 권한의 상위집합이다', () => {
      const leadPerms = new Set(TEAM_ROLE_PERMISSIONS.lead)
      TEAM_ROLE_PERMISSIONS.contributor.forEach((perm) => {
        expect(leadPerms.has(perm)).toBe(true)
      })
    })

    it('contributor 권한은 viewer 권한의 상위집합이다', () => {
      const contribPerms = new Set(TEAM_ROLE_PERMISSIONS.contributor)
      TEAM_ROLE_PERMISSIONS.viewer.forEach((perm) => {
        expect(contribPerms.has(perm)).toBe(true)
      })
    })
  })

  // ==========================================================
  // 시나리오 3: 역할 계층 순서 검증
  // ==========================================================
  describe('Role Hierarchy', () => {
    it('org: owner > admin > member', () => {
      expect(ORG_ROLE_HIERARCHY.owner).toBeGreaterThan(ORG_ROLE_HIERARCHY.admin)
      expect(ORG_ROLE_HIERARCHY.admin).toBeGreaterThan(ORG_ROLE_HIERARCHY.member)
    })

    it('team: lead > contributor > viewer', () => {
      expect(TEAM_ROLE_HIERARCHY.lead).toBeGreaterThan(TEAM_ROLE_HIERARCHY.contributor)
      expect(TEAM_ROLE_HIERARCHY.contributor).toBeGreaterThan(TEAM_ROLE_HIERARCHY.viewer)
    })
  })
})
