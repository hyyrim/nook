-- 009_pg_cron_send_unread_reminder.sql
--
-- pg_cron 스케줄 등록: 30분마다 send-unread-reminder Edge Function 호출.
-- 이 파일은 이력 목적. Dashboard SQL Editor에서 <PROJECT_REF>, <CRON_SECRET>을
-- 실제 값으로 치환한 뒤 수동 실행한다.
--
-- 전제:
--   - Extensions: pg_cron, pg_net 활성화
--   - Edge Function `send-unread-reminder` 배포됨 (verify_jwt=false)
--   - Edge Function Secrets에 CRON_SECRET 등록 (이 파일 값과 동일)
--   - SUPABASE_SERVICE_ROLE_KEY / SUPABASE_URL은 Edge Function 런타임에 자동 주입
--
-- 관련: 결정 095 (42차 — 미열람 리마인더 Edge Function + pg_cron)

select cron.schedule(
  'send-unread-reminder',
  '0,30 * * * *',
  $$
  select net.http_post(
    url := 'https://<PROJECT_REF>.supabase.co/functions/v1/send-unread-reminder',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer <CRON_SECRET>'
    ),
    body := '{}'::jsonb
  ) as request_id;
  $$
);

-- 검증
-- select jobid, schedule, jobname, active from cron.job where jobname = 'send-unread-reminder';
--
-- 최근 실행 로그
-- select jobid, status, return_message, start_time
-- from cron.job_run_details
-- where jobid = (select jobid from cron.job where jobname = 'send-unread-reminder')
-- order by start_time desc limit 5;
--
-- 재등록 (스케줄 변경 시)
-- select cron.unschedule('send-unread-reminder');
