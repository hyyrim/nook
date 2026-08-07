// 웹 저장용 generic OG 메타 파서 (Lane B 6, Phase 1).
// lib/metadata.ts의 해당 regex 헬퍼를 그대로 이식(순수 함수, DOM 미사용).
// Notion/X/Instagram 특수처리는 이식하지 않음 — 웹 저장에서 실제로 결과가 나쁠 때 해당 사이트만 추가.

export type LinkMetadata = {
  title?: string;
  description?: string;
  thumbnail_url?: string;
  domain?: string;
};

function getAttribute(tag: string, attr: string): string | undefined {
  return tag.match(new RegExp(`${attr}\\s*=\\s*(['"])(.*?)\\1`, 'i'))?.[2];
}

function decodeHtml(value: string): string {
  let decoded = value;
  for (let i = 0; i < 3; i++) {
    const next = decoded
      .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
      .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
    if (next === decoded) break;
    decoded = next;
  }
  return decoded;
}

function findMetaContent(html: string, names: string[]): string | undefined {
  const metaTags = html.match(/<meta\b[^>]*>/gi) ?? [];
  for (const name of names) {
    for (const tag of metaTags) {
      const property = getAttribute(tag, 'property') ?? getAttribute(tag, 'name');
      if (property?.toLowerCase() !== name.toLowerCase()) continue;
      const content = getAttribute(tag, 'content');
      if (content) return decodeHtml(content);
    }
  }
  return undefined;
}

function findTitle(html: string): string | undefined {
  return html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
}

function absolutizeUrl(value: string, baseUrl: string): string {
  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return value;
  }
}

function cleanText(value?: string): string | undefined {
  const cleaned = value?.replace(/\s+/g, ' ').trim();
  return cleaned || undefined;
}

export function getDomain(url: string): string | undefined {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return undefined;
  }
}

// og:* / twitter:* / <title> 기반 generic 추출. 대다수 사이트(블로그·뉴스·YouTube 등) 커버.
export function parseOgMetadata(html: string, url: string): Omit<LinkMetadata, 'domain'> {
  const title = cleanText(
    findMetaContent(html, ['og:title', 'twitter:title']) ?? decodeHtml(findTitle(html) ?? ''),
  );
  const description = cleanText(
    findMetaContent(html, ['og:description', 'twitter:description', 'description']),
  );
  const image = findMetaContent(html, [
    'og:image',
    'og:image:url',
    'og:image:secure_url',
    'twitter:image',
    'twitter:image:src',
  ]);
  return {
    title,
    description,
    thumbnail_url: image ? absolutizeUrl(image, url) : undefined,
  };
}
