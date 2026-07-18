-- 015_thumbnail_storage_policy_tighten.sql
--
-- 010에서 authenticated 유저에게 열어둔 insert/update/delete 정책을 제거하고
-- select 정책을 own-folder 조건으로 좁힌다.
--
-- 배경: 실제 썸네일 업로드는 backup-thumbnail Edge Function이 service role로만 수행한다.
-- 010의 authenticated 유저용 insert/update/delete 정책은 사용되지 않으면서 오히려
-- 임의 유저가 자기 폴더에 임의 파일을 넣거나 지울 수 있는 표면을 열어 두는 부작용만 남는다.
-- select도 bucket 전체 listing이 가능한 상태였으므로 own-folder 조건을 추가한다.
--
-- Public read(파일 URL 직접 접근)는 Storage의 public bucket 규칙이 RLS를 우회하므로
-- 이 정책 변경으로 클라이언트의 이미지 로딩(getPublicUrl 경로)에는 영향이 없다.
--
-- 관련: 결정 105 (52차 — 보안 리뷰 P1/P2 hotfix)

drop policy if exists "Users can upload own thumbnails" on storage.objects;
drop policy if exists "Users can update own thumbnails" on storage.objects;
drop policy if exists "Users can delete own thumbnails" on storage.objects;

drop policy if exists "Users can view thumbnails" on storage.objects;
create policy "Users can view own thumbnails"
  on storage.objects for select
  using (
    bucket_id = 'thumbnails'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
