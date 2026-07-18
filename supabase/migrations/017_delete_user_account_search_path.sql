-- 017_delete_user_account_search_path.sql
--
-- 011의 delete_user_account()는 SECURITY DEFINER인데 search_path가 고정되어 있지 않다.
-- 호출자의 search_path에 따라 동일 이름의 다른 스키마 객체가 참조될 위험이 있다
-- (예: 악의적 유저가 세션 search_path에 자기 스키마를 앞에 두면 함수가
-- 잘못된 테이블을 참조할 수 있음).
--
-- 함수 정의에 `set search_path = public, storage, auth, pg_temp`를 고정하고
-- 모든 테이블을 schema-qualified로 명시해 방어한다.
--
-- 관련: 결정 105 (52차 — 보안 리뷰 P1/P2 hotfix)

create or replace function delete_user_account()
returns void
language plpgsql
security definer
set search_path = public, storage, auth, pg_temp
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'not_authenticated';
  end if;

  delete from public.notification_logs where user_id = uid;
  delete from public.analytics_events where user_id = uid;
  delete from public.device_tokens where user_id = uid;
  delete from public.notification_settings where user_id = uid;

  delete from public.contents where user_id = uid;
  delete from public.categories where user_id = uid;

  delete from storage.objects
   where bucket_id = 'thumbnails'
     and (storage.foldername(name))[1] = uid::text;

  delete from auth.users where id = uid;
end;
$$;
