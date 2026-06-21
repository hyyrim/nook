-- H3. Rediscover 클릭률 (핵심) + 노출 대비 열람 수 (보조)
--
-- 핵심: Rediscover에서 콘텐츠를 1회 이상 연 사용자 수 ÷ Rediscover를 1회 이상 본 사용자 수
-- 보조: source='rediscover'인 content_opened 이벤트 수 ÷ rediscover_impression 이벤트 수

with test_users as (
  select id from auth.users where false  -- TODO: 테스트 계정 UUID
),
period_events as (
  select *
  from analytics_events
  where occurred_at >= timezone('UTC', :start_date::timestamp at time zone 'Asia/Seoul')
    and occurred_at <  timezone('UTC', :end_date::timestamp at time zone 'Asia/Seoul')
    and user_id not in (select id from test_users)
),
impression_users as (
  select distinct user_id
  from period_events
  where event_name = 'rediscover_impression'
),
opened_users as (
  select distinct user_id
  from period_events
  where event_name = 'content_opened'
    and properties ->> 'source' = 'rediscover'
),
impression_count as (
  select count(*) as cnt from period_events where event_name = 'rediscover_impression'
),
opened_count as (
  select count(*) as cnt
  from period_events
  where event_name = 'content_opened' and properties ->> 'source' = 'rediscover'
)
select
  (select count(*) from impression_users) as impression_users,
  (select count(*) from opened_users)     as opened_users,
  round(
    100.0 * (select count(*) from opened_users) / nullif((select count(*) from impression_users), 0),
    1
  ) as click_rate_pct,
  (select cnt from impression_count) as rediscover_impression_events,
  (select cnt from opened_count)     as rediscover_opened_events,
  round(
    100.0 * (select cnt from opened_count) / nullif((select cnt from impression_count), 0),
    1
  ) as opened_per_impression_pct;
