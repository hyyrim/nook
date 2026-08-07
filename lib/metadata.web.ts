// 웹 전용 metadata. Metro가 웹 번들에서 './metadata' import를 이 파일로 해소한다(.web.ts).
// 브라우저 fetch는 CORS로 외부 페이지 스크래핑이 막히므로, extract-metadata Edge Function에 위임한다.
//
// 순수 헬퍼(normalizeUrl / isBadMetadataText / isGenericPlatformTitle / platformFallbackTitle / 타입 등)는
// 네트워크와 무관하니 metadata.ts를 그대로 재수출하고, fetch에 묶인 fetchLinkMetadata만 교체한다.
// (아래 로컬 export가 재수출된 동명 심볼을 가린다.)
export * from './metadata';

import { supabase } from './supabase';
import { normalizeUrl, platformFallbackTitle, type LinkMetadata } from './metadata';

export async function fetchLinkMetadata(
  url: string,
  _options?: { shareIntentMeta?: Record<string, string | undefined> | null }, // 웹은 share extension 없음 — 무시
): Promise<LinkMetadata> {
  const normalizedUrl = normalizeUrl(url);
  try {
    const { data, error } = await supabase.functions.invoke<LinkMetadata>('extract-metadata', {
      body: { url: normalizedUrl },
    });
    if (error || !data) return fallback(normalizedUrl);
    return data;
  } catch {
    return fallback(normalizedUrl);
  }
}

// Edge Function 호출 자체가 실패(네트워크/인증)해도 최소 domain + 플랫폼 fallback 제목은 남긴다.
function fallback(url: string): LinkMetadata {
  const domain = safeDomain(url);
  const title = platformFallbackTitle(url);
  return title ? { domain, title } : { domain };
}

function safeDomain(url: string): string | undefined {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return undefined;
  }
}
