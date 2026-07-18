// Supabase Edge Function: cleanup-push-receipts
// pg_cron이 하루 1회(예: KST 새벽) 호출. 최근 24시간 내 발송된 notification_logs 중
// receipt 미확인 로그를 Expo Push Receipts API로 조회하고 상태를 업데이트한다.
//
// Expo는 push receipt를 24시간만 보관하므로 그 안에 반드시 한 번은 조회해야 한다.
// - status='ok' → 실제 APNs/FCM 전달 성공 → expo_receipt_status = 'delivered'
// - status='error' → details.error 유형별로 처리 (DeviceNotRegistered / MessageTooBig 등)
// - 아직 결과 없음(응답에 id 미포함) → receipt_checked_at 유지 (다음 배치에서 재시도)
//
// DeviceNotRegistered에 해당하는 device_tokens 자동 삭제는 이번 스코프에서 제외한다.
// 이유: notification_logs.expo_ticket_id는 첫 ok ticket만 보관하는 구조라 ticket→token 매핑이 없다.
// 즉시 응답 단계의 dead token은 send-unread-reminder에서 이미 회수하므로 실질 커버리지는 확보됨.
// 다기기 유저의 receipt 단계 dead token 회수는 push_delivery_attempts 테이블 도입 후 별도 스프린트.
//
// 배포:
//   supabase functions deploy cleanup-push-receipts --no-verify-jwt
// Secret 설정 (send-unread-reminder와 CRON_SECRET 공유):
//   supabase secrets set CRON_SECRET=<random-hex>
//   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<service-role-jwt>
//
// 관련: 결정 101 (48차)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const EXPO_RECEIPTS_URL = 'https://exp.host/--/api/v2/push/getReceipts';
const EXPO_RECEIPTS_BATCH = 1000;
// Expo TTL은 24h. 23h 이내 로그만 조회해서 만료 직전 조회 실패를 방지.
const LOOKBACK_HOURS = 23;
// 한 번 실행에서 처리할 최대 로그 수 (안전 상한). 하루 1회 실행이라 실제로는 미달.
const MAX_LOGS_PER_RUN = 5000;

type LogRow = {
  id: string;
  expo_ticket_id: string;
};

type ExpoReceipt = {
  status: 'ok' | 'error';
  message?: string;
  details?: { error?: string };
};

type ReceiptsResponse = {
  data?: Record<string, ExpoReceipt>;
  errors?: Array<{ code: string; message: string }>;
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

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

async function fetchReceipts(ids: string[]): Promise<Record<string, ExpoReceipt>> {
  if (ids.length === 0) return {};
  try {
    const res = await fetch(EXPO_RECEIPTS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'Accept-Encoding': 'gzip, deflate',
      },
      body: JSON.stringify({ ids }),
    });
    if (!res.ok) {
      console.error('[cleanup-push-receipts] expo receipts http error', res.status, await res.text());
      return {};
    }
    const body = (await res.json()) as ReceiptsResponse;
    if (body.errors && body.errors.length > 0) {
      console.error('[cleanup-push-receipts] expo receipts api errors', body.errors);
    }
    return body.data ?? {};
  } catch (e) {
    console.error('[cleanup-push-receipts] expo receipts fetch failed', e);
    return {};
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

  const since = new Date(Date.now() - LOOKBACK_HOURS * 60 * 60 * 1000).toISOString();

  const { data: logs, error: logsError } = await supabase
    .from('notification_logs')
    .select('id, expo_ticket_id')
    .not('expo_ticket_id', 'is', null)
    .is('receipt_checked_at', null)
    .gte('sent_at', since)
    .order('sent_at', { ascending: true })
    .limit(MAX_LOGS_PER_RUN);

  if (logsError) {
    console.error('[cleanup-push-receipts] logs fetch failed', logsError);
    return jsonResponse({ error: 'logs_fetch_failed' }, 500);
  }

  const logRows = (logs ?? []) as LogRow[];
  const stats = {
    totalChecked: 0,
    delivered: 0,
    deviceNotRegistered: 0,
    otherErrors: 0,
    pendingReceipts: 0,
  };

  if (logRows.length === 0) {
    return jsonResponse({ ok: true, stats });
  }

  // ticket_id → log 매핑 (동일 ticket_id 재사용 가정 안 함, 그러나 방어적으로 첫 매칭만).
  const logByTicketId = new Map<string, LogRow>();
  for (const row of logRows) {
    if (!logByTicketId.has(row.expo_ticket_id)) {
      logByTicketId.set(row.expo_ticket_id, row);
    }
  }
  const ticketIds = Array.from(logByTicketId.keys());

  const now = new Date().toISOString();

  for (let i = 0; i < ticketIds.length; i += EXPO_RECEIPTS_BATCH) {
    const batchIds = ticketIds.slice(i, i + EXPO_RECEIPTS_BATCH);
    const receipts = await fetchReceipts(batchIds);

    // 그룹별 업데이트로 서버 왕복 최소화.
    const deliveredLogIds: string[] = [];
    const dnrLogIds: string[] = [];
    const otherErrorLogIds: string[] = [];

    for (const ticketId of batchIds) {
      const receipt = receipts[ticketId];
      const log = logByTicketId.get(ticketId);
      if (!log) continue;

      if (!receipt) {
        // Expo가 아직 receipt를 준비하지 않음 — receipt_checked_at 갱신 없이 다음 배치에서 재시도.
        stats.pendingReceipts += 1;
        continue;
      }

      stats.totalChecked += 1;

      if (receipt.status === 'ok') {
        stats.delivered += 1;
        deliveredLogIds.push(log.id);
      } else if (receipt.details?.error === 'DeviceNotRegistered') {
        stats.deviceNotRegistered += 1;
        dnrLogIds.push(log.id);
      } else {
        stats.otherErrors += 1;
        otherErrorLogIds.push(log.id);
        console.warn('[cleanup-push-receipts] receipt error', ticketId, receipt);
      }
    }

    // 상태별 업데이트를 배치로 수행.
    // 013 마이그레이션에서 트리거가 auth.uid() null(service role)일 때 컬럼 잠금을 우회하도록 갱신됨.
    if (deliveredLogIds.length > 0) {
      const { error } = await supabase
        .from('notification_logs')
        .update({ expo_receipt_status: 'delivered', receipt_checked_at: now })
        .in('id', deliveredLogIds);
      if (error) console.error('[cleanup-push-receipts] delivered update failed', error);
    }
    if (dnrLogIds.length > 0) {
      const { error } = await supabase
        .from('notification_logs')
        .update({ expo_receipt_status: 'device_not_registered', receipt_checked_at: now })
        .in('id', dnrLogIds);
      if (error) console.error('[cleanup-push-receipts] dnr update failed', error);
    }
    if (otherErrorLogIds.length > 0) {
      const { error } = await supabase
        .from('notification_logs')
        .update({ expo_receipt_status: 'receipt_error', receipt_checked_at: now })
        .in('id', otherErrorLogIds);
      if (error) console.error('[cleanup-push-receipts] error update failed', error);
    }
  }

  return jsonResponse({ ok: true, stats });
});
