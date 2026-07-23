-- 019_delete_user_account_no_storage_sql.sql
--
-- Supabase가 storage.objects에 대한 직접 SQL DELETE를 최근 정책으로 금지했다
-- ("Direct deletion from storage tables is not allowed. Use the Storage API instead").
-- 011/017의 delete_user_account()가 이 정책에 걸려 실패한다.
--
-- 해결: RPC에서 storage.objects DELETE 라인을 제거하고, 클라이언트에서
-- Supabase Storage API(supabase.storage.from('thumbnails').remove([...]))로
-- 먼저 정리한 뒤 RPC를 호출한다. 원자성은 잃지만 UX 관점에서 DB 삭제만
-- 성공하면 유저에겐 "계정 삭제됨"으로 보이고, Storage 파일은 소유자가 없는
-- orphan 상태로만 남는다(정기 백그라운드 청소 대상).

create or replace function delete_user_account()
returns void
language plpgsql
security definer
set search_path = public, auth, pg_temp
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

  -- storage.objects는 클라이언트에서 Storage API로 먼저 정리한다.
  -- 여기서는 auth.users만 삭제. RLS + FK CASCADE가 나머지 커버.

  delete from auth.users where id = uid;
end;
$$;
