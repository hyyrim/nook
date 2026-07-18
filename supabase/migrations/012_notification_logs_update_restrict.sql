-- 012_notification_logs_update_restrict.sql
--
-- 006 마이그레이션의 UPDATE RLS는 `auth.uid() = user_id` 조건만 걸어
-- 유저가 notification_logs의 모든 컬럼을 수정할 수 있는 상태다. 의도는 `opened_at`
-- 만 유저가 갱신하는 것이므로 트리거로 다른 컬럼 변경을 되돌린다.
-- (RLS는 컬럼 단위 제한을 지원하지 않음)
--
-- 관련: 보안 감사 결정 (M4) — least privilege 원칙.

create or replace function enforce_notification_log_update_columns()
returns trigger as $$
begin
  -- 유저가 갱신 가능한 컬럼은 opened_at만 허용.
  -- service role은 이 트리거를 통과하지만 어차피 INSERT/UPDATE 자유이므로 문제 없음.
  new.user_id            := old.user_id;
  new.type               := old.type;
  new.content_ids        := old.content_ids;
  new.title              := old.title;
  new.body               := old.body;
  new.sent_at            := old.sent_at;
  new.expo_ticket_id     := old.expo_ticket_id;
  new.expo_receipt_status := old.expo_receipt_status;
  return new;
end;
$$ language plpgsql;

drop trigger if exists notification_logs_restrict_update on notification_logs;
create trigger notification_logs_restrict_update
  before update on notification_logs
  for each row execute function enforce_notification_log_update_columns();
