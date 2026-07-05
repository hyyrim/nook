-- notification_settings 재정비: v1.2에서 알림을 "미열람 리마인더" 단일 채널로 확정.
-- 결정 093 참조.
--
-- 변경 요약
-- - `send_at_hour`, `send_at_minute` 추가 — 유저가 30분 단위로 발송 시간 선택 (기본 20:00 KST)
-- - `quiet_hours_start`, `quiet_hours_end` 삭제 — 시간 지정 방식으로 대체돼 불필요
-- - `forgotten_enabled`, `rediscover_enabled` 삭제 — 단일 리마인더로 통합, 마스터 `enabled`만 사용
--
-- 안전성: 알림 기능은 아직 미배포(v1.1.x는 스토어 배포 전) — 저자 테스트 계정 외 실사용자 데이터 없음.
-- 컬럼 삭제로 인한 유저 데이터 손실 위험 없음. 결정 088/089와 동일 근거.

alter table notification_settings
  add column send_at_hour int not null default 20 check (send_at_hour between 0 and 23);

alter table notification_settings
  add column send_at_minute int not null default 0 check (send_at_minute in (0, 30));

alter table notification_settings drop column if exists quiet_hours_start;
alter table notification_settings drop column if exists quiet_hours_end;
alter table notification_settings drop column if exists forgotten_enabled;
alter table notification_settings drop column if exists rediscover_enabled;
