-- 014_pg_cron_cleanup_push_receipts.sql
--
-- pg_cron 스케줄 등록: 하루 1회 cleanup-push-receipts Edge Function 호출.
-- Expo가 receipt를 24시간 보관하므로 하루 1회로도 충분히 커버된다.
-- 이 파일은 이력 목적. Dashboard SQL Editor에서 <PROJECT_REF>, <CRON_SECRET>을
-- 실제 값으로 치환한 뒤 수동 실행한다.
--
-- 스케줄 선택 근거:
--   - '30 20 * * *' UTC = KST 05:30. 미열람 리마인더 발송 슬롯(09:00~22:00 KST)과 겹치지 않음.
--   - 발송 후 receipt가 준비되는 데 통상 수분~수십분 필요하므로 다음 날 새벽 실행이 안전.
--
-- 전제:
--   - Extensions: pg_cron, pg_net 활성화 (009에서 이미 활성화)
--   - Edge Function `cleanup-push-receipts` 배포됨 (verify_jwt=false)
--   - CRON_SECRET은 send-unread-reminder와 공유
--
-- 관련: 결정 101 (48차 — Expo Push Receipt 정리 + dead token 회수)

select cron.schedule(
  'cleanup-push-receipts',
  '30 20 * * *',
  $$
  select net.http_post(
    url := 'https://<PROJECT_REF>.supabase.co/functions/v1/cleanup-push-receipts',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer <CRON_SECRET>'
    ),
    body := '{}'::jsonb
  ) as request_id;
  $$
);

-- 검증
-- select jobid, schedule, jobname, active from cron.job where jobname = 'cleanup-push-receipts';
--
-- 최근 실행 로그
-- select jobid, status, return_message, start_time
-- from cron.job_run_details
-- where jobid = (select jobid from cron.job where jobname = 'cleanup-push-receipts')
-- order by start_time desc limit 5;
--
-- 재등록 (스케줄 변경 시)
-- select cron.unschedule('cleanup-push-receipts');
