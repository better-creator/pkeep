-- Audio pipeline & enhanced analysis migration
-- Adds support for audio transcription, speaker diarization, and auto-created decisions

-- Enable pgvector for embedding storage
create extension if not exists vector;

-- Add audio/transcript columns to meetings
alter table meetings add column if not exists audio_url text;
alter table meetings add column if not exists transcript jsonb;
-- transcript format: { segments: [{ speaker: "A", text: "...", start: 0, end: 3.2 }] }

alter table meetings add column if not exists speaker_map jsonb;
-- speaker_map format: { "Speaker A": "member-uuid", "Speaker B": "member-uuid" }

alter table meetings add column if not exists duration_seconds int;

-- Add auto_created flag to decisions (to distinguish AI-generated from manual)
alter table decisions add column if not exists auto_created boolean default false;
alter table decisions add column if not exists source_meeting_id uuid references meetings(id);

-- Add embedding column to decisions for vector similarity search
alter table decisions add column if not exists embedding vector(1536);

-- Create index for vector similarity search
create index if not exists idx_decisions_embedding on decisions
  using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- Add rejected_alternatives table
create table if not exists rejected_alternatives (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  decision_id uuid references decisions(id) on delete set null,
  meeting_id uuid references meetings(id) on delete set null,
  title text not null,
  description text,
  rejection_reason text,
  proposed_by text,
  keywords text[],
  auto_created boolean default false,
  created_at timestamptz default now()
);

create index if not exists idx_rejected_alternatives_project_id on rejected_alternatives(project_id);
create index if not exists idx_rejected_alternatives_decision_id on rejected_alternatives(decision_id);

-- Add tasks table (action items from meetings)
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  decision_id uuid references decisions(id) on delete set null,
  meeting_id uuid references meetings(id) on delete set null,
  title text not null,
  assignee_id uuid references members(id),
  assignee_name text,
  status text default 'pending' check (status in ('pending', 'in_progress', 'done')),
  auto_created boolean default false,
  created_at timestamptz default now()
);

create index if not exists idx_tasks_project_id on tasks(project_id);
create index if not exists idx_tasks_decision_id on tasks(decision_id);
create index if not exists idx_tasks_meeting_id on tasks(meeting_id);

-- RLS for new tables
alter table rejected_alternatives enable row level security;
alter table tasks enable row level security;

create policy "Team members can access rejected_alternatives"
  on rejected_alternatives for all
  using (
    project_id in (
      select id from projects where team_id in (
        select team_id from members where user_id = auth.uid()
      )
    )
  );

create policy "Team members can access tasks"
  on tasks for all
  using (
    project_id in (
      select id from projects where team_id in (
        select team_id from members where user_id = auth.uid()
      )
    )
  );
