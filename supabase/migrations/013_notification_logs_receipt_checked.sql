-- 013_notification_logs_receipt_checked.sql
--
-- Expo Push Receipt 정리 함수(cleanup-push-receipts)가 재조회를 방지하기 위해
-- notification_logs에 receipt_checked_at 컬럼을 추가한다.
--
-- 관련: 결정 101 (48차 — Expo Push Receipt 정리 + dead token 회수)

alter table notification_logs
  add column if not exists receipt_checked_at timestamptz;

-- receipt 미확인 로그 스캔용 partial index.
-- sent_at desc는 24시간 윈도우 범위 조회에 유리.
create index if not exists notification_logs_receipt_pending_idx
  on notification_logs(sent_at desc)
  where expo_ticket_id is not null and receipt_checked_at is null;

-- 012 트리거 갱신 — receipt_checked_at도 유저가 수정하지 못하도록 잠근다.
-- 단, service role(auth.uid() 없음)은 트리거를 우회해 자유롭게 갱신 가능해야 하므로
-- cleanup-push-receipts가 expo_receipt_status/receipt_checked_at을 정상 반영한다.
create or replace function enforce_notification_log_update_columns()
returns trigger as $$
begin
  -- service role은 auth.uid()가 null. 이 경우 컬럼 잠금을 우회한다.
  if auth.uid() is null then
    return new;
  end if;

  new.user_id             := old.user_id;
  new.type                := old.type;
  new.content_ids         := old.content_ids;
  new.title               := old.title;
  new.body                := old.body;
  new.sent_at             := old.sent_at;
  new.expo_ticket_id      := old.expo_ticket_id;
  new.expo_receipt_status := old.expo_receipt_status;
  new.receipt_checked_at  := old.receipt_checked_at;
  return new;
end;
$$ language plpgsql;
