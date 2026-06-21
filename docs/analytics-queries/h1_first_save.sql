-- H1. 24시간 이내 첫 저장 전환율
--
-- 분모: 측정 기간 내 onboarding_completed 발화된 사용자
-- 분자: 그 중 onboarding 후 24시간 이내 contents 첫 row 생성된 사용자
--
-- :start_date, :end_date — 측정 기간 (KST 기준으로 입력, 내부적으로 UTC 변환)
-- test_users CTE — 베타 시작 전 정리된 테스트 계정 UUID 목록

with test_users as (
  select id from auth.users where false  -- TODO: 베타 시작 전 테스트 계정 UUID 채우기
),
onboarded as (
  select
    user_id,
    min(occurred_at) as onboarded_at
  from analytics_events
  where event_name = 'onboarding_completed'
    and occurred_at >= timezone('UTC', :start_date::timestamp at time zone 'Asia/Seoul')
    and occurred_at <  timezone('UTC', :end_date::timestamp at time zone 'Asia/Seoul')
    and user_id not in (select id from test_users)
  group by user_id
),
first_save as (
  select
    c.user_id,
    min(c.saved_at) as first_saved_at
  from contents c
  where c.user_id not in (select id from test_users)
  group by c.user_id
),
joined as (
  select
    o.user_id,
    o.onboarded_at,
    f.first_saved_at,
    case
      when f.first_saved_at is not null
        and f.first_saved_at - o.onboarded_at <= interval '24 hours'
        then 1
      else 0
    end as converted
  from onboarded o
  left join first_save f on f.user_id = o.user_id
)
select
  count(*) as onboarded_users,
  sum(converted) as converted_users,
  round(100.0 * sum(converted) / nullif(count(*), 0), 1) as conversion_rate_pct
from joined;
