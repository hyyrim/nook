// Supabase Edge Function: extract-metadata (Lane B 6)
// 웹 저장 시 브라우저는 CORS로 외부 페이지 스크래핑 불가 → 서버가 대신 fetch + OG 파싱.
// iOS는 lib/metadata.ts를 그대로 쓰고 이 함수를 호출하지 않는다(웹 전용, 호출부는 lib/metadata.web.ts).
//
// 배포: supabase functions deploy extract-metadata
// Secret 불필요(기본 fetch). 기본 verify_jwt=true — 로그인 유저의 JWT로만 호출 가능.

import { parseOgMetadata, getDomain, type LinkMetadata } from './parse.ts';

const META_TIMEOUT_MS = 8000;
// ponytail: iOS(metadata.ts DEFAULT_FETCH_UA)와 동일 UA로 시작. 서버 IP라 일부 사이트가 403을
// 주면 브라우저 UA('Mozilla/5.0 …')로 교체 — 실 URL 스모크 테스트로만 판별 가능.
const FETCH_UA = 'Nook/1.0 (+https://nook.app)';

// 웹 오리진 allowlist. 유출된 JWT로 임의 사이트에서 이 프록시를 호출하지 못하게 제한.
const ALLOWED_ORIGINS = new Set([
  'http://localhost:8081',
  'https://nook-lovat-three.vercel.app',
  'https://nook-hyyrims-projects.vercel.app',
]);

function corsHeaders(origin: string | null): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': origin && ALLOWED_ORIGINS.has(origin) ? origin : '',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

function jsonResponse(body: unknown, status: number, cors: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...cors },
  });
}

async function fetchHtml(url: string): Promise<string | undefined> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), META_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'text/html,application/xhtml+xml', 'User-Agent': FETCH_UA },
    });
    if (!response.ok) return undefined;
    return await response.text();
  } catch {
    return undefined;
  } finally {
    clearTimeout(timeout);
  }
}

Deno.serve(async (req) => {
  const cors = corsHeaders(req.headers.get('Origin'));

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: cors });
  }
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'method_not_allowed' }, 405, cors);
  }

  let body: { url?: unknown };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'invalid_json' }, 400, cors);
  }
  const url = body?.url;
  if (typeof url !== 'string' || !url) {
    return jsonResponse({ error: 'missing_url' }, 400, cors);
  }

  // domain은 fetch 없이 항상 결정 가능 → 스크래핑 실패해도 최소 domain은 돌려준다.
  const domain = getDomain(url);
  try {
    const html = await fetchHtml(url);
    if (!html) return jsonResponse({ domain } as LinkMetadata, 200, cors);
    return jsonResponse({ domain, ...parseOgMetadata(html, url) } as LinkMetadata, 200, cors);
  } catch {
    return jsonResponse({ domain } as LinkMetadata, 200, cors);
  }
});
