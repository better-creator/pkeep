import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

// SQL 마이그레이션 파일의 구조적 정합성을 검증
const migrationPath = path.resolve(__dirname, '../../supabase/migrations/004_account_structure.sql')
const sql = fs.readFileSync(migrationPath, 'utf-8')

describe('Migration 004_account_structure.sql 구조 검증', () => {
  // ==========================================================
  // 시나리오 17: 필수 테이블 존재
  // ==========================================================
  describe('필수 테이블 생성', () => {
    const requiredTables = [
      'organizations',
      'org_members',
      'roles',
      'permissions',
      'role_permissions',
      'project_teams',
      'integrations',
      'integration_channels',
      'invitations',
      'audit_logs',
    ]

    requiredTables.forEach((table) => {
      it(`CREATE TABLE ${table} 존재`, () => {
        expect(sql).toMatch(new RegExp(`CREATE TABLE ${table}\\s*\\(`, 'i'))
      })
    })
  })

  // ==========================================================
  // 시나리오 18: 기존 테이블 변경
  // ==========================================================
  describe('기존 테이블 ALTER', () => {
    it('teams에 org_id 추가', () => {
      expect(sql).toMatch(/ALTER TABLE teams ADD COLUMN org_id/i)
    })

    it('members에 team_role 추가', () => {
      expect(sql).toMatch(/ALTER TABLE members ADD COLUMN team_role/i)
    })

    it('members에 UNIQUE(team_id, user_id) 제약 추가', () => {
      expect(sql).toMatch(/members_team_user_unique.*UNIQUE.*\(team_id.*user_id\)/i)
    })
  })

  // ==========================================================
  // 시나리오 19: RLS 활성화
  // ==========================================================
  describe('RLS 활성화', () => {
    const rlsTables = [
      'organizations', 'org_members', 'roles', 'permissions',
      'role_permissions', 'project_teams', 'integrations',
      'integration_channels', 'invitations', 'audit_logs',
    ]

    rlsTables.forEach((table) => {
      it(`${table} RLS 활성화`, () => {
        expect(sql).toMatch(new RegExp(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`, 'i'))
      })
    })
  })

  // ==========================================================
  // 시나리오 20: 기존 RLS 정책 교체
  // ==========================================================
  describe('기존 RLS 정책 DROP', () => {
    const droppedPolicies = [
      'Team members can access teams',
      'Team members can access members',
      'Team members can access projects',
      'Team members can access screens',
      'Team members can access features',
      'Team members can access decisions',
      'Team members can access meetings',
      'Team members can access decision_sources',
      'Team members can access decision_links',
      'Team members can access external_links',
      'Team members can access github_events',
      'Team members can access affinity_groups',
      'Team members can access affinity_items',
      'Team members can access rejected_alternatives',
      'Team members can access tasks',
    ]

    droppedPolicies.forEach((policy) => {
      it(`DROP POLICY "${policy}"`, () => {
        expect(sql).toContain(`DROP POLICY IF EXISTS "${policy}"`)
      })
    })
  })

  // ==========================================================
  // 시나리오 21: 새 RLS 정책 — SELECT/INSERT/UPDATE/DELETE 분리
  // ==========================================================
  describe('새 RLS 정책 (역할 기반)', () => {
    it('organizations에 SELECT/INSERT/UPDATE/DELETE 정책', () => {
      expect(sql).toMatch(/ON organizations FOR SELECT/i)
      expect(sql).toMatch(/ON organizations FOR INSERT/i)
      expect(sql).toMatch(/ON organizations FOR UPDATE/i)
      expect(sql).toMatch(/ON organizations FOR DELETE/i)
    })

    it('screens에 역할 기반 정책', () => {
      expect(sql).toMatch(/Members can view screens/)
      expect(sql).toMatch(/Contributors\+ can write screens/)
      expect(sql).toMatch(/Leads can delete screens/)
    })

    it('invitations에 DELETE 정책 존재 (리뷰 이슈 #9 수정)', () => {
      expect(sql).toMatch(/ON invitations FOR DELETE/i)
    })
  })

  // ==========================================================
  // 시나리오 22: 시드 데이터 검증
  // ==========================================================
  describe('시드 데이터', () => {
    it('6개 기본 역할 (org 3 + team 3)', () => {
      const roleInserts = sql.match(/INSERT INTO roles.*VALUES/gs)
      expect(roleInserts).not.toBeNull()
      // owner, admin, member + lead, contributor, viewer
      expect(sql).toContain("'owner'")
      expect(sql).toContain("'admin'")
      expect(sql).toContain("'lead'")
      expect(sql).toContain("'contributor'")
      expect(sql).toContain("'viewer'")
    })

    it('권한 목록에 org/team/project 스코프 포함', () => {
      expect(sql).toContain("'org:update'")
      expect(sql).toContain("'team:create_project'")
      expect(sql).toContain("'project:create_decision'")
    })

    it('role_permissions 매핑 INSERT 존재', () => {
      expect(sql).toMatch(/INSERT INTO role_permissions/i)
    })
  })

  // ==========================================================
  // 시나리오 23: Helper Functions 검증
  // ==========================================================
  describe('Helper Functions', () => {
    it('user_org_ids() 함수', () => {
      expect(sql).toMatch(/CREATE OR REPLACE FUNCTION user_org_ids/i)
    })

    it('user_team_ids() 함수', () => {
      expect(sql).toMatch(/CREATE OR REPLACE FUNCTION user_team_ids/i)
    })

    it('has_permission() 함수', () => {
      expect(sql).toMatch(/CREATE OR REPLACE FUNCTION has_permission/i)
    })

    it('log_audit() 함수', () => {
      expect(sql).toMatch(/CREATE OR REPLACE FUNCTION log_audit/i)
    })

    it('handle_new_organization() 트리거 함수', () => {
      expect(sql).toMatch(/CREATE OR REPLACE FUNCTION handle_new_organization/i)
    })

    it('create_organization_with_team() 트랜잭션 RPC (리뷰 이슈 #2 수정)', () => {
      expect(sql).toMatch(/CREATE OR REPLACE FUNCTION create_organization_with_team/i)
    })
  })

  // ==========================================================
  // 시나리오 24: 보안 체크
  // ==========================================================
  describe('보안 설정', () => {
    it('integrations의 credentials는 bytea (암호화 저장)', () => {
      expect(sql).toMatch(/credentials_encrypted\s+bytea/i)
    })

    it('invitations에 token UNIQUE 제약', () => {
      expect(sql).toMatch(/token\s+text\s+NOT NULL\s+UNIQUE/i)
    })

    it('invitations에 만료일 기본값 7일', () => {
      expect(sql).toMatch(/interval '7 days'/i)
    })

    it('audit_logs RLS — 읽기만 허용 (쓰기는 service_role)', () => {
      expect(sql).toMatch(/ON audit_logs FOR SELECT/i)
      // INSERT 정책은 없어야 함 (service_role로만 기록)
      expect(sql).not.toMatch(/ON audit_logs FOR INSERT/i)
    })
  })

  // ==========================================================
  // 시나리오 25: 인덱스 검증
  // ==========================================================
  describe('인덱스', () => {
    it('organizations slug 인덱스', () => {
      expect(sql).toMatch(/idx_organizations_slug/i)
    })

    it('org_members org_id/user_id 인덱스', () => {
      expect(sql).toMatch(/idx_org_members_org_id/i)
      expect(sql).toMatch(/idx_org_members_user_id/i)
    })

    it('audit_logs created_at DESC 인덱스', () => {
      expect(sql).toMatch(/idx_audit_logs_created_at.*DESC/i)
    })
  })
})
