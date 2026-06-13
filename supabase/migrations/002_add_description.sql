-- contents 테이블에 description 컬럼 추가
ALTER TABLE contents ADD COLUMN IF NOT EXISTS description text;
