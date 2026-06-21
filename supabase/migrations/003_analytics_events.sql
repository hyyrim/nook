-- Analytics events table
-- See docs/analytics-plan.md for the measurement spec.
create table analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_name text not null,
  content_id uuid references contents(id) on delete set null,
  properties jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null,
  app_version text not null,
  event_version int not null default 1,
  created_at timestamptz not null default now()
);

-- Indexes
create index analytics_events_user_event_time_idx
  on analytics_events (user_id, event_name, occurred_at desc);
create index analytics_events_content_id_idx
  on analytics_events (content_id) where content_id is not null;

-- RLS 활성화
alter table analytics_events enable row level security;

-- Analytics events RLS policies (insert / select own only)
create policy "Users can insert own analytics events"
  on analytics_events for insert
  with check (auth.uid() = user_id);

create policy "Users can view own analytics events"
  on analytics_events for select
  using (auth.uid() = user_id);
