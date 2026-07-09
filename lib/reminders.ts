import * as Notifications from 'expo-notifications';
import { getNotificationSettings } from './api';

// 콘텐츠 단위 리마인더. 로컬 알림(`expo-notifications` DATE trigger)만 사용하며 별도 저장소는 두지 않는다.
// 진실의 원천은 `Notifications.getAllScheduledNotificationsAsync()`가 반환하는 pending 큐 —
// data에 `{ type: 'reminder', content_id }`를 심어 콘텐츠와 매칭한다.

export type ReminderPreset = 'hour' | 'tomorrow' | 'weekend';

export type ReminderRecord = {
  contentId: string;
  remindAt: Date;
  notificationId: string;
};

const WEEKDAY_SHORT = ['일', '월', '화', '수', '목', '금', '토'] as const;
const DEFAULT_TIME = { hour: 20, minute: 0 } as const;

let cachedUserTime: { hour: number; minute: number } | null = null;

// 프로필의 미열람 발송 시간을 리마인더 기본 시간으로 재사용.
export async function getUserPreferredTime(): Promise<{ hour: number; minute: number }> {
  if (cachedUserTime) return cachedUserTime;
  try {
    const settings = await getNotificationSettings();
    if (settings) {
      cachedUserTime = { hour: settings.send_at_hour, minute: settings.send_at_minute };
      return cachedUserTime;
    }
  } catch {
    // 실패 시 default fallback
  }
  cachedUserTime = { ...DEFAULT_TIME };
  return cachedUserTime;
}

export function invalidateUserTimeCache() {
  cachedUserTime = null;
}

// ─── 시간 계산 ─────────────────────────────────────────

export function computePresetTime(
  preset: ReminderPreset,
  userTime: { hour: number; minute: number },
  now: Date = new Date(),
): Date {
  if (preset === 'hour') {
    const d = new Date(now.getTime() + 60 * 60 * 1000);
    return d;
  }
  if (preset === 'tomorrow') {
    const d = new Date(now);
    d.setDate(d.getDate() + 1);
    d.setHours(userTime.hour, userTime.minute, 0, 0);
    return d;
  }
  return computeWeekendTime(now, userTime);
}

function computeWeekendTime(now: Date, userTime: { hour: number; minute: number }): Date {
  const day = now.getDay();
  const todayAtUserTime = new Date(now);
  todayAtUserTime.setHours(userTime.hour, userTime.minute, 0, 0);

  // 월~금 → 이번 주 토요일
  if (day >= 1 && day <= 5) {
    const daysUntilSat = 6 - day;
    const d = new Date(now);
    d.setDate(d.getDate() + daysUntilSat);
    d.setHours(userTime.hour, userTime.minute, 0, 0);
    return d;
  }
  // 토요일: 유저 시간 전이면 오늘, 후면 내일(일요일)
  if (day === 6) {
    if (now.getTime() < todayAtUserTime.getTime()) return todayAtUserTime;
    const sunday = new Date(now);
    sunday.setDate(sunday.getDate() + 1);
    sunday.setHours(userTime.hour, userTime.minute, 0, 0);
    return sunday;
  }
  // 일요일: 유저 시간 전이면 오늘, 후면 다음 주 토요일
  if (now.getTime() < todayAtUserTime.getTime()) return todayAtUserTime;
  const nextSat = new Date(now);
  nextSat.setDate(nextSat.getDate() + 6);
  nextSat.setHours(userTime.hour, userTime.minute, 0, 0);
  return nextSat;
}

// ─── 라벨 ─────────────────────────────────────────

function pad(n: number) {
  return n.toString().padStart(2, '0');
}

function formatHHMM(date: Date): string {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function daysBetween(a: Date, b: Date): number {
  const aDay = new Date(a);
  aDay.setHours(0, 0, 0, 0);
  const bDay = new Date(b);
  bDay.setHours(0, 0, 0, 0);
  return Math.round((bDay.getTime() - aDay.getTime()) / (24 * 60 * 60 * 1000));
}

function dayLabel(now: Date, target: Date): string {
  if (isSameDay(now, target)) return '오늘';
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (isSameDay(tomorrow, target)) return '내일';
  const diff = daysBetween(now, target);
  const weekday = WEEKDAY_SHORT[target.getDay()];
  if (diff > 7) return `다음 ${weekday}`;
  return weekday;
}

export function labelForPreset(
  preset: ReminderPreset,
  date: Date,
  now: Date = new Date(),
): string {
  const time = formatHHMM(date);
  if (preset === 'hour') return `1시간 뒤 (${time})`;
  if (preset === 'tomorrow') {
    const weekday = WEEKDAY_SHORT[date.getDay()];
    return `내일 (${weekday}, ${time})`;
  }
  const day = dayLabel(now, date);
  return `주말 (${day}, ${time})`;
}

/**
 * "예약됨: 내일 20:00" 톤의 상태 문구.
 */
export function formatReminderStatus(remindAt: Date, now: Date = new Date()): string {
  return `${dayLabel(now, remindAt)} ${formatHHMM(remindAt)}`;
}

// ─── OS pending 큐 조회/조작 ─────────────────────────────────────────

type ReminderData = {
  type?: string;
  content_id?: string;
  remind_at_ms?: number;
};

function extractReminderDate(
  data: ReminderData,
  trigger: Notifications.NotificationTrigger | null,
): Date | null {
  // 1차: 우리가 예약할 때 data.remind_at_ms에 timestamp를 넣어두므로 이걸 신뢰.
  //     iOS/Android 및 SDK 버전에 따라 trigger 리턴 구조가 크게 달라 파싱이 불안정하다.
  if (typeof data.remind_at_ms === 'number' && data.remind_at_ms > 0) {
    return new Date(data.remind_at_ms);
  }
  // 2차 (fallback): trigger에서 최대한 뽑아봄.
  if (!trigger) return null;
  const anyTrigger = trigger as unknown as {
    type?: string;
    value?: number;
    date?: number | string;
    dateComponents?: {
      year?: number;
      month?: number;
      day?: number;
      hour?: number;
      minute?: number;
      second?: number;
    };
  };
  if (typeof anyTrigger.value === 'number') return new Date(anyTrigger.value);
  if (typeof anyTrigger.date === 'number') return new Date(anyTrigger.date);
  if (typeof anyTrigger.date === 'string') return new Date(anyTrigger.date);
  if (anyTrigger.dateComponents) {
    const c = anyTrigger.dateComponents;
    const now = new Date();
    return new Date(
      c.year ?? now.getFullYear(),
      (c.month ?? now.getMonth() + 1) - 1,
      c.day ?? now.getDate(),
      c.hour ?? 0,
      c.minute ?? 0,
      c.second ?? 0,
    );
  }
  return null;
}

export async function getReminder(contentId: string): Promise<ReminderRecord | null> {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const notification of scheduled) {
      const data = (notification.content.data ?? {}) as ReminderData;
      if (data.type !== 'reminder' || data.content_id !== contentId) continue;
      const remindAt = extractReminderDate(data, notification.trigger);
      if (!remindAt) continue;
      // 이미 지난 알림이면 없다고 간주 (iOS가 delivered 후에도 잠깐 남아있을 수 있음)
      if (remindAt.getTime() <= Date.now()) continue;
      return {
        contentId,
        remindAt,
        notificationId: notification.identifier,
      };
    }
    return null;
  } catch (e) {
    console.warn('[reminder] getReminder failed', e);
    return null;
  }
}

export async function scheduleReminder(input: {
  contentId: string;
  contentTitle: string;
  remindAt: Date;
}): Promise<ReminderRecord> {
  // 기존 예약 있으면 취소.
  await cancelReminder(input.contentId);

  const notificationId = await Notifications.scheduleNotificationAsync({
    content: {
      title: '다시 보기로 한 링크가 있어요',
      body: input.contentTitle || '저장한 링크를 다시 확인해보세요',
      // remind_at_ms를 함께 저장해 trigger 파싱 실패에도 시각을 복원할 수 있게 함.
      data: {
        type: 'reminder',
        content_id: input.contentId,
        remind_at_ms: input.remindAt.getTime(),
      },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: input.remindAt,
    },
  });

  return {
    contentId: input.contentId,
    remindAt: input.remindAt,
    notificationId,
  };
}

export async function cancelReminder(contentId: string): Promise<void> {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    for (const notification of scheduled) {
      const data = (notification.content.data ?? {}) as ReminderData;
      if (data.type === 'reminder' && data.content_id === contentId) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      }
    }
  } catch (e) {
    console.warn('[reminder] cancelReminder failed', e);
  }
}

/**
 * 모든 예정 리마인더를 시간 오름차순으로 반환.
 * 이미 지난 알림(만료됐지만 OS 큐에 잔존)은 제외.
 */
export async function getAllReminders(): Promise<ReminderRecord[]> {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const nowMs = Date.now();
    const list: ReminderRecord[] = [];
    for (const notification of scheduled) {
      const data = (notification.content.data ?? {}) as ReminderData;
      if (data.type !== 'reminder' || !data.content_id) continue;
      const remindAt = extractReminderDate(data, notification.trigger);
      if (!remindAt || remindAt.getTime() <= nowMs) continue;
      list.push({
        contentId: data.content_id,
        remindAt,
        notificationId: notification.identifier,
      });
    }
    list.sort((a, b) => a.remindAt.getTime() - b.remindAt.getTime());
    return list;
  } catch (e) {
    console.warn('[reminder] getAllReminders failed', e);
    return [];
  }
}
