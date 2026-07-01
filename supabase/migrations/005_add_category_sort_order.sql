-- Add sort_order column to categories for manual reordering
-- sort_order: nullable integer. NULL = 미정 (created_at 순으로 fallback).
--   기본 유저는 backfill 후 값이 있고, 신규 카테고리는 max(sort_order) + 1 로 할당.

alter table categories add column if not exists sort_order integer;

-- Backfill: 기존 행에 created_at 순서로 sort_order 부여 (user별)
with ranked as (
  select
    id,
    row_number() over (partition by user_id order by created_at) as rn
  from categories
  where sort_order is null
)
update categories c
set sort_order = ranked.rn
from ranked
where c.id = ranked.id;

-- Index for faster ordered fetch
create index if not exists categories_user_sort_idx
  on categories(user_id, sort_order);
