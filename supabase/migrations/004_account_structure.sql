-- ============================================================
-- 004_account_structure.sql
-- Organization → Team → Project 3레벨 계정 구조 + RBAC + 감사 로그
-- ============================================================

-- ============================================================
-- 1. Organizations (조직 — 과금 단위)
-- ============================================================

CREATE TABLE organizations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  slug        text NOT NULL UNIQUE,
  logo_url    text,
  plan        text NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  -- 도메인 기반 자동 합류 (Pro/Enterprise)
  allowed_domains text[] DEFAULT '{}',
  -- B2G: IP 화이트리스트 (Enterprise)
  allowed_ips   text[] DEFAULT '{}',
  billing_email text,
  metadata      jsonb DEFAULT '{}',
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

CREATE INDEX idx_organizations_slug ON organizations(slug);

-- ============================================================
-- 2. Org Members (조직 멤버 — Org 레벨 역할)
-- ============================================================

CREATE TABLE org_members (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id    uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_role  text NOT NULL DEFAULT 'member' CHECK (org_role IN ('owner', 'admin', 'member')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(org_id, user_id)
);

CREATE INDEX idx_org_members_org_id ON org_members(org_id);
CREATE INDEX idx_org_members_user_id ON org_members(user_id);

-- ============================================================
-- 3. Teams 확장 (org_id 추가)
-- ============================================================

ALTER TABLE teams ADD COLUMN org_id uuid REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE teams ADD COLUMN description text;
ALTER TABLE teams ADD COLUMN updated_at timestamptz DEFAULT now();

CREATE INDEX idx_teams_org_id ON teams(org_id);

-- ============================================================
-- 4. Members 테이블 역할 정비 (team_role 추가)
--    기존 role 컬럼은 자유 텍스트 → team_role로 역할 체계화
-- ============================================================

ALTER TABLE members ADD COLUMN team_role text DEFAULT 'contributor'
  CHECK (team_role IN ('lead', 'contributor', 'viewer'));

-- upsert용 유니크 제약 (같은 유저가 같은 팀에 중복 등록 방지)
ALTER TABLE members ADD CONSTRAINT members_team_user_unique UNIQUE (team_id, user_id);

-- 기존 role 컬럼은 "직책/직함" 용도로 유지 (PM, 디자이너, 개발자 등)
-- team_role이 권한 체크에 사용됨

-- ============================================================
-- 5. DB 기반 역할/권한 (RBAC)
-- ============================================================

-- 역할 정의
CREATE TABLE roles (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope     text NOT NULL CHECK (scope IN ('org', 'team')),
  name      text NOT NULL,
  label     text,          -- UI 표시명 (한글)
  is_custom boolean DEFAULT false,
  org_id    uuid REFERENCES organizations(id) ON DELETE CASCADE,  -- 커스텀 역할은 org에 귀속
  created_at timestamptz DEFAULT now(),
  UNIQUE(scope, name, org_id)
);

-- 권한 정의
CREATE TABLE permissions (
  id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action  text NOT NULL UNIQUE,
  scope   text NOT NULL CHECK (scope IN ('org', 'team', 'project')),
  label   text           -- UI 표시명
);

-- 역할-권한 매핑
CREATE TABLE role_permissions (
  role_id       uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id uuid NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- ============================================================
-- 6. 기본 역할 & 권한 시드 데이터
-- ============================================================

-- Org 레벨 역할
INSERT INTO roles (id, scope, name, label) VALUES
  ('00000000-0000-0000-0000-000000000001', 'org', 'owner', '소유자'),
  ('00000000-0000-0000-0000-000000000002', 'org', 'admin', '관리자'),
  ('00000000-0000-0000-0000-000000000003', 'org', 'member', '멤버');

-- Team 레벨 역할
INSERT INTO roles (id, scope, name, label) VALUES
  ('00000000-0000-0000-0000-000000000011', 'team', 'lead', '팀 리더'),
  ('00000000-0000-0000-0000-000000000012', 'team', 'contributor', '기여자'),
  ('00000000-0000-0000-0000-000000000013', 'team', 'viewer', '뷰어');

-- 권한 목록
INSERT INTO permissions (id, action, scope, label) VALUES
  -- Org 권한
  ('10000000-0000-0000-0000-000000000001', 'org:update',           'org', '조직 설정 변경'),
  ('10000000-0000-0000-0000-000000000002', 'org:delete',           'org', '조직 삭제'),
  ('10000000-0000-0000-0000-000000000003', 'org:manage_billing',   'org', '결제 관리'),
  ('10000000-0000-0000-0000-000000000004', 'org:invite_member',    'org', '멤버 초대'),
  ('10000000-0000-0000-0000-000000000005', 'org:remove_member',    'org', '멤버 제거'),
  ('10000000-0000-0000-0000-000000000006', 'org:manage_roles',     'org', '역할 관리'),
  ('10000000-0000-0000-0000-000000000007', 'org:manage_integrations', 'org', '연동 관리'),
  ('10000000-0000-0000-0000-000000000008', 'org:view_audit_log',   'org', '감사 로그 조회'),
  ('10000000-0000-0000-0000-000000000009', 'org:create_team',      'org', '팀 생성'),
  ('10000000-0000-0000-0000-000000000010', 'org:delete_team',      'org', '팀 삭제'),
  -- Team 권한
  ('10000000-0000-0000-0000-000000000101', 'team:update',          'team', '팀 설정 변경'),
  ('10000000-0000-0000-0000-000000000102', 'team:manage_members',  'team', '팀 멤버 관리'),
  ('10000000-0000-0000-0000-000000000103', 'team:create_project',  'team', '프로젝트 생성'),
  ('10000000-0000-0000-0000-000000000104', 'team:delete_project',  'team', '프로젝트 삭제'),
  ('10000000-0000-0000-0000-000000000105', 'team:manage_channels', 'team', '연동 채널 설정'),
  -- Project 권한
  ('10000000-0000-0000-0000-000000000201', 'project:update',       'project', '프로젝트 설정 변경'),
  ('10000000-0000-0000-0000-000000000202', 'project:record_meeting', 'project', '회의 녹음'),
  ('10000000-0000-0000-0000-000000000203', 'project:create_decision', 'project', '결정 생성/수정'),
  ('10000000-0000-0000-0000-000000000204', 'project:manage_tasks',   'project', '할일 관리'),
  ('10000000-0000-0000-0000-000000000205', 'project:view',           'project', '프로젝트 조회'),
  ('10000000-0000-0000-0000-000000000206', 'project:ai_chat',        'project', 'AI Chat'),
  ('10000000-0000-0000-0000-000000000207', 'project:export',         'project', '내보내기');

-- Owner: 모든 권한
INSERT INTO role_permissions (role_id, permission_id)
  SELECT '00000000-0000-0000-0000-000000000001', id FROM permissions WHERE scope = 'org';

-- Admin: Owner 권한 중 org:delete, org:manage_billing 제외
INSERT INTO role_permissions (role_id, permission_id)
  SELECT '00000000-0000-0000-0000-000000000002', id FROM permissions
  WHERE scope = 'org' AND action NOT IN ('org:delete', 'org:manage_billing');

-- Member: 초대 불가, 팀 생성/삭제 불가
INSERT INTO role_permissions (role_id, permission_id)
  SELECT '00000000-0000-0000-0000-000000000003', id FROM permissions
  WHERE scope = 'org' AND action IN ('org:view_audit_log');

-- Team Lead: 모든 팀 + 프로젝트 권한
INSERT INTO role_permissions (role_id, permission_id)
  SELECT '00000000-0000-0000-0000-000000000011', id FROM permissions
  WHERE scope IN ('team', 'project');

-- Contributor: 프로젝트 작업 권한 (팀 관리 제외)
INSERT INTO role_permissions (role_id, permission_id)
  SELECT '00000000-0000-0000-0000-000000000012', id FROM permissions
  WHERE scope = 'project' AND action NOT IN ('project:update');

-- Viewer: 조회 + AI Chat + 내보내기만
INSERT INTO role_permissions (role_id, permission_id)
  SELECT '00000000-0000-0000-0000-000000000013', id FROM permissions
  WHERE action IN ('project:view', 'project:ai_chat', 'project:export');

-- ============================================================
-- 7. 크로스팀 프로젝트
-- ============================================================

CREATE TABLE project_teams (
  project_id    uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  team_id       uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  is_owner_team boolean DEFAULT false,
  created_at    timestamptz DEFAULT now(),
  PRIMARY KEY (project_id, team_id)
);

-- ============================================================
-- 8. 연동 (Integration)
-- ============================================================

CREATE TABLE integrations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provider    text NOT NULL CHECK (provider IN ('slack', 'notion', 'github', 'linear', 'figma')),
  -- OAuth 토큰 (암호화 저장 — Phase 1 보안 요구사항)
  credentials_encrypted bytea,
  status      text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error')),
  metadata    jsonb DEFAULT '{}',
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now(),
  UNIQUE(org_id, provider)
);

CREATE TABLE integration_channels (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id  uuid NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
  team_id         uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  channel_config  jsonb NOT NULL DEFAULT '{}',
  -- 예: { "channel_id": "C123", "channel_name": "#design-decisions", "events": ["decision_created"] }
  created_at      timestamptz DEFAULT now(),
  UNIQUE(integration_id, team_id)
);

-- ============================================================
-- 9. 초대 (Invitation)
-- ============================================================

CREATE TABLE invitations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  team_id     uuid REFERENCES teams(id) ON DELETE CASCADE,
  email       text NOT NULL,
  org_role    text NOT NULL DEFAULT 'member' CHECK (org_role IN ('admin', 'member')),
  team_role   text DEFAULT 'contributor' CHECK (team_role IN ('lead', 'contributor', 'viewer')),
  invited_by  uuid NOT NULL REFERENCES auth.users(id),
  token       text NOT NULL UNIQUE,
  status      text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  expires_at  timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_invitations_email ON invitations(email);

-- ============================================================
-- 10. 감사 로그 (Audit Log)
-- ============================================================

CREATE TABLE audit_logs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id      uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id     uuid REFERENCES auth.users(id),
  action      text NOT NULL,
  target_type text,        -- 'organization', 'team', 'project', 'decision', 'member' 등
  target_id   uuid,
  metadata    jsonb DEFAULT '{}',
  ip_address  inet,
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX idx_audit_logs_org_id ON audit_logs(org_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- ============================================================
-- 11. Row Level Security
-- ============================================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper: 유저가 속한 org_id 목록
CREATE OR REPLACE FUNCTION user_org_ids()
RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT org_id FROM org_members WHERE user_id = auth.uid();
$$;

-- Helper: 유저가 속한 team_id 목록
CREATE OR REPLACE FUNCTION user_team_ids()
RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT team_id FROM members WHERE user_id = auth.uid();
$$;

-- Helper: 유저의 org 역할 확인
CREATE OR REPLACE FUNCTION user_org_role(p_org_id uuid)
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT org_role FROM org_members WHERE org_id = p_org_id AND user_id = auth.uid();
$$;

-- Helper: 유저의 team 역할 확인
CREATE OR REPLACE FUNCTION user_team_role(p_team_id uuid)
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT team_role FROM members WHERE team_id = p_team_id AND user_id = auth.uid();
$$;

-- ----- Organizations -----
CREATE POLICY "Users can view their organizations"
  ON organizations FOR SELECT
  USING (id IN (SELECT user_org_ids()));

CREATE POLICY "Owners can update organization"
  ON organizations FOR UPDATE
  USING (user_org_role(id) = 'owner');

CREATE POLICY "Authenticated users can create organization"
  ON organizations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Owners can delete organization"
  ON organizations FOR DELETE
  USING (user_org_role(id) = 'owner');

-- ----- Org Members -----
CREATE POLICY "Org members can view fellow members"
  ON org_members FOR SELECT
  USING (org_id IN (SELECT user_org_ids()));

CREATE POLICY "Admins+ can manage org members"
  ON org_members FOR INSERT
  WITH CHECK (user_org_role(org_id) IN ('owner', 'admin'));

CREATE POLICY "Admins+ can update org members"
  ON org_members FOR UPDATE
  USING (user_org_role(org_id) IN ('owner', 'admin'));

CREATE POLICY "Admins+ can remove org members"
  ON org_members FOR DELETE
  USING (user_org_role(org_id) IN ('owner', 'admin'));

-- ----- Teams (기존 RLS 교체) -----
DROP POLICY IF EXISTS "Team members can access teams" ON teams;

CREATE POLICY "Org members can view teams"
  ON teams FOR SELECT
  USING (org_id IN (SELECT user_org_ids()));

CREATE POLICY "Admins+ can create teams"
  ON teams FOR INSERT
  WITH CHECK (user_org_role(org_id) IN ('owner', 'admin'));

CREATE POLICY "Admins+ can update teams"
  ON teams FOR UPDATE
  USING (
    user_org_role(org_id) IN ('owner', 'admin')
    OR user_team_role(id) = 'lead'
  );

CREATE POLICY "Admins+ can delete teams"
  ON teams FOR DELETE
  USING (user_org_role(org_id) IN ('owner', 'admin'));

-- ----- Members (팀 멤버) — 기존 RLS 교체 -----
DROP POLICY IF EXISTS "Team members can access members" ON members;

CREATE POLICY "Org members can view team members"
  ON members FOR SELECT
  USING (
    team_id IN (
      SELECT id FROM teams WHERE org_id IN (SELECT user_org_ids())
    )
  );

CREATE POLICY "Team leads or admins can manage members"
  ON members FOR INSERT
  WITH CHECK (
    user_team_role(team_id) = 'lead'
    OR user_org_role((SELECT org_id FROM teams WHERE id = team_id)) IN ('owner', 'admin')
  );

CREATE POLICY "Team leads or admins can update members"
  ON members FOR UPDATE
  USING (
    user_team_role(team_id) = 'lead'
    OR user_org_role((SELECT org_id FROM teams WHERE id = team_id)) IN ('owner', 'admin')
  );

CREATE POLICY "Team leads or admins can remove members"
  ON members FOR DELETE
  USING (
    user_team_role(team_id) = 'lead'
    OR user_org_role((SELECT org_id FROM teams WHERE id = team_id)) IN ('owner', 'admin')
  );

-- ----- Projects — 기존 RLS 교체 -----
DROP POLICY IF EXISTS "Team members can access projects" ON projects;

CREATE POLICY "Team members can view projects"
  ON projects FOR SELECT
  USING (team_id IN (SELECT user_team_ids()));

CREATE POLICY "Contributors+ can create projects"
  ON projects FOR INSERT
  WITH CHECK (
    user_team_role(team_id) IN ('lead', 'contributor')
  );

CREATE POLICY "Team leads can update projects"
  ON projects FOR UPDATE
  USING (user_team_role(team_id) = 'lead');

CREATE POLICY "Team leads can delete projects"
  ON projects FOR DELETE
  USING (user_team_role(team_id) = 'lead');

-- ----- 프로젝트 하위 리소스 RLS 업데이트 -----
-- screens, features, decisions, meetings, decision_sources, decision_links,
-- external_links, github_events, affinity_groups, affinity_items,
-- rejected_alternatives, tasks
-- → 기존 "for all" 정책을 SELECT/INSERT/UPDATE/DELETE로 분리

-- 매크로 대신 함수로 처리: 프로젝트 접근 가능 여부
CREATE OR REPLACE FUNCTION can_access_project(p_project_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM projects p
    JOIN members m ON m.team_id = p.team_id AND m.user_id = auth.uid()
    WHERE p.id = p_project_id
  );
$$;

-- 프로젝트에 write 가능 여부 (contributor 이상)
CREATE OR REPLACE FUNCTION can_write_project(p_project_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM projects p
    JOIN members m ON m.team_id = p.team_id AND m.user_id = auth.uid()
    WHERE p.id = p_project_id AND m.team_role IN ('lead', 'contributor')
  );
$$;

-- screens: 기존 정책 교체
DROP POLICY IF EXISTS "Team members can access screens" ON screens;
CREATE POLICY "Members can view screens"
  ON screens FOR SELECT USING (can_access_project(project_id));
CREATE POLICY "Contributors+ can write screens"
  ON screens FOR INSERT WITH CHECK (can_write_project(project_id));
CREATE POLICY "Contributors+ can update screens"
  ON screens FOR UPDATE USING (can_write_project(project_id));
CREATE POLICY "Leads can delete screens"
  ON screens FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM projects p
      JOIN members m ON m.team_id = p.team_id AND m.user_id = auth.uid()
      WHERE p.id = project_id AND m.team_role = 'lead'
    )
  );

-- features
DROP POLICY IF EXISTS "Team members can access features" ON features;
CREATE POLICY "Members can view features"
  ON features FOR SELECT USING (can_access_project(project_id));
CREATE POLICY "Contributors+ can write features"
  ON features FOR INSERT WITH CHECK (can_write_project(project_id));
CREATE POLICY "Contributors+ can update features"
  ON features FOR UPDATE USING (can_write_project(project_id));
CREATE POLICY "Leads can delete features"
  ON features FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM projects p
      JOIN members m ON m.team_id = p.team_id AND m.user_id = auth.uid()
      WHERE p.id = project_id AND m.team_role = 'lead'
    )
  );

-- decisions
DROP POLICY IF EXISTS "Team members can access decisions" ON decisions;
CREATE POLICY "Members can view decisions"
  ON decisions FOR SELECT USING (can_access_project(project_id));
CREATE POLICY "Contributors+ can write decisions"
  ON decisions FOR INSERT WITH CHECK (can_write_project(project_id));
CREATE POLICY "Contributors+ can update decisions"
  ON decisions FOR UPDATE USING (can_write_project(project_id));
CREATE POLICY "Leads can delete decisions"
  ON decisions FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM projects p
      JOIN members m ON m.team_id = p.team_id AND m.user_id = auth.uid()
      WHERE p.id = project_id AND m.team_role = 'lead'
    )
  );

-- meetings
DROP POLICY IF EXISTS "Team members can access meetings" ON meetings;
CREATE POLICY "Members can view meetings"
  ON meetings FOR SELECT USING (can_access_project(project_id));
CREATE POLICY "Contributors+ can write meetings"
  ON meetings FOR INSERT WITH CHECK (can_write_project(project_id));
CREATE POLICY "Contributors+ can update meetings"
  ON meetings FOR UPDATE USING (can_write_project(project_id));
CREATE POLICY "Leads can delete meetings"
  ON meetings FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM projects p
      JOIN members m ON m.team_id = p.team_id AND m.user_id = auth.uid()
      WHERE p.id = project_id AND m.team_role = 'lead'
    )
  );

-- decision_sources
DROP POLICY IF EXISTS "Team members can access decision_sources" ON decision_sources;
CREATE POLICY "Members can view decision_sources"
  ON decision_sources FOR SELECT USING (
    EXISTS (SELECT 1 FROM decisions d WHERE d.id = decision_id AND can_access_project(d.project_id))
  );
CREATE POLICY "Contributors+ can write decision_sources"
  ON decision_sources FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM decisions d WHERE d.id = decision_id AND can_write_project(d.project_id))
  );
CREATE POLICY "Contributors+ can update decision_sources"
  ON decision_sources FOR UPDATE USING (
    EXISTS (SELECT 1 FROM decisions d WHERE d.id = decision_id AND can_write_project(d.project_id))
  );
CREATE POLICY "Contributors+ can delete decision_sources"
  ON decision_sources FOR DELETE USING (
    EXISTS (SELECT 1 FROM decisions d WHERE d.id = decision_id AND can_write_project(d.project_id))
  );

-- decision_links
DROP POLICY IF EXISTS "Team members can access decision_links" ON decision_links;
CREATE POLICY "Members can view decision_links"
  ON decision_links FOR SELECT USING (
    EXISTS (SELECT 1 FROM decisions d WHERE d.id = decision_id AND can_access_project(d.project_id))
  );
CREATE POLICY "Contributors+ can write decision_links"
  ON decision_links FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM decisions d WHERE d.id = decision_id AND can_write_project(d.project_id))
  );
CREATE POLICY "Contributors+ can update decision_links"
  ON decision_links FOR UPDATE USING (
    EXISTS (SELECT 1 FROM decisions d WHERE d.id = decision_id AND can_write_project(d.project_id))
  );
CREATE POLICY "Contributors+ can delete decision_links"
  ON decision_links FOR DELETE USING (
    EXISTS (SELECT 1 FROM decisions d WHERE d.id = decision_id AND can_write_project(d.project_id))
  );

-- external_links
DROP POLICY IF EXISTS "Team members can access external_links" ON external_links;
CREATE POLICY "Members can view external_links"
  ON external_links FOR SELECT USING (can_access_project(project_id));
CREATE POLICY "Contributors+ can write external_links"
  ON external_links FOR INSERT WITH CHECK (can_write_project(project_id));
CREATE POLICY "Contributors+ can update external_links"
  ON external_links FOR UPDATE USING (can_write_project(project_id));
CREATE POLICY "Contributors+ can delete external_links"
  ON external_links FOR DELETE USING (can_write_project(project_id));

-- github_events
DROP POLICY IF EXISTS "Team members can access github_events" ON github_events;
CREATE POLICY "Members can view github_events"
  ON github_events FOR SELECT USING (can_access_project(project_id));
CREATE POLICY "Contributors+ can write github_events"
  ON github_events FOR INSERT WITH CHECK (can_write_project(project_id));
CREATE POLICY "Contributors+ can update github_events"
  ON github_events FOR UPDATE USING (can_write_project(project_id));

-- affinity_groups
DROP POLICY IF EXISTS "Team members can access affinity_groups" ON affinity_groups;
CREATE POLICY "Members can view affinity_groups"
  ON affinity_groups FOR SELECT USING (can_access_project(project_id));
CREATE POLICY "Contributors+ can write affinity_groups"
  ON affinity_groups FOR INSERT WITH CHECK (can_write_project(project_id));
CREATE POLICY "Contributors+ can update affinity_groups"
  ON affinity_groups FOR UPDATE USING (can_write_project(project_id));
CREATE POLICY "Contributors+ can delete affinity_groups"
  ON affinity_groups FOR DELETE USING (can_write_project(project_id));

-- affinity_items
DROP POLICY IF EXISTS "Team members can access affinity_items" ON affinity_items;
CREATE POLICY "Members can view affinity_items"
  ON affinity_items FOR SELECT USING (can_access_project(project_id));
CREATE POLICY "Contributors+ can write affinity_items"
  ON affinity_items FOR INSERT WITH CHECK (can_write_project(project_id));
CREATE POLICY "Contributors+ can update affinity_items"
  ON affinity_items FOR UPDATE USING (can_write_project(project_id));
CREATE POLICY "Contributors+ can delete affinity_items"
  ON affinity_items FOR DELETE USING (can_write_project(project_id));

-- rejected_alternatives
DROP POLICY IF EXISTS "Team members can access rejected_alternatives" ON rejected_alternatives;
CREATE POLICY "Members can view rejected_alternatives"
  ON rejected_alternatives FOR SELECT USING (can_access_project(project_id));
CREATE POLICY "Contributors+ can write rejected_alternatives"
  ON rejected_alternatives FOR INSERT WITH CHECK (can_write_project(project_id));
CREATE POLICY "Contributors+ can update rejected_alternatives"
  ON rejected_alternatives FOR UPDATE USING (can_write_project(project_id));
CREATE POLICY "Contributors+ can delete rejected_alternatives"
  ON rejected_alternatives FOR DELETE USING (can_write_project(project_id));

-- tasks
DROP POLICY IF EXISTS "Team members can access tasks" ON tasks;
CREATE POLICY "Members can view tasks"
  ON tasks FOR SELECT USING (can_access_project(project_id));
CREATE POLICY "Contributors+ can write tasks"
  ON tasks FOR INSERT WITH CHECK (can_write_project(project_id));
CREATE POLICY "Contributors+ can update tasks"
  ON tasks FOR UPDATE USING (can_write_project(project_id));
CREATE POLICY "Contributors+ can delete tasks"
  ON tasks FOR DELETE USING (can_write_project(project_id));

-- ----- 새 테이블 RLS 정책 -----

-- Roles: 기본 역할은 모두 조회, 커스텀 역할은 해당 org만
CREATE POLICY "Anyone can view default roles"
  ON roles FOR SELECT
  USING (org_id IS NULL OR org_id IN (SELECT user_org_ids()));

CREATE POLICY "Admins+ can manage custom roles"
  ON roles FOR INSERT
  WITH CHECK (
    org_id IS NOT NULL
    AND user_org_role(org_id) IN ('owner', 'admin')
  );

CREATE POLICY "Admins+ can update custom roles"
  ON roles FOR UPDATE
  USING (
    org_id IS NOT NULL AND is_custom = true
    AND user_org_role(org_id) IN ('owner', 'admin')
  );

-- Permissions: 모두 조회 가능 (읽기 전용)
CREATE POLICY "Anyone can view permissions"
  ON permissions FOR SELECT
  USING (true);

-- Role Permissions: 역할이 보이면 매핑도 보임
CREATE POLICY "Users can view role permissions"
  ON role_permissions FOR SELECT
  USING (
    role_id IN (
      SELECT id FROM roles WHERE org_id IS NULL OR org_id IN (SELECT user_org_ids())
    )
  );

-- Project Teams
CREATE POLICY "Org members can view project teams"
  ON project_teams FOR SELECT
  USING (
    team_id IN (
      SELECT id FROM teams WHERE org_id IN (SELECT user_org_ids())
    )
  );

CREATE POLICY "Leads+ can manage project teams"
  ON project_teams FOR INSERT
  WITH CHECK (user_team_role(team_id) = 'lead');

CREATE POLICY "Leads+ can remove project teams"
  ON project_teams FOR DELETE
  USING (user_team_role(team_id) = 'lead');

-- Integrations
CREATE POLICY "Org members can view integrations"
  ON integrations FOR SELECT
  USING (org_id IN (SELECT user_org_ids()));

CREATE POLICY "Admins+ can manage integrations"
  ON integrations FOR INSERT
  WITH CHECK (user_org_role(org_id) IN ('owner', 'admin'));

CREATE POLICY "Admins+ can update integrations"
  ON integrations FOR UPDATE
  USING (user_org_role(org_id) IN ('owner', 'admin'));

CREATE POLICY "Admins+ can delete integrations"
  ON integrations FOR DELETE
  USING (user_org_role(org_id) IN ('owner', 'admin'));

-- Integration Channels
CREATE POLICY "Team members can view channels"
  ON integration_channels FOR SELECT
  USING (team_id IN (SELECT user_team_ids()));

CREATE POLICY "Leads+ can manage channels"
  ON integration_channels FOR INSERT
  WITH CHECK (user_team_role(team_id) = 'lead');

CREATE POLICY "Leads+ can update channels"
  ON integration_channels FOR UPDATE
  USING (user_team_role(team_id) = 'lead');

CREATE POLICY "Leads+ can delete channels"
  ON integration_channels FOR DELETE
  USING (user_team_role(team_id) = 'lead');

-- Invitations
CREATE POLICY "Org members can view invitations"
  ON invitations FOR SELECT
  USING (org_id IN (SELECT user_org_ids()));

CREATE POLICY "Admins+ can create invitations"
  ON invitations FOR INSERT
  WITH CHECK (user_org_role(org_id) IN ('owner', 'admin'));

CREATE POLICY "Admins+ can update invitations"
  ON invitations FOR UPDATE
  USING (user_org_role(org_id) IN ('owner', 'admin'));

CREATE POLICY "Admins+ can revoke invitations"
  ON invitations FOR DELETE
  USING (user_org_role(org_id) IN ('owner', 'admin'));

-- Audit Logs: 읽기만 (쓰기는 서버에서 service_role로)
CREATE POLICY "Org members can view audit logs"
  ON audit_logs FOR SELECT
  USING (org_id IN (SELECT user_org_ids()));

-- ============================================================
-- 12. Helper Functions
-- ============================================================

-- 유저가 특정 권한을 가지고 있는지 확인
CREATE OR REPLACE FUNCTION has_permission(
  p_user_id uuid,
  p_action text,
  p_org_id uuid DEFAULT NULL,
  p_team_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER
AS $$
DECLARE
  v_scope text;
  v_org_role text;
  v_team_role text;
  v_has boolean;
BEGIN
  -- 액션의 scope 판별
  v_scope := split_part(p_action, ':', 1);

  IF v_scope = 'org' AND p_org_id IS NOT NULL THEN
    -- Org 역할로 권한 체크
    SELECT org_role INTO v_org_role
    FROM org_members WHERE org_id = p_org_id AND user_id = p_user_id;

    IF v_org_role IS NULL THEN RETURN false; END IF;

    SELECT EXISTS (
      SELECT 1 FROM role_permissions rp
      JOIN roles r ON r.id = rp.role_id
      JOIN permissions p ON p.id = rp.permission_id
      WHERE r.scope = 'org' AND r.name = v_org_role AND r.org_id IS NULL
        AND p.action = p_action
    ) INTO v_has;

    RETURN v_has;

  ELSIF v_scope IN ('team', 'project') AND p_team_id IS NOT NULL THEN
    -- Team 역할로 권한 체크
    SELECT team_role INTO v_team_role
    FROM members WHERE team_id = p_team_id AND user_id = p_user_id;

    IF v_team_role IS NULL THEN
      -- Org admin/owner는 팀 권한도 통과
      IF p_org_id IS NOT NULL THEN
        SELECT org_role INTO v_org_role
        FROM org_members WHERE org_id = p_org_id AND user_id = p_user_id;
        IF v_org_role IN ('owner', 'admin') THEN RETURN true; END IF;
      END IF;
      RETURN false;
    END IF;

    SELECT EXISTS (
      SELECT 1 FROM role_permissions rp
      JOIN roles r ON r.id = rp.role_id
      JOIN permissions p ON p.id = rp.permission_id
      WHERE r.scope = 'team' AND r.name = v_team_role AND r.org_id IS NULL
        AND p.action = p_action
    ) INTO v_has;

    RETURN v_has;
  END IF;

  RETURN false;
END;
$$;

-- 감사 로그 기록 함수
CREATE OR REPLACE FUNCTION log_audit(
  p_org_id uuid,
  p_action text,
  p_target_type text DEFAULT NULL,
  p_target_id uuid DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_log_id uuid;
BEGIN
  INSERT INTO audit_logs (org_id, user_id, action, target_type, target_id, metadata)
  VALUES (p_org_id, auth.uid(), p_action, p_target_type, p_target_id, p_metadata)
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;

-- 조직 생성 시 자동으로 owner 등록하는 함수
CREATE OR REPLACE FUNCTION handle_new_organization()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO org_members (org_id, user_id, org_role)
  VALUES (NEW.id, auth.uid(), 'owner');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_organization_created
  AFTER INSERT ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_organization();

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_teams_updated_at
  BEFORE UPDATE ON teams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_integrations_updated_at
  BEFORE UPDATE ON integrations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 13. 온보딩 트랜잭션 RPC (조직+팀+멤버+프로젝트 원자적 생성)
-- ============================================================

CREATE OR REPLACE FUNCTION create_organization_with_team(
  p_org_name text,
  p_org_slug text,
  p_team_name text,
  p_project_name text,
  p_user_name text,
  p_user_email text
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_org_id uuid;
  v_team_id uuid;
  v_project_id uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 1. 조직 생성
  INSERT INTO organizations (name, slug)
  VALUES (p_org_name, p_org_slug)
  RETURNING id INTO v_org_id;

  -- 2. org_member (owner) — 트리거와 중복 방지를 위해 ON CONFLICT
  INSERT INTO org_members (org_id, user_id, org_role)
  VALUES (v_org_id, v_user_id, 'owner')
  ON CONFLICT (org_id, user_id) DO NOTHING;

  -- 3. 팀 생성
  INSERT INTO teams (name, org_id)
  VALUES (p_team_name, v_org_id)
  RETURNING id INTO v_team_id;

  -- 4. 팀 멤버 (lead)
  INSERT INTO members (team_id, user_id, name, email, team_role)
  VALUES (v_team_id, v_user_id, p_user_name, p_user_email, 'lead');

  -- 5. 프로젝트 생성
  INSERT INTO projects (team_id, name)
  VALUES (v_team_id, p_project_name)
  RETURNING id INTO v_project_id;

  -- 6. 감사 로그
  INSERT INTO audit_logs (org_id, user_id, action, target_type, target_id, metadata)
  VALUES (v_org_id, v_user_id, 'org:created', 'organization', v_org_id,
    jsonb_build_object('team_id', v_team_id, 'project_id', v_project_id));

  RETURN jsonb_build_object(
    'org_id', v_org_id,
    'team_id', v_team_id,
    'project_id', v_project_id
  );
END;
$$;
