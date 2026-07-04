-- Push notifications: device tokens, per-user settings, and send logs.
-- See docs/decisions.md for the design rationale (푸시 알림 1차: Forgotten + Rediscover, 09:00 KST 고정).

-- update_updated_at 함수는 001에서 이미 생성되었지만, 실행 환경에 따라 없을 수 있어 방어적으로 재선언.
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- 1. device_tokens: 유저 기기별 Expo Push Token
create table device_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  expo_push_token text not null,
  platform text not null,
  device_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, expo_push_token)
);

create index device_tokens_user_id_idx on device_tokens(user_id);

alter table device_tokens enable row level security;

create policy "Users can view own device tokens"
  on device_tokens for select
  using (auth.uid() = user_id);

create policy "Users can insert own device tokens"
  on device_tokens for insert
  with check (auth.uid() = user_id);

create policy "Users can update own device tokens"
  on device_tokens for update
  using (auth.uid() = user_id);

create policy "Users can delete own device tokens"
  on device_tokens for delete
  using (auth.uid() = user_id);

create trigger device_tokens_updated_at
  before update on device_tokens
  for each row execute function update_updated_at();

-- 2. notification_settings: 유저별 알림 설정. user_id가 PK.
-- quiet_hours: 0~23 정수. 시작 == 끝 이면 조용한 시간 없음.
create table notification_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  enabled boolean not null default true,
  forgotten_enabled boolean not null default true,
  rediscover_enabled boolean not null default true,
  quiet_hours_start int not null default 22 check (quiet_hours_start between 0 and 23),
  quiet_hours_end int not null default 8 check (quiet_hours_end between 0 and 23),
  timezone text not null default 'Asia/Seoul',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table notification_settings enable row level security;

create policy "Users can view own notification settings"
  on notification_settings for select
  using (auth.uid() = user_id);

create policy "Users can insert own notification settings"
  on notification_settings for insert
  with check (auth.uid() = user_id);

create policy "Users can update own notification settings"
  on notification_settings for update
  using (auth.uid() = user_id);

create trigger notification_settings_updated_at
  before update on notification_settings
  for each row execute function update_updated_at();

-- 3. notification_logs: 발송 이력. 중복 방지 + 열람 분석.
-- type: 'forgotten' | 'rediscover' | (향후 'weekly_summary')
-- content_ids: 알림에 포함된 콘텐츠 참조. contents 삭제 시 배열에서 자동 제거되지는 않음 (감사용).
create table notification_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  content_ids uuid[] not null default '{}',
  title text not null,
  body text not null,
  sent_at timestamptz not null default now(),
  opened_at timestamptz,
  expo_ticket_id text,
  expo_receipt_status text
);

create index notification_logs_user_sent_idx
  on notification_logs(user_id, sent_at desc);
create index notification_logs_user_type_sent_idx
  on notification_logs(user_id, type, sent_at desc);

alter table notification_logs enable row level security;

-- 유저는 본인 로그 조회/열람 시각 업데이트만 가능. insert는 Edge Function(service role)이 담당.
create policy "Users can view own notification logs"
  on notification_logs for select
  using (auth.uid() = user_id);

create policy "Users can update own notification logs opened_at"
  on notification_logs for update
  using (auth.uid() = user_id);
