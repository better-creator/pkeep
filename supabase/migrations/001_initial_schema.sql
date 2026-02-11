-- PKEEP Database Schema
-- Initial migration

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- =====================
-- PKEEP Layer (프로젝트 맥락)
-- =====================

-- 팀/워크스페이스
create table teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

-- 팀원
create table members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references teams(id) on delete cascade,
  user_id uuid references auth.users(id),
  name text not null,
  email text,
  role text,
  area text check (area in ('planning', 'design', 'dev')),
  created_at timestamptz default now()
);

-- 프로젝트
create table projects (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references teams(id) on delete cascade,
  name text not null,
  description text,
  status text default 'active' check (status in ('active', 'archived')),
  created_at timestamptz default now()
);

-- 화면
create table screens (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  code text not null,
  name text not null,
  description text,
  parent_id uuid references screens(id),
  figma_url text,
  created_at timestamptz default now(),
  unique(project_id, code)
);

-- 기능
create table features (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  code text not null,
  name text not null,
  description text,
  screen_id uuid references screens(id),
  created_at timestamptz default now(),
  unique(project_id, code)
);

-- 결정
create table decisions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  code text not null,
  title text not null,
  content text,
  reason text,
  status text default 'confirmed' check (status in ('confirmed', 'changed', 'pending')),
  area text check (area in ('planning', 'design', 'dev')),
  created_at timestamptz default now(),
  changed_at timestamptz,
  changed_from uuid references decisions(id),
  unique(project_id, code)
);

-- 미팅
create table meetings (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  code text not null,
  title text not null,
  date date not null,
  attendees uuid[],
  content text,
  ai_summary jsonb,
  created_at timestamptz default now(),
  unique(project_id, code)
);

-- 결정 출처 연결
create table decision_sources (
  id uuid primary key default gen_random_uuid(),
  decision_id uuid references decisions(id) on delete cascade,
  source_type text not null check (source_type in ('meeting', 'slack', 'figma_comment', 'github_pr', 'manual')),
  source_id uuid,
  source_url text,
  created_at timestamptz default now()
);

-- 결정-화면/기능 연결
create table decision_links (
  id uuid primary key default gen_random_uuid(),
  decision_id uuid references decisions(id) on delete cascade,
  link_type text not null check (link_type in ('screen', 'feature')),
  link_id uuid not null,
  created_at timestamptz default now()
);

-- 외부 연동 기록
create table external_links (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  entity_type text not null,
  entity_id uuid not null,
  platform text not null check (platform in ('figma', 'github', 'slack', 'notion')),
  external_id text,
  external_url text,
  synced_at timestamptz default now()
);

-- Github 이벤트
create table github_events (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  event_type text not null check (event_type in ('pr', 'commit', 'issue')),
  title text,
  url text,
  linked_code text,
  raw_data jsonb,
  created_at timestamptz default now()
);

-- 어피니티 그룹
create table affinity_groups (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  name text not null,
  color text,
  position_x int,
  position_y int,
  created_at timestamptz default now()
);

-- 어피니티 아이템
create table affinity_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  group_id uuid references affinity_groups(id) on delete set null,
  content text not null,
  source_type text check (source_type in ('decision', 'meeting', 'slack', 'manual')),
  source_id uuid,
  position_x int,
  position_y int,
  created_at timestamptz default now()
);

-- =====================
-- OTB Layer (판단 근거 엔진)
-- =====================

-- 도메인 가이드
create table domains (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  rules jsonb,
  created_at timestamptz default now()
);

-- 크롤링 소스
create table crawl_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  url text not null,
  source_type text check (source_type in ('reference', 'trend', 'news')),
  credibility text check (credibility in ('A', 'B', 'C')),
  active boolean default true,
  last_crawled_at timestamptz,
  created_at timestamptz default now()
);

-- 레퍼런스
create table "references" (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references crawl_sources(id),
  url text not null,
  title text,
  thumbnail_url text,
  domain text,
  tags text[],
  crawled_at timestamptz default now()
);

-- 레퍼런스 분석
create table reference_analysis (
  id uuid primary key default gen_random_uuid(),
  reference_id uuid references "references"(id) on delete cascade,
  axis_data jsonb,
  style_tags text[],
  color_palette text[],
  analyzed_at timestamptz default now()
);

-- 트렌드
create table trends (
  id uuid primary key default gen_random_uuid(),
  domain text,
  keyword text not null,
  trend_type text check (trend_type in ('rising', 'stable', 'declining')),
  score numeric,
  period text,
  source_count int,
  detected_at timestamptz default now()
);

-- AI 피드백 로그
create table ai_feedbacks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  entity_type text,
  entity_id uuid,
  feedback_type text check (feedback_type in ('trend_check', 'reference_suggest', 'conflict_alert', 'missing_alert')),
  content text,
  "references" uuid[],
  trends uuid[],
  created_at timestamptz default now()
);

-- AI 질의 로그
create table ai_queries (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  query text not null,
  context jsonb,
  response text,
  sources_used uuid[],
  created_at timestamptz default now()
);

-- =====================
-- Indexes
-- =====================

create index idx_members_team_id on members(team_id);
create index idx_projects_team_id on projects(team_id);
create index idx_screens_project_id on screens(project_id);
create index idx_features_project_id on features(project_id);
create index idx_decisions_project_id on decisions(project_id);
create index idx_meetings_project_id on meetings(project_id);
create index idx_decision_sources_decision_id on decision_sources(decision_id);
create index idx_decision_links_decision_id on decision_links(decision_id);
create index idx_external_links_project_id on external_links(project_id);
create index idx_github_events_project_id on github_events(project_id);
create index idx_affinity_groups_project_id on affinity_groups(project_id);
create index idx_affinity_items_project_id on affinity_items(project_id);
create index idx_affinity_items_group_id on affinity_items(group_id);

-- =====================
-- Row Level Security
-- =====================

alter table teams enable row level security;
alter table members enable row level security;
alter table projects enable row level security;
alter table screens enable row level security;
alter table features enable row level security;
alter table decisions enable row level security;
alter table meetings enable row level security;
alter table decision_sources enable row level security;
alter table decision_links enable row level security;
alter table external_links enable row level security;
alter table github_events enable row level security;
alter table affinity_groups enable row level security;
alter table affinity_items enable row level security;

-- 간단한 RLS 정책 (팀 멤버인 경우에만 접근 허용)
-- 실제 운영시에는 더 세밀한 정책 필요

create policy "Team members can access teams"
  on teams for all
  using (
    id in (
      select team_id from members where user_id = auth.uid()
    )
  );

create policy "Team members can access members"
  on members for all
  using (
    team_id in (
      select team_id from members where user_id = auth.uid()
    )
  );

create policy "Team members can access projects"
  on projects for all
  using (
    team_id in (
      select team_id from members where user_id = auth.uid()
    )
  );

create policy "Team members can access screens"
  on screens for all
  using (
    project_id in (
      select id from projects where team_id in (
        select team_id from members where user_id = auth.uid()
      )
    )
  );

create policy "Team members can access features"
  on features for all
  using (
    project_id in (
      select id from projects where team_id in (
        select team_id from members where user_id = auth.uid()
      )
    )
  );

create policy "Team members can access decisions"
  on decisions for all
  using (
    project_id in (
      select id from projects where team_id in (
        select team_id from members where user_id = auth.uid()
      )
    )
  );

create policy "Team members can access meetings"
  on meetings for all
  using (
    project_id in (
      select id from projects where team_id in (
        select team_id from members where user_id = auth.uid()
      )
    )
  );

create policy "Team members can access decision_sources"
  on decision_sources for all
  using (
    decision_id in (
      select id from decisions where project_id in (
        select id from projects where team_id in (
          select team_id from members where user_id = auth.uid()
        )
      )
    )
  );

create policy "Team members can access decision_links"
  on decision_links for all
  using (
    decision_id in (
      select id from decisions where project_id in (
        select id from projects where team_id in (
          select team_id from members where user_id = auth.uid()
        )
      )
    )
  );

create policy "Team members can access external_links"
  on external_links for all
  using (
    project_id in (
      select id from projects where team_id in (
        select team_id from members where user_id = auth.uid()
      )
    )
  );

create policy "Team members can access github_events"
  on github_events for all
  using (
    project_id in (
      select id from projects where team_id in (
        select team_id from members where user_id = auth.uid()
      )
    )
  );

create policy "Team members can access affinity_groups"
  on affinity_groups for all
  using (
    project_id in (
      select id from projects where team_id in (
        select team_id from members where user_id = auth.uid()
      )
    )
  );

create policy "Team members can access affinity_items"
  on affinity_items for all
  using (
    project_id in (
      select id from projects where team_id in (
        select team_id from members where user_id = auth.uid()
      )
    )
  );

-- =====================
-- Helper Functions
-- =====================

-- 다음 코드 생성 함수
create or replace function generate_next_code(
  p_project_id uuid,
  p_prefix text
)
returns text
language plpgsql
as $$
declare
  v_max_num int;
  v_next_num int;
begin
  -- 해당 프로젝트에서 같은 prefix를 가진 최대 번호 찾기
  execute format(
    'select coalesce(max(cast(substring(code from %L) as int)), 0)
     from %I
     where project_id = $1 and code like $2',
    p_prefix || '-([0-9]+)',
    case p_prefix
      when 'SCR' then 'screens'
      when 'FT' then 'features'
      when 'DEC' then 'decisions'
      when 'MTG' then 'meetings'
    end
  ) into v_max_num using p_project_id, p_prefix || '-%';

  v_next_num := v_max_num + 1;

  return p_prefix || '-' || lpad(v_next_num::text, 3, '0');
end;
$$;
