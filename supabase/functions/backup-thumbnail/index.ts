// Supabase Edge Function: backup-thumbnail
//
// 목적: 외부 CDN(Instagram scontent 등)의 서명 만료로 시간이 지나면 죽는 썸네일을
// Supabase Storage에 압축 복사본으로 저장해 영구화한다.
//
// 요청: 인증된 사용자의 access token으로 호출.
//   POST /functions/v1/backup-thumbnail
//   Authorization: Bearer <access_token>
//   Body: { contentId: string }
// 실제 소스 URL은 서버가 contents.thumbnail_url(RLS 스코프)에서 재조회한다.
// 클라이언트가 임의 URL을 서버 자원으로 fetch하도록 유도할 수 없다.
//
// 응답 200: { storageUrl: string; sizeBytes: number }
// 응답 (에러): { error: string, originalUrl?: string } — 실패 시 클라이언트는 원본 URL 유지
//
// 배포:
//   supabase functions deploy backup-thumbnail
// (JWT 검증은 기본 활성. `--no-verify-jwt` 필요 없음)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Image } from 'https://deno.land/x/imagescript@1.2.17/mod.ts';

const BUCKET = 'thumbnails';
const TARGET_SHORT_SIDE = 400; // 짧은 쪽 400px (retina 2x에서 카드 표시 충분)
const JPEG_QUALITY = 70;
const MAX_SOURCE_BYTES = 8 * 1024 * 1024; // 8 MB — Instagram OG는 대개 500KB 이하
const FETCH_TIMEOUT_MS = 10_000;
const CACHE_CONTROL = '31536000, immutable'; // 1년
const MAX_REDIRECTS = 5;

const FETCH_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// SSRF 방어: 내부/사설 IP, 클라우드 메타데이터, .internal/.local 대역 차단.
// DNS 리바인딩까지 막으려면 해석된 IP 검사가 필요하지만 hostname 필터로 대다수 공격 차단.
function isAllowedUrl(rawUrl: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return false;
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;
  const host = parsed.hostname.toLowerCase();
  if (host === 'localhost' || host === '127.0.0.1' || host === '::1') return false;
  if (host === '0.0.0.0') return false;
  if (host === '169.254.169.254' || host === 'metadata.google.internal') return false;
  if (host.endsWith('.internal') || host.endsWith('.local')) return false;
  // IPv4 private ranges
  if (/^10\./.test(host)) return false;
  if (/^192\.168\./.test(host)) return false;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(host)) return false;
  if (/^127\./.test(host)) return false;
  if (/^169\.254\./.test(host)) return false;
  // IPv6 loopback/link-local/unique-local (기본만)
  if (host.startsWith('fc') || host.startsWith('fd')) return false;
  if (host.startsWith('fe80')) return false;
  return true;
}

async function fetchImageBytes(startUrl: string): Promise<Uint8Array | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    // Redirect를 수동 처리해 각 hop URL을 재검증한다.
    // 자동 follow는 hostname 필터를 우회할 수 있다 — 공개 도메인이 사설 IP로 300 redirect되는 케이스.
    let currentUrl = startUrl;
    let res: Response | null = null;
    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      res = await fetch(currentUrl, {
        headers: { 'User-Agent': FETCH_UA, Accept: 'image/*,*/*;q=0.8' },
        signal: controller.signal,
        redirect: 'manual',
      });
      if (res.status >= 300 && res.status < 400) {
        const loc = res.headers.get('location');
        res.body?.cancel().catch(() => {});
        if (!loc) return null;
        let next: URL;
        try {
          next = new URL(loc, currentUrl);
        } catch {
          return null;
        }
        const nextStr = next.toString();
        if (!isAllowedUrl(nextStr)) return null;
        currentUrl = nextStr;
        continue;
      }
      // 정상 응답. 아래에서 처리.
      break;
    }
    if (!res || !res.ok) {
      res?.body?.cancel().catch(() => {});
      return null;
    }

    // content-length는 참고용(위조 가능). 실제 방어는 스트림 누적 바이트 카운트로.
    const contentLength = Number(res.headers.get('content-length') ?? '0');
    if (contentLength > MAX_SOURCE_BYTES) {
      res.body?.cancel().catch(() => {});
      return null;
    }

    const reader = res.body?.getReader();
    if (!reader) return null;

    const chunks: Uint8Array[] = [];
    let total = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_SOURCE_BYTES) {
        reader.cancel().catch(() => {});
        return null;
      }
      chunks.push(value);
    }
    if (total === 0) return null;

    const merged = new Uint8Array(total);
    let offset = 0;
    for (const c of chunks) {
      merged.set(c, offset);
      offset += c.byteLength;
    }
    return merged;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function compressToJpeg(bytes: Uint8Array): Promise<Uint8Array | null> {
  try {
    const image = await Image.decode(bytes);
    if (image.width < image.height) {
      image.resize(TARGET_SHORT_SIDE, Image.RESIZE_AUTO);
    } else {
      image.resize(Image.RESIZE_AUTO, TARGET_SHORT_SIDE);
    }
    return await image.encodeJPEG(JPEG_QUALITY);
  } catch {
    return null; // WebP/GIF 등 미지원 포맷은 fail-silent
  }
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'method_not_allowed' }, 405);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  if (!supabaseUrl || !serviceRoleKey || !anonKey) {
    return jsonResponse({ error: 'server_misconfigured' }, 500);
  }

  const authHeader = req.headers.get('Authorization') ?? '';
  if (!authHeader.startsWith('Bearer ')) {
    return jsonResponse({ error: 'unauthorized' }, 401);
  }

  // 유저 확인 — 요청자의 JWT로 auth.uid() 확보
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData.user) {
    return jsonResponse({ error: 'unauthorized' }, 401);
  }
  const userId = userData.user.id;

  let body: { contentId?: string };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'invalid_body' }, 400);
  }
  const { contentId } = body;
  if (!contentId) {
    return jsonResponse({ error: 'missing_fields' }, 400);
  }

  // 소유권 검증 + 실제 사용할 sourceUrl 조회.
  // 클라이언트가 보낸 sourceUrl은 신뢰하지 않는다 — 임의 URL로 서버 fetch 유도 방지.
  // userClient(RLS 적용)로 조회하면 다른 유저의 콘텐츠는 자동 차단된다.
  const { data: contentRow, error: contentError } = await userClient
    .from('contents')
    .select('thumbnail_url')
    .eq('id', contentId)
    .eq('user_id', userId)
    .maybeSingle();
  if (contentError) {
    console.error('[backup-thumbnail] content lookup failed', userId, contentId, contentError);
    return jsonResponse({ error: 'content_lookup_failed' }, 500);
  }
  if (!contentRow) {
    return jsonResponse({ error: 'content_not_found' }, 404);
  }
  const sourceUrl = contentRow.thumbnail_url as string | null;
  if (!sourceUrl) {
    return jsonResponse({ error: 'no_thumbnail' }, 400);
  }

  // 이미 Storage URL이면 그대로 반환 (재백업 방지)
  if (sourceUrl.includes(`/storage/v1/object/public/${BUCKET}/`)) {
    return jsonResponse({ storageUrl: sourceUrl, sizeBytes: 0, cached: true });
  }

  // SSRF 방어 — 사설/메타데이터 IP 차단
  if (!isAllowedUrl(sourceUrl)) {
    return jsonResponse({ error: 'invalid_source_url' }, 400);
  }

  const sourceBytes = await fetchImageBytes(sourceUrl);
  if (!sourceBytes) {
    return jsonResponse({ error: 'source_fetch_failed', originalUrl: sourceUrl }, 200);
  }

  const jpegBytes = await compressToJpeg(sourceBytes);
  if (!jpegBytes) {
    return jsonResponse({ error: 'compress_failed', originalUrl: sourceUrl }, 200);
  }

  // Service role client로 업로드 (RLS 우회, 유저 폴더 규칙은 코드로 강제)
  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const objectPath = `${userId}/${contentId}.jpg`;
  const { error: uploadError } = await adminClient.storage
    .from(BUCKET)
    .upload(objectPath, jpegBytes, {
      contentType: 'image/jpeg',
      cacheControl: CACHE_CONTROL,
      upsert: true,
    });

  if (uploadError) {
    console.error('[backup-thumbnail] upload failed', userId, contentId, uploadError);
    return jsonResponse({ error: 'upload_failed', originalUrl: sourceUrl }, 200);
  }

  const { data: publicUrl } = adminClient.storage.from(BUCKET).getPublicUrl(objectPath);
  return jsonResponse({
    storageUrl: publicUrl.publicUrl,
    sizeBytes: jpegBytes.byteLength,
  });
});
