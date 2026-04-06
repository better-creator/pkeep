-- ============================================================
-- 003_dual_kb.sql — Dual Knowledge Base (Vector + Graph)
-- 특허 청구항 3: 관계형 맥락 저장부 (Dual KB)
-- ============================================================

-- 0. pgvector 확장 확인
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================
-- GRAPH KB — 엔티티 간 관계 엣지
-- ============================================================

-- 결정 ↔ 결정 관계 (의사결정 계보)
CREATE TABLE IF NOT EXISTS decision_edges (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  source_id   uuid NOT NULL REFERENCES decisions(id) ON DELETE CASCADE,
  target_id   uuid NOT NULL REFERENCES decisions(id) ON DELETE CASCADE,
  edge_type   text NOT NULL CHECK (edge_type IN (
    'changed_from',   -- source가 target을 대체 (버전 계보)
    'extends',        -- source가 target을 확장
    'conflicts',      -- source와 target이 충돌
    'depends',        -- source가 target에 의존
    'related'         -- 일반 관련
  )),
  confidence  numeric DEFAULT 1.0,
  reason      text,                    -- 왜 이 관계인지 (LLM or manual)
  meeting_id  uuid REFERENCES meetings(id), -- 어느 회의에서 발생했는지
  created_at  timestamptz DEFAULT now(),
  UNIQUE(source_id, target_id, edge_type)
);

CREATE INDEX IF NOT EXISTS idx_decision_edges_source ON decision_edges(source_id);
CREATE INDEX IF NOT EXISTS idx_decision_edges_target ON decision_edges(target_id);
CREATE INDEX IF NOT EXISTS idx_decision_edges_project ON decision_edges(project_id);

-- 결정 ↔ 기타 엔티티 관계 (맥락 연결)
CREATE TABLE IF NOT EXISTS context_edges (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  decision_id   uuid NOT NULL REFERENCES decisions(id) ON DELETE CASCADE,
  entity_type   text NOT NULL CHECK (entity_type IN (
    'rejected_alternative',
    'task',
    'meeting',
    'screen',
    'feature',
    'keyword',
    'external_link'
  )),
  entity_id     uuid NOT NULL,
  relation_type text NOT NULL CHECK (relation_type IN (
    'created_from',    -- 이 회의에서 생성됨
    'discussed_in',    -- 이 회의에서 논의됨
    'rejected_for',    -- 이 대안을 기각하고 선택됨
    'produces',        -- 이 태스크를 생성함
    'affects',         -- 이 화면에 영향
    'tagged_with',     -- 이 키워드로 태깅
    'linked_to'        -- 외부 링크 연결
  )),
  metadata      jsonb DEFAULT '{}',    -- 추가 정보 (timestamp, speaker 등)
  created_at    timestamptz DEFAULT now(),
  UNIQUE(decision_id, entity_type, entity_id, relation_type)
);

CREATE INDEX IF NOT EXISTS idx_context_edges_decision ON context_edges(decision_id);
CREATE INDEX IF NOT EXISTS idx_context_edges_entity ON context_edges(entity_type, entity_id);

-- 충돌 이력 (해결 포함)
CREATE TABLE IF NOT EXISTS conflict_records (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id        uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  new_decision_id   uuid NOT NULL REFERENCES decisions(id) ON DELETE CASCADE,
  existing_decision_id uuid NOT NULL REFERENCES decisions(id) ON DELETE CASCADE,
  conflict_type     text NOT NULL CHECK (conflict_type IN ('semantic', 'logical', 'temporal', 'area_overlap')),
  severity          text NOT NULL CHECK (severity IN ('high', 'medium', 'low')),
  similarity_score  numeric,
  reason            text,              -- LLM이 판단한 충돌 이유
  resolved          boolean DEFAULT false,
  resolution        text CHECK (resolution IN ('reject_new', 'hold', 'suspend_existing', 'merge', 'ignore')),
  resolved_at       timestamptz,
  resolved_by       uuid REFERENCES members(id),
  detected_at       timestamptz DEFAULT now(),
  UNIQUE(new_decision_id, existing_decision_id, conflict_type)
);

CREATE INDEX IF NOT EXISTS idx_conflict_records_project ON conflict_records(project_id);

-- ============================================================
-- VECTOR KB — 청크 단위 임베딩
-- ============================================================

-- 결정 청크 (결정 내용을 의미 단위로 분할)
CREATE TABLE IF NOT EXISTS decision_chunks (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_id   uuid NOT NULL REFERENCES decisions(id) ON DELETE CASCADE,
  chunk_index   int NOT NULL,
  chunk_text    text NOT NULL,
  chunk_type    text DEFAULT 'content' CHECK (chunk_type IN ('title', 'content', 'rationale', 'full')),
  embedding     vector(1536),
  token_count   int,
  created_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_decision_chunks_decision ON decision_chunks(decision_id);
CREATE INDEX IF NOT EXISTS idx_decision_chunks_embedding
  ON decision_chunks USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- 회의 청크 (회의록을 구간별로 분할)
CREATE TABLE IF NOT EXISTS meeting_chunks (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id      uuid NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  chunk_index     int NOT NULL,
  chunk_text      text NOT NULL,
  embedding       vector(1536),
  speaker         text,
  start_seconds   int,
  end_seconds     int,
  token_count     int,
  created_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_meeting_chunks_meeting ON meeting_chunks(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_chunks_embedding
  ON meeting_chunks USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- ============================================================
-- RPC 함수 — 시맨틱 검색
-- ============================================================

-- 결정 시맨틱 검색 (RAG용)
CREATE OR REPLACE FUNCTION match_decision_chunks(
  query_embedding  vector(1536),
  match_count      int DEFAULT 10,
  project_filter   uuid DEFAULT NULL,
  similarity_threshold float DEFAULT 0.7
)
RETURNS TABLE (
  chunk_id      uuid,
  decision_id   uuid,
  decision_code text,
  decision_title text,
  decision_status text,
  chunk_text    text,
  chunk_type    text,
  similarity    float
)
LANGUAGE sql STABLE AS $$
  SELECT
    dc.id AS chunk_id,
    d.id AS decision_id,
    d.code AS decision_code,
    d.title AS decision_title,
    d.status AS decision_status,
    dc.chunk_text,
    dc.chunk_type,
    1 - (dc.embedding <=> query_embedding) AS similarity
  FROM decision_chunks dc
  JOIN decisions d ON d.id = dc.decision_id
  WHERE
    dc.embedding IS NOT NULL
    AND (project_filter IS NULL OR d.project_id = project_filter)
    AND 1 - (dc.embedding <=> query_embedding) >= similarity_threshold
  ORDER BY dc.embedding <=> query_embedding ASC
  LIMIT match_count;
$$;

-- 회의 시맨틱 검색 (RAG용)
CREATE OR REPLACE FUNCTION match_meeting_chunks(
  query_embedding  vector(1536),
  match_count      int DEFAULT 10,
  project_filter   uuid DEFAULT NULL,
  similarity_threshold float DEFAULT 0.7
)
RETURNS TABLE (
  chunk_id      uuid,
  meeting_id    uuid,
  meeting_code  text,
  meeting_title text,
  chunk_text    text,
  speaker       text,
  similarity    float
)
LANGUAGE sql STABLE AS $$
  SELECT
    mc.id AS chunk_id,
    m.id AS meeting_id,
    m.code AS meeting_code,
    m.title AS meeting_title,
    mc.chunk_text,
    mc.speaker,
    1 - (mc.embedding <=> query_embedding) AS similarity
  FROM meeting_chunks mc
  JOIN meetings m ON m.id = mc.meeting_id
  WHERE
    mc.embedding IS NOT NULL
    AND (project_filter IS NULL OR m.project_id = project_filter)
    AND 1 - (mc.embedding <=> query_embedding) >= similarity_threshold
  ORDER BY mc.embedding <=> query_embedding ASC
  LIMIT match_count;
$$;

-- 결정 계보 조회 (그래프 순회 — 2홉까지)
CREATE OR REPLACE FUNCTION get_decision_lineage(
  target_decision_id uuid,
  max_depth int DEFAULT 3
)
RETURNS TABLE (
  decision_id   uuid,
  code          text,
  title         text,
  status        text,
  edge_type     text,
  depth         int,
  path          uuid[]
)
LANGUAGE sql STABLE AS $$
  WITH RECURSIVE lineage AS (
    -- Base: 시작 결정
    SELECT
      d.id AS decision_id,
      d.code, d.title, d.status,
      'root'::text AS edge_type,
      0 AS depth,
      ARRAY[d.id] AS path
    FROM decisions d
    WHERE d.id = target_decision_id

    UNION ALL

    -- Recursive: 연결된 결정들
    SELECT
      d.id AS decision_id,
      d.code, d.title, d.status,
      de.edge_type,
      l.depth + 1 AS depth,
      l.path || d.id AS path
    FROM lineage l
    JOIN decision_edges de ON de.target_id = l.decision_id
    JOIN decisions d ON d.id = de.source_id
    WHERE
      l.depth < max_depth
      AND NOT (d.id = ANY(l.path))  -- 순환 방지
  )
  SELECT * FROM lineage ORDER BY depth, code;
$$;

-- 결정 영향 범위 조회 (순방향)
CREATE OR REPLACE FUNCTION get_decision_impact(
  source_decision_id uuid,
  max_depth int DEFAULT 3
)
RETURNS TABLE (
  decision_id   uuid,
  code          text,
  title         text,
  status        text,
  edge_type     text,
  depth         int,
  path          uuid[]
)
LANGUAGE sql STABLE AS $$
  WITH RECURSIVE impact AS (
    SELECT
      d.id AS decision_id,
      d.code, d.title, d.status,
      'root'::text AS edge_type,
      0 AS depth,
      ARRAY[d.id] AS path
    FROM decisions d
    WHERE d.id = source_decision_id

    UNION ALL

    SELECT
      d.id AS decision_id,
      d.code, d.title, d.status,
      de.edge_type,
      i.depth + 1 AS depth,
      i.path || d.id AS path
    FROM impact i
    JOIN decision_edges de ON de.source_id = i.decision_id
    JOIN decisions d ON d.id = de.target_id
    WHERE
      i.depth < max_depth
      AND NOT (d.id = ANY(i.path))
  )
  SELECT * FROM impact ORDER BY depth, code;
$$;
