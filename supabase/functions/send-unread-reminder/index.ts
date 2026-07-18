// Supabase Edge Function: send-unread-reminder
// pg_cron이 매 30분(0/30)마다 호출. 현재 KST 시각과 notification_settings.send_at_hour/minute가 매칭되는
// 유저 중 최근 7일 내 발송 이력이 없고 미열람 후보 콘텐츠가 3개 이상인 유저에게 Expo Push API로 발송한다.
//
// 배포:
//   supabase functions deploy send-unread-reminder --no-verify-jwt
// Secret 설정:
//   supabase secrets set CRON_SECRET=<random-hex>
//   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<service-role-jwt>
//
// pg_cron 스케줄 (Supabase Dashboard SQL Editor):
//   select cron.schedule(
//     'send-unread-reminder',
//     '0,30 * * * *',
//     $$
//     select net.http_post(
//       url := 'https://<project-ref>.supabase.co/functions/v1/send-unread-reminder',
//       headers := jsonb_build_object(
//         'Content-Type', 'application/json',
//         'Authorization', 'Bearer <CRON_SECRET>'
//       ),
//       body := '{}'::jsonb
//     ) as request_id;
//     $$
//   );

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const EXPO_BATCH_SIZE = 100;

// KST 기준 후보 조건.
const UNVIEWED_MIN_DAYS_AGO = 7;
const UNVIEWED_MAX_DAYS_AGO = 14;
const MIN_CANDIDATE_COUNT = 3;
const COOLDOWN_DAYS = 7;

type NotificationSettingsRow = {
  user_id: string;
  enabled: boolean;
  unread_reminder_enabled: boolean;
  send_at_hour: number;
  send_at_minute: number;
};

type DeviceTokenRow = {
  user_id: string;
  expo_push_token: string;
};

type ContentCandidate = {
  id: string;
  title: string | null;
  saved_at: string;
};

type ExpoTicket = {
  status: 'ok' | 'error';
  id?: string;
  message?: string;
  details?: { error?: string };
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// 문자열 상수 시간 비교 — CRON_SECRET 타이밍 부채널 방어.
// 길이 불일치도 상수 시간 유지를 위해 mask로 처리.
function timingSafeEqual(a: string, b: string): boolean {
  const len = Math.max(a.length, b.length);
  let diff = a.length ^ b.length;
  for (let i = 0; i < len; i++) {
    const ac = i < a.length ? a.charCodeAt(i) : 0;
    const bc = i < b.length ? b.charCodeAt(i) : 0;
    diff |= ac ^ bc;
  }
  return diff === 0;
}

// UTC now → KST hour + minute (30분 grid로 floor).
function currentKstSlot(): { hour: number; minute: number } {
  const now = new Date();
  const kstMs = now.getTime() + 9 * 60 * 60 * 1000;
  const kst = new Date(kstMs);
  const hour = kst.getUTCHours();
  // 30분 그리드 floor: 0~29 → 0, 30~59 → 30.
  const minute = kst.getUTCMinutes() < 30 ? 0 : 30;
  return { hour, minute };
}

function buildTitle(count: number): string {
  return `저장하고 안 본 링크 ${count}개가 있어요`;
}

function buildBody(items: ContentCandidate[]): string {
  const first = items[0]?.title?.trim();
  if (first && first.length > 0) {
    return `"${first.slice(0, 40)}${first.length > 40 ? '…' : ''}" 외에도 다시 볼만한 링크가 쌓였어요.`;
  }
  return '1주일 넘게 아직 안 열어본 링크가 쌓였어요. 다시 볼까요?';
}

async function fetchCandidates(
  supabase: ReturnType<typeof createClient>,
  userId: string,
): Promise<ContentCandidate[]> {
  const now = Date.now();
  const minSince = new Date(now - UNVIEWED_MAX_DAYS_AGO * 24 * 60 * 60 * 1000).toISOString();
  const maxSince = new Date(now - UNVIEWED_MIN_DAYS_AGO * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('contents')
    .select('id, title, saved_at')
    .eq('user_id', userId)
    .is('viewed_at', null)
    .gte('saved_at', minSince)
    .lt('saved_at', maxSince)
    .order('saved_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('[send-unread-reminder] candidates fetch error', userId, error);
    return [];
  }
  return (data ?? []) as ContentCandidate[];
}

async function hasRecentLog(
  supabase: ReturnType<typeof createClient>,
  userId: string,
): Promise<boolean> {
  const since = new Date(Date.now() - COOLDOWN_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const { count, error } = await supabase
    .from('notification_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('type', 'unread_reminder')
    .gte('sent_at', since);
  if (error) {
    console.error('[send-unread-reminder] recent log check failed', userId, error);
    return true; // 실패 시 안전 편향 — 발송 skip.
  }
  return (count ?? 0) > 0;
}

async function fetchTokens(
  supabase: ReturnType<typeof createClient>,
  userId: string,
): Promise<string[]> {
  const { data, error } = await supabase
    .from('device_tokens')
    .select('expo_push_token')
    .eq('user_id', userId);
  if (error) {
    console.error('[send-unread-reminder] tokens fetch failed', userId, error);
    return [];
  }
  return (data ?? []).map((r) => (r as DeviceTokenRow).expo_push_token);
}

type PushMessage = {
  to: string;
  title: string;
  body: string;
  sound: null;
  data: { type: 'unread_reminder'; log_id: string };
};

async function sendBatch(messages: PushMessage[]): Promise<ExpoTicket[]> {
  if (messages.length === 0) return [];
  try {
    const res = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
      },
      body: JSON.stringify(messages),
    });
    if (!res.ok) {
      console.error('[send-unread-reminder] expo push http error', res.status, await res.text());
      return [];
    }
    const body = await res.json();
    return (body?.data ?? []) as ExpoTicket[];
  } catch (e) {
    console.error('[send-unread-reminder] expo push fetch failed', e);
    return [];
  }
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'method_not_allowed' }, 405);
  }

  const cronSecret = Deno.env.get('CRON_SECRET');
  if (!cronSecret) {
    console.error('CRON_SECRET not configured');
    return jsonResponse({ error: 'server_misconfigured' }, 500);
  }

  const authHeader = req.headers.get('Authorization') ?? '';
  const expected = `Bearer ${cronSecret}`;
  if (!timingSafeEqual(authHeader, expected)) {
    return jsonResponse({ error: 'unauthorized' }, 401);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: 'server_misconfigured' }, 500);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { hour, minute } = currentKstSlot();

  const { data: targets, error: targetsError } = await supabase
    .from('notification_settings')
    .select('user_id, enabled, unread_reminder_enabled, send_at_hour, send_at_minute')
    .eq('enabled', true)
    .eq('unread_reminder_enabled', true)
    .eq('send_at_hour', hour)
    .eq('send_at_minute', minute);

  if (targetsError) {
    console.error('[send-unread-reminder] targets fetch error', targetsError);
    return jsonResponse({ error: 'targets_fetch_failed' }, 500);
  }

  const targetRows = (targets ?? []) as NotificationSettingsRow[];
  const stats = {
    slot: `${hour}:${minute.toString().padStart(2, '0')} KST`,
    candidateUsers: targetRows.length,
    sent: 0,
    skippedRecent: 0,
    skippedNoCandidates: 0,
    skippedNoTokens: 0,
    expoErrors: 0,
    deadTokensRemoved: 0,
  };

  const allMessages: (PushMessage & { userId: string; logId: string; contentIds: string[]; title: string; body: string })[] = [];

  for (const row of targetRows) {
    if (await hasRecentLog(supabase, row.user_id)) {
      stats.skippedRecent += 1;
      continue;
    }
    const candidates = await fetchCandidates(supabase, row.user_id);
    if (candidates.length < MIN_CANDIDATE_COUNT) {
      stats.skippedNoCandidates += 1;
      continue;
    }
    const tokens = await fetchTokens(supabase, row.user_id);
    if (tokens.length === 0) {
      stats.skippedNoTokens += 1;
      continue;
    }

    const logId = crypto.randomUUID();
    const title = buildTitle(candidates.length);
    const body = buildBody(candidates);
    const contentIds = candidates.map((c) => c.id);

    for (const token of tokens) {
      allMessages.push({
        userId: row.user_id,
        logId,
        contentIds,
        title,
        body,
        to: token,
        sound: null,
        data: { type: 'unread_reminder', log_id: logId },
      });
    }
  }

  if (allMessages.length === 0) {
    return jsonResponse({ ok: true, stats });
  }

  // Expo 배치 전송 + 로그 삽입. userId+logId별로 tickets 매칭.
  const ticketByUserLog = new Map<string, ExpoTicket[]>();
  // Ticket 즉시 응답에서 DeviceNotRegistered로 판정된 dead token을 모아 뒤에서 일괄 삭제.
  // (Receipt 지연 응답 단계의 dead token은 cleanup-push-receipts에서 로깅으로만 처리)
  const deadTokens: Array<{ userId: string; token: string }> = [];

  for (let i = 0; i < allMessages.length; i += EXPO_BATCH_SIZE) {
    const batch = allMessages.slice(i, i + EXPO_BATCH_SIZE);
    const tickets = await sendBatch(batch.map(({ to, title, body, sound, data }) => ({
      to, title, body, sound, data,
    })));

    for (let j = 0; j < batch.length; j++) {
      const key = `${batch[j].userId}::${batch[j].logId}`;
      const list = ticketByUserLog.get(key) ?? [];
      const ticket = tickets[j];
      if (ticket) list.push(ticket);
      ticketByUserLog.set(key, list);
      if (ticket?.status === 'error') {
        stats.expoErrors += 1;
        if (ticket.details?.error === 'DeviceNotRegistered') {
          deadTokens.push({ userId: batch[j].userId, token: batch[j].to });
        }
      }
    }
  }

  // Dead token 즉시 회수 — 다음 발송에서 dead token으로 낭비되지 않도록.
  // token은 user_id 스코프로만 삭제 (같은 token이 우연히 다른 유저에 재할당될 가능성 배제).
  for (const { userId, token } of deadTokens) {
    const { error: delError } = await supabase
      .from('device_tokens')
      .delete()
      .eq('user_id', userId)
      .eq('expo_push_token', token);
    if (delError) {
      console.error('[send-unread-reminder] dead token delete failed', userId, delError);
    } else {
      stats.deadTokensRemoved += 1;
    }
  }

  // 로그 삽입 — 유저별로 그룹핑.
  const insertedKeys = new Set<string>();
  const logRows: Array<{
    id: string;
    user_id: string;
    type: string;
    content_ids: string[];
    title: string;
    body: string;
    expo_ticket_id: string | null;
    expo_receipt_status: string | null;
  }> = [];

  for (const m of allMessages) {
    const key = `${m.userId}::${m.logId}`;
    if (insertedKeys.has(key)) continue;
    insertedKeys.add(key);
    const tickets = ticketByUserLog.get(key) ?? [];
    const firstOk = tickets.find((t) => t.status === 'ok');
    logRows.push({
      id: m.logId,
      user_id: m.userId,
      type: 'unread_reminder',
      content_ids: m.contentIds,
      title: m.title,
      body: m.body,
      expo_ticket_id: firstOk?.id ?? null,
      // 전부 성공 → 'ok', 전부 실패 → 'error', 일부 실패(다기기 중 일부만 실패) → 'partial'
      expo_receipt_status: tickets.length === 0
        ? 'error'
        : tickets.every((t) => t.status === 'ok')
          ? 'ok'
          : tickets.some((t) => t.status === 'ok')
            ? 'partial'
            : 'error',
    });
    stats.sent += 1;
  }

  if (logRows.length > 0) {
    const { error: insertError } = await supabase
      .from('notification_logs')
      .insert(logRows);
    if (insertError) {
      console.error('[send-unread-reminder] log insert failed', insertError);
    }
  }

  return jsonResponse({ ok: true, stats });
});
