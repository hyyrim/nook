-- 운영 지표 — 저장 성공률 + 저장 미상 손실률 (§12.3)
--
-- 저장 성공률 = 신규 contents row 수 ÷ save_attempted 건수
-- 저장 미상 손실률 = (save_attempted − save_failed − 신규 contents row 수) ÷ save_attempted
-- 두 합이 100%가 안 나오면 갭 발생 — 크래시/네트워크 끊김 의심.

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
failed as (
  select count(*) as cnt
  from analytics_events
  where event_name = 'save_failed'
    and occurred_at >= timezone('UTC', :start_date::timestamp at time zone 'Asia/Seoul')
    and occurred_at <  timezone('UTC', :end_date::timestamp at time zone 'Asia/Seoul')
    and user_id not in (select id from test_users)
),
saved as (
  select count(*) as cnt
  from contents
  where saved_at >= timezone('UTC', :start_date::timestamp at time zone 'Asia/Seoul')
    and saved_at <  timezone('UTC', :end_date::timestamp at time zone 'Asia/Seoul')
    and user_id not in (select id from test_users)
)
select
  (select cnt from attempted) as save_attempted,
  (select cnt from failed)    as save_failed,
  (select cnt from saved)     as save_succeeded,
  round(100.0 * (select cnt from saved) / nullif((select cnt from attempted), 0), 1)
    as success_rate_pct,
  round(100.0 * (select cnt from failed) / nullif((select cnt from attempted), 0), 1)
    as failure_rate_pct,
  round(
    100.0 * (
      (select cnt from attempted) - (select cnt from failed) - (select cnt from saved)
    ) / nullif((select cnt from attempted), 0),
    1
  ) as unaccounted_loss_pct;
