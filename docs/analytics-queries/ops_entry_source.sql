-- 운영 지표 — 진입 경로 비율 (direct vs share_sheet)
-- 사용자 단위로 측정: 한 사용자가 둘 다 사용했으면 each에 카운트, 비율은 사용자 수 기준.

with test_users as (
  select id from auth.users where false  -- TODO: 테스트 계정 UUID
),
period_opens as (
  select user_id, properties ->> 'entry_source' as entry_source
  from analytics_events
  where event_name = 'app_opened'
    and occurred_at >= timezone('UTC', :start_date::timestamp at time zone 'Asia/Seoul')
    and occurred_at <  timezone('UTC', :end_date::timestamp at time zone 'Asia/Seoul')
    and user_id not in (select id from test_users)
),
by_source as (
  select
    entry_source,
    count(distinct user_id) as users,
    count(*)                as events
  from period_opens
  group by entry_source
)
select
  entry_source,
  users,
  events,
  round(100.0 * users / nullif((select count(distinct user_id) from period_opens), 0), 1)
    as user_share_pct
from by_source
order by users desc;
