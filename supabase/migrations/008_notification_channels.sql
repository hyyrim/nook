-- notification_settings에 채널별 on/off 컬럼 도입.
-- 결정 094 참조 — 마스터(`enabled`)와 채널별(`unread_reminder_enabled`)을 분리해 향후 채널 추가에 대비.

alter table notification_settings
  add column if not exists unread_reminder_enabled boolean not null default true;
