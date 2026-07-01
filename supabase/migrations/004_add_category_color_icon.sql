-- Add color/icon columns to categories
-- color: nullable. Preset key ('sand', 'peach', 'pink', 'lavender', 'blue', 'mint', 'red', 'gray', 'slate'). NULL = 무색 (#FFFFFF)
-- icon:  nullable. Ionicons name (예: 'sparkles-outline'). NULL = 기본 폴더 아이콘

alter table categories add column if not exists color text;
alter table categories add column if not exists icon text;

-- Backfill: 온보딩 기본 12개 카테고리 이름과 정확히 일치하는 기존 행에 default icon 설정
-- 컬러는 backfill 하지 않음 (사용자 선택에 맡김)
update categories set icon = 'sparkles-outline'       where name = 'AI'       and icon is null;
update categories set icon = 'hardware-chip-outline'  where name = '테크'      and icon is null;
update categories set icon = 'trending-up-outline'    where name = '경제'      and icon is null;
update categories set icon = 'briefcase-outline'      where name = '비즈니스'   and icon is null;
update categories set icon = 'rocket-outline'         where name = '커리어'    and icon is null;
update categories set icon = 'color-palette-outline'  where name = '디자인'    and icon is null;
update categories set icon = 'home-outline'           where name = '인테리어'  and icon is null;
update categories set icon = 'airplane-outline'       where name = '여행'      and icon is null;
update categories set icon = 'restaurant-outline'     where name = '음식'      and icon is null;
update categories set icon = 'musical-notes-outline'  where name = '음악'      and icon is null;
update categories set icon = 'film-outline'           where name = '영화'      and icon is null;
update categories set icon = 'barbell-outline'        where name = '운동'      and icon is null;
