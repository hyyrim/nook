import Constants from 'expo-constants';
import { supabase } from './supabase';

// 측정 명세는 docs/analytics-plan.md 참조.
// 이벤트 정의 변경 시 EVENT_VERSION을 올린다.
const EVENT_VERSION = 1;
const APP_VERSION = Constants.expoConfig?.version ?? 'dev';
const SESSION_TIMEOUT_MS = 30 * 1000; // §12.2: background 30초 이상 → 새 세션

export type EntrySource = 'direct' | 'share_sheet';
export type ContentOpenedSource =
  | 'rediscover'
  | 'forgotten'
  | 'recent'
  | 'category'
  | 'search'
  | 'related'
  | 'direct';
export type FailureReason =
  | 'duplicate_url'
  | 'invalid_url'
  | 'network_error'
  | 'server_error'
  | 'unknown';

// --- 세션 상태 (앱 프로세스 단위 싱글톤) ---
let sessionId: string | null = null;
let backgroundAt: number | null = null;
const appOpenedSourcesBySession = new Set<EntrySource>();
// §12.4: rediscover_impression 세션당 사용자당 content_id 1회 dedup
const rediscoverImpressionSet = new Set<string>();

function randomId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function ensureSession(): string {
  if (!sessionId) {
    sessionId = randomId();
    appOpenedSourcesBySession.clear();
    rediscoverImpressionSet.clear();
  }
  return sessionId;
}

function trackAppOpened(entrySource: EntrySource): void {
  appOpenedSourcesBySession.add(entrySource);
  void track('app_opened', { properties: { entry_source: entrySource } });
}

/**
 * 앱이 foreground로 진입했을 때 호출. 첫 진입 또는 background 30초 이상 후 복귀면
 * 새 세션을 만들고 app_opened 이벤트를 발화한다.
 *
 * @returns 새 세션이 시작돼 app_opened가 발화됐는지 여부 (호출자에게 알려주는 용도)
 */
export function onAppActive(entrySource: EntrySource): boolean {
  const now = Date.now();
  const isFirstActive = sessionId === null;
  const isResumedAfterTimeout =
    backgroundAt !== null && now - backgroundAt > SESSION_TIMEOUT_MS;

  if (isFirstActive || isResumedAfterTimeout) {
    sessionId = randomId();
    appOpenedSourcesBySession.clear();
    rediscoverImpressionSet.clear();
    backgroundAt = null;
    trackAppOpened(entrySource);
    return true;
  }

  // Share Intent payload가 AppState active보다 늦게 도착하면 첫 app_opened가
  // direct로 기록될 수 있다. 같은 세션에서 share_sheet 진입은 한 번 보정 기록한다.
  if (entrySource === 'share_sheet' && !appOpenedSourcesBySession.has('share_sheet')) {
    backgroundAt = null;
    trackAppOpened('share_sheet');
    return true;
  }

  backgroundAt = null;
  return false;
}

/**
 * 앱이 background로 들어갈 때 호출. 30초 룰의 기준 시점을 기록한다.
 */
export function onAppBackground(): void {
  backgroundAt = Date.now();
}

type TrackOptions = {
  content_id?: string;
  properties?: Record<string, unknown>;
};

/**
 * 내부 트래커. 실패는 silent — 저장 UX를 절대 차단하지 않는다.
 * user_id, occurred_at, app_version, event_version, session_id를 자동 주입.
 */
async function track(eventName: string, options: TrackOptions = {}): Promise<void> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('analytics_events').insert({
      user_id: user.id,
      event_name: eventName,
      content_id: options.content_id ?? null,
      properties: {
        ...(options.properties ?? {}),
        session_id: ensureSession(),
      },
      occurred_at: new Date().toISOString(),
      app_version: APP_VERSION,
      event_version: EVENT_VERSION,
    });

    if (error) {
      console.warn('[analytics] insert failed:', error.message);
    }
  } catch (err) {
    console.warn('[analytics] track exception:', err);
  }
}

// --- Public API: 이벤트별 헬퍼 ---
export const analytics = {
  /** §12.1: 카테고리 생성 완료 직후 발화. */
  onboardingCompleted: () => track('onboarding_completed'),

  /** §12.2: 직접 호출하지 말고 onAppActive(entrySource)를 쓴다. */
  saveAttempted: (entry_source: EntrySource) =>
    track('save_attempted', { properties: { entry_source } }),

  saveFailed: (failure_reason: FailureReason, entry_source?: EntrySource) =>
    track('save_failed', {
      properties: {
        failure_reason,
        ...(entry_source ? { entry_source } : {}),
      },
    }),

  /** §12.4: 세션당 사용자당 같은 content_id는 1회만 발화 (클라이언트 dedup). */
  rediscoverImpression: (content_id: string) => {
    if (rediscoverImpressionSet.has(content_id)) return Promise.resolve();
    rediscoverImpressionSet.add(content_id);
    return track('rediscover_impression', { content_id });
  },

  /** §12.5: source는 type-safe union. 누락 폴백은 호출자에서 'direct' 명시. */
  contentOpened: (content_id: string, source: ContentOpenedSource) =>
    track('content_opened', { content_id, properties: { source } }),
};
