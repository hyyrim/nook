-- 운영 지표 — 중복 저장 시도율
-- failure_reason='duplicate_url'인 save_failed 건수 ÷ save_attempted 건수

with test_users as (
  select id from auth.users where false  -- TODO: 테스트 계정 UUID
),
attempted as (
  select count(*) as cnt
  from analytics_events
  where event_name = 'save_attempted'
    and occurred_at >= timezone('UTC', :start_date::timestamp at time zone 'Asia/Seoul')
    and occurred_at <  timezone('UTC', :end_date::timestamp at time zone 'Asia/Seoul')
    and user_id not in (select id from test_users)
),
duplicate as (
  select count(*) as cnt
  from analytics_events
  where event_name = 'save_failed'
    and properties ->> 'failure_reason' = 'duplicate_url'
    and occurred_at >= timezone('UTC', :start_date::timestamp at time zone 'Asia/Seoul')
    and occurred_at <  timezone('UTC', :end_date::timestamp at time zone 'Asia/Seoul')
    and user_id not in (select id from test_users)
)
select
  (select cnt from attempted) as save_attempted,
  (select cnt from duplicate) as duplicate_attempts,
  round(100.0 * (select cnt from duplicate) / nullif((select cnt from attempted), 0), 1)
    as duplicate_rate_pct;
