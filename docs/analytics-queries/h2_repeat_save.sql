-- H2. 7일 내 두 번째 저장률
--
-- 분모: 첫 저장 후 7일 관찰 기간이 모두 지난 사용자
-- 분자: 그 중 첫 저장 후 7일 이내 두 번째 콘텐츠를 추가 저장한 사용자
--
-- 첫/두번째 저장의 진실은 contents 테이블의 saved_at 순서 (이벤트가 아님).

with test_users as (
  select id from auth.users where false  -- TODO: 테스트 계정 UUID
),
saves as (
  select
    user_id,
    saved_at,
    row_number() over (partition by user_id order by saved_at) as save_rank
  from contents
  where user_id not in (select id from test_users)
),
first_save as (
  select user_id, saved_at as first_saved_at
  from saves
  where save_rank = 1
    and saved_at + interval '7 days' <= now()  -- 관찰 기간 7일 모두 경과
),
second_save as (
  select user_id, saved_at as second_saved_at
  from saves
  where save_rank = 2
),
joined as (
  select
    f.user_id,
    f.first_saved_at,
    s.second_saved_at,
    case
      when s.second_saved_at is not null
        and s.second_saved_at - f.first_saved_at <= interval '7 days'
        then 1
      else 0
    end as repeated
  from first_save f
  left join second_save s on s.user_id = f.user_id
)
select
  count(*) as eligible_users,
  sum(repeated) as repeated_users,
  round(100.0 * sum(repeated) / nullif(count(*), 0), 1) as repeat_rate_pct
from joined;
