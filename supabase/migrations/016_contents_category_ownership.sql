-- 016_contents_category_ownership.sql
--
-- contents.category_id는 categories(id)를 참조하는 FK만 걸려 있어
-- categories.user_id != contents.user_id 조합을 DB 레벨에서 막지 못한다.
-- RLS는 애플리케이션에서 유저 스코프만 강제하므로 Supabase REST API를 직접
-- 호출하는 클라이언트가 다른 유저의 category_id를 삽입하면 방어선이 없다.
--
-- BEFORE INSERT/UPDATE trigger로 관계 무결성을 강제한다.
--
-- category_id가 null인 경우(미분류)는 통과.
-- 존재하지 않는 category_id는 FK on delete set null 흐름과 정합성을 위해 null로 정정.
-- category owner가 다르면 예외 발생 → 클라이언트는 정상 UX 상 발생하지 않음.
--
-- 관련: 결정 105 (52차 — 보안 리뷰 P1/P2 hotfix)

create or replace function enforce_content_category_ownership()
returns trigger as $$
declare
  cat_owner uuid;
begin
  if new.category_id is null then
    return new;
  end if;
  select user_id into cat_owner from categories where id = new.category_id;
  if cat_owner is null then
    new.category_id := null;
    return new;
  end if;
  if cat_owner <> new.user_id then
    raise exception 'category_ownership_mismatch' using errcode = '23514';
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists contents_category_ownership on contents;
create trigger contents_category_ownership
  before insert or update of category_id, user_id on contents
  for each row execute function enforce_content_category_ownership();
