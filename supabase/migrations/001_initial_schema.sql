-- Categories table
create table categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Contents table
create table contents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid references categories(id) on delete set null,
  url text not null,
  title text,
  thumbnail_url text,
  domain text,
  tags text[] default '{}',
  saved_at timestamptz not null default now(),
  viewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Unique constraint: 사용자별 중복 URL 방지
alter table contents add constraint contents_user_url_unique unique (user_id, url);

-- Indexes
create index categories_user_id_idx on categories(user_id);
create index contents_user_id_idx on contents(user_id);
create index contents_category_id_idx on contents(category_id);
create index contents_saved_at_idx on contents(user_id, saved_at desc);

-- RLS 활성화
alter table categories enable row level security;
alter table contents enable row level security;

-- Categories RLS policies
create policy "Users can view own categories"
  on categories for select
  using (auth.uid() = user_id);

create policy "Users can insert own categories"
  on categories for insert
  with check (auth.uid() = user_id);

create policy "Users can update own categories"
  on categories for update
  using (auth.uid() = user_id);

create policy "Users can delete own categories"
  on categories for delete
  using (auth.uid() = user_id);

-- Contents RLS policies
create policy "Users can view own contents"
  on contents for select
  using (auth.uid() = user_id);

create policy "Users can insert own contents"
  on contents for insert
  with check (auth.uid() = user_id);

create policy "Users can update own contents"
  on contents for update
  using (auth.uid() = user_id);

create policy "Users can delete own contents"
  on contents for delete
  using (auth.uid() = user_id);

-- updated_at 자동 갱신 트리거
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger categories_updated_at
  before update on categories
  for each row execute function update_updated_at();

create trigger contents_updated_at
  before update on contents
  for each row execute function update_updated_at();
