-- 010_thumbnail_storage.sql
--
-- Instagram scontent 등 외부 CDN URL 서명 만료로 시간이 지나면 썸네일이 placeholder로
-- 대체되는 문제를 해결하기 위해 Supabase Storage에 압축된 썸네일 복사본을 두고
-- `contents.thumbnail_url`이 Storage public URL을 가리키게 한다.
--
-- 정책 요약
-- - `thumbnails` 버킷: public read (썸네일에 secret 없음, CDN 캐시 활용)
-- - 파일 경로 규칙: `<user_id>/<content_id>.jpg` (또는 .webp)
-- - 클라이언트 직접 업로드는 허용하지 않음 (Edge Function service role만 사용)
--   그래도 방어적으로 RLS에 유저 폴더 제약을 걸어 둔다
-- - Cache-Control은 업로드 시 옵션(`cacheControl: '31536000, immutable'`)으로 설정
--
-- 관련: 결정 102 (49차 — 썸네일 영구화)

-- 1. 버킷 생성 (public read)
insert into storage.buckets (id, name, public)
values ('thumbnails', 'thumbnails', true)
on conflict (id) do nothing;

-- 2. RLS 정책 — 유저 폴더 제약 (방어적)
--    Edge Function이 service role로 업로드하므로 실제로는 RLS를 우회하지만,
--    혹시 anon/authenticated 키로 접근하는 코드가 생기면 RLS가 마지막 방어선.

drop policy if exists "Users can view thumbnails" on storage.objects;
create policy "Users can view thumbnails"
  on storage.objects for select
  using (bucket_id = 'thumbnails');

drop policy if exists "Users can upload own thumbnails" on storage.objects;
create policy "Users can upload own thumbnails"
  on storage.objects for insert
  with check (
    bucket_id = 'thumbnails'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users can update own thumbnails" on storage.objects;
create policy "Users can update own thumbnails"
  on storage.objects for update
  using (
    bucket_id = 'thumbnails'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users can delete own thumbnails" on storage.objects;
create policy "Users can delete own thumbnails"
  on storage.objects for delete
  using (
    bucket_id = 'thumbnails'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
