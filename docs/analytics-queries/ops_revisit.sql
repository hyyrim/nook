-- 운영 지표 — 자연 재방문율
-- 첫 저장 다음 날부터 7일 이내 다시 앱 또는 Share Extension을 사용한 사용자 ÷ 첫 저장 사용자
--
-- '다시 사용'의 정의: 첫 저장 + 1일 이후 ~ 첫 저장 + 7일 사이에 app_opened 이벤트가 1건 이상 발생.

with test_users as (
  select id from auth.users where false  -- TODO: 테스트 계정 UUID
),
first_save as (
  select user_id, min(saved_at) as first_saved_at
  from contents
  where user_id not in (select id from test_users)
  group by user_id
  having min(saved_at) + interval '7 days' <= now()  -- 관찰 기간 모두 경과
),
revisits as (
  select distinct e.user_id
  from analytics_events e
  join first_save f on f.user_id = e.user_id
  where e.event_name = 'app_opened'
    and e.occurred_at >= f.first_saved_at + interval '1 day'
    and e.occurred_at <= f.first_saved_at + interval '7 days'
)
select
  (select count(*) from first_save) as first_savers,
  (select count(*) from revisits)   as revisited_users,
  round(
    100.0 * (select count(*) from revisits) / nullif((select count(*) from first_save), 0),
    1
  ) as revisit_rate_pct;
