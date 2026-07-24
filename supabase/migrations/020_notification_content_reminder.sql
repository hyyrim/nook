-- notification_settings에 콘텐츠 리마인더 채널 on/off 컬럼 추가.
-- 콘텐츠 상세의 벨로 예약하는 로컬 리마인더(expo-notifications DATE trigger)를
-- 이 토글로 게이팅한다. 마스터(enabled)와 별개 채널로, 결정 094의 채널 분리 원칙을 따른다.
-- 기존 행은 default true로 채워져 현재 동작(리마인더 예약 가능)이 유지된다.

alter table notification_settings
  add column if not exists content_reminder_enabled boolean not null default true;
