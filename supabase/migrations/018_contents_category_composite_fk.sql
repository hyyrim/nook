-- 018_contents_category_composite_fk.sql
--
-- 016의 trigger는 invoker RLS 스코프로 categories를 조회하므로,
-- "다른 유저의 실존 category"와 "완전히 없는 category"를 구분하지 못하고
-- 둘 다 category_id를 null로 정정한다. 보안적으로 cross-user 할당은 여전히 차단되지만
-- 관계 무결성 semantic이 흐리고 raise exception 경로가 사실상 죽어있다.
--
-- 이번 마이그레이션에서 composite FK로 승격해 DB 레벨 관계 무결성으로 강제한다.
--   (contents.user_id, contents.category_id) → (categories.user_id, categories.id)
-- 이제 trigger 없이도 cross-user는 FK violation으로 즉시 rejected된다.
-- MATCH SIMPLE 기본 동작으로 category_id가 NULL이면 검증 skip (미분류 유지).
-- ON DELETE SET NULL (category_id) — Postgres 15+ 문법. 카테고리 삭제 시 contents.user_id는
-- 그대로 두고 category_id만 NULL로 정정.
--
-- 참고: Supabase 프로덕션은 Postgres 15+ 사용. 로컬/샌드박스에서 문법 오류 나면 PG 버전 확인.
--
-- 재실행 안정성: pg_constraint 존재 확인 후 add 하는 do $$ 블록으로 idempotent 처리
-- (Dashboard SQL Editor에서 부분 실패 시 재시도 여지 확보). drop constraint if exists도 유지.
--
-- 데이터 안정성: FK 강제 이전에 기존 오염 row(category owner 불일치)를 미리 null로 정리해
-- FK 추가 시점의 violation 실패를 방지한다. 실유저 없어도 테스트 데이터 잔재를 방어.
--
-- 관련: 결정 106 (52차 재리뷰 — P3 semantic 결함 정석 fix)

-- 0. Pre-clean: cross-user 또는 orphan category_id를 null로 정리.
-- Composite FK가 매칭을 강제하기 시작하면 이런 row 하나라도 남아 있으면 FK 추가가 실패한다.
update public.contents c
set category_id = null
where category_id is not null
  and not exists (
    select 1
    from public.categories cat
    where cat.id = c.category_id
      and cat.user_id = c.user_id
  );

-- 1. categories에 (user_id, id) unique constraint 추가 (FK 참조 대상)
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'categories_user_id_id_key'
      and conrelid = 'public.categories'::regclass
  ) then
    alter table public.categories
      add constraint categories_user_id_id_key unique (user_id, id);
  end if;
end $$;

-- 2. 기존 단일 FK 제거
alter table public.contents
  drop constraint if exists contents_category_id_fkey;

-- 3. composite FK 추가 (재실행 안전)
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'contents_category_owner_fkey'
      and conrelid = 'public.contents'::regclass
  ) then
    alter table public.contents
      add constraint contents_category_owner_fkey
        foreign key (user_id, category_id)
        references public.categories (user_id, id)
        on delete set null (category_id);
  end if;
end $$;

-- 4. 016 trigger는 이제 FK가 강제하므로 중복. 제거.
drop trigger if exists contents_category_ownership on public.contents;
drop function if exists enforce_content_category_ownership();
