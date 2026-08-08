// Supabase Edge Function: extract-metadata (Lane B 6)
// 웹 저장 시 브라우저는 CORS로 외부 페이지 스크래핑 불가 → 서버가 대신 fetch + OG 파싱.
// 호출부는 lib/metadata.ts의 fetchLinkMetadata 웹 분기(Platform.OS==='web'). iOS는 이 함수를 호출하지 않는다.
//
// 배포: supabase functions deploy extract-metadata
// Secret 불필요(기본 fetch). 기본 verify_jwt=true — 로그인 유저의 JWT로만 호출 가능.

import { parseOgMetadata, getDomain, type LinkMetadata } from './parse.ts';

const META_TIMEOUT_MS = 8000;
// ponytail: iOS(metadata.ts DEFAULT_FETCH_UA)와 동일 UA로 시작. 서버 IP라 일부 사이트가 403을
// 주면 브라우저 UA('Mozilla/5.0 …')로 교체 — 실 URL 스모크 테스트로만 판별 가능.
const FETCH_UA = 'Nook/1.0 (+https://nook.app)';

// verify_jwt=true(로그인 유저만)로 이미 게이트되고 공개 OG만 반환하므로 origin은 wildcard로 연다.
// (origin allowlist는 Vercel 별칭·프리뷰 URL을 놓쳐 앱이 응답을 못 읽는 사고가 있었다.)
const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
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

function isYouTubeUrl(url: string): boolean {
  try {
    return /(^|\.)(youtube\.com|youtu\.be)$/i.test(new URL(url).hostname);
  } catch {
    return false;
  }
}

// YouTube는 서버 IP에 봇/consent 페이지(og:title="- YouTube")를 줘서 OG 스크래핑이 무의미하다.
// oembed는 IP 무관하게 실제 제목·썸네일을 준다(스크래핑 아님).
async function fetchYouTubeOembed(url: string): Promise<Omit<LinkMetadata, 'domain'> | undefined> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), META_TIMEOUT_MS);
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`,
      { signal: controller.signal, headers: { 'User-Agent': FETCH_UA } },
    );
    if (!res.ok) return undefined;
    const data = await res.json();
    if (!data?.title) return undefined;
    return { title: data.title, thumbnail_url: data.thumbnail_url };
  } catch {
    return undefined;
  } finally {
    clearTimeout(timeout);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'method_not_allowed' }, 405);
  }

  let body: { url?: unknown };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'invalid_json' }, 400);
  }
  const url = body?.url;
  if (typeof url !== 'string' || !url) {
    return jsonResponse({ error: 'missing_url' }, 400);
  }

  // domain은 fetch 없이 항상 결정 가능 → 스크래핑 실패해도 최소 domain은 돌려준다.
  const domain = getDomain(url);
  try {
    if (isYouTubeUrl(url)) {
      const yt = await fetchYouTubeOembed(url);
      if (yt) return jsonResponse({ domain, ...yt } as LinkMetadata);
      // oembed 실패 시 generic OG로 폴백
    }
    const html = await fetchHtml(url);
    if (!html) return jsonResponse({ domain } as LinkMetadata);
    return jsonResponse({ domain, ...parseOgMetadata(html, url) } as LinkMetadata);
  } catch {
    return jsonResponse({ domain } as LinkMetadata);
  }
});
