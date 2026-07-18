-- 011_delete_user_account_full_cleanup.sql
--
-- `delete_user_account` RPC를 신규 테이블(device_tokens, notification_settings,
-- notification_logs, analytics_events)과 Storage 오브젝트까지 명시적으로
-- 정리하도록 확장한다.
--
-- 기존 002 함수는 `contents`, `categories`, `auth.users`만 명시 삭제했고
-- 나머지는 FK ON DELETE CASCADE에 의존했다. CASCADE가 대부분 커버하지만
-- 명시적 순서 정리로 defense-in-depth 확보 + 향후 non-CASCADE 테이블 추가 대비.
--
-- 관련: 보안 감사 결정 (M3) — Nook 계정 삭제의 완전성.

create or replace function delete_user_account()
returns void
language plpgsql
security definer
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'not_authenticated';
  end if;

  -- 알림/분석 계열 (자식 → 부모 순)
  delete from notification_logs where user_id = uid;
  delete from analytics_events where user_id = uid;
  delete from device_tokens where user_id = uid;
  delete from notification_settings where user_id = uid;

  -- 콘텐츠 / 카테고리
  delete from contents where user_id = uid;
  delete from categories where user_id = uid;

  -- Storage 썸네일 오브젝트 (버킷: thumbnails, 폴더 규칙: <uid>/*)
  delete from storage.objects
   where bucket_id = 'thumbnails'
     and (storage.foldername(name))[1] = uid::text;

  -- 마지막으로 auth.users
  delete from auth.users where id = uid;
end;
$$;
