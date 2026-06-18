export type LinkMetadata = {
  title?: string;
  thumbnail_url?: string;
  domain?: string;
  description?: string;
};

const META_TIMEOUT_MS = 8000;

const INSTAGRAM_HOST_RE = /^(www\.)?instagram\.com$/i;
const INSTAGRAM_POST_RE = /^https?:\/\/(www\.)?instagram\.com\/(p|reel|reels|tv)\//i;
const INSTAGRAM_REEL_RE = /^https?:\/\/(www\.)?instagram\.com\/(reel|reels)\//i;
const YOUTUBE_HOST_RE = /^(www\.)?(youtube\.com|youtu\.be)$/i;

function instagramFallbackTitle(url: string) {
  return INSTAGRAM_REEL_RE.test(url) ? 'Instagram 릴스' : 'Instagram 게시물';
}

const BROWSER_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';

// Instagram 릴스(`/reel/{shortcode}/`)는 og:description에 캡션이 빠지지만, 같은 shortcode의 게시물
// 형식(`/p/{shortcode}/`)으로 요청하면 캡션을 포함한 응답을 받는다. 저장 URL과 원문 바로가기는 원본 유지.
function reelToPostUrl(url: string) {
  return url.replace(/(\/\/(?:www\.)?instagram\.com)\/(?:reel|reels)\//i, '$1/p/');
}

function isInstagramUrl(url: string) {
  try {
    return INSTAGRAM_HOST_RE.test(new URL(url).hostname);
  } catch {
    return false;
  }
}

function isYouTubeUrl(url: string) {
  try {
    return YOUTUBE_HOST_RE.test(new URL(url).hostname);
  } catch {
    return false;
  }
}

export async function fetchLinkMetadata(url: string): Promise<LinkMetadata> {
  const normalizedUrl = normalizeUrl(url);
  const domain = getDomain(normalizedUrl);

  try {
    const isInsta = isInstagramUrl(normalizedUrl);

    // Instagram 공개 oEmbed는 2020년부터 access_token 필수로 변경되어 토큰 없이는 항상 실패.
    // HTML 파싱(og:description / embedded JSON)으로 캡션 추출을 시도하고, 실패 시 generic fallback.

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), META_TIMEOUT_MS);

    // Instagram은 브라우저 UA로 요청해야 description을 반환
    const userAgent = isInsta ? BROWSER_UA : 'Nook/1.0 (+https://nook.app)';

    // 릴스는 게시물 형식으로 fetch — 캡션 노출 차이를 우회. parseMetadata에는 원본 URL을 넘겨 fallback 판정 유지
    const fetchUrl = isInsta ? reelToPostUrl(normalizedUrl) : normalizedUrl;

    const response = await fetch(fetchUrl, {
      signal: controller.signal,
      headers: {
        Accept: 'text/html,application/xhtml+xml',
        'User-Agent': userAgent,
      },
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return isInsta && INSTAGRAM_POST_RE.test(normalizedUrl)
        ? { domain, title: instagramFallbackTitle(normalizedUrl) }
        : { domain };
    }

    const html = await response.text();
    const metadata = parseMetadata(html, normalizedUrl);

    return {
      domain,
      ...metadata,
    };
  } catch {
    return INSTAGRAM_POST_RE.test(normalizedUrl)
      ? { domain: getDomain(normalizedUrl), title: instagramFallbackTitle(normalizedUrl) }
      : { domain: getDomain(normalizedUrl) };
  }
}

export function normalizeUrl(url: string) {
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

function getDomain(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return undefined;
  }
}

// 제네릭 제목 패턴 (인스타그램 등 본문 캡션이 title에 안 들어오는 사이트)
const GENERIC_TITLE_PATTERNS = [
  /instagram\s+(사진|동영상|photos?|videos?|reels?|릴스)/i,
  /on\s+instagram/i,
  // "Name (@username) • Instagram ..." 형식은 캡션이 없는 generic 제목
  /\(@[\w.]+\)\s*[·•]\s*Instagram/i,
];

function isGenericTitle(title: string) {
  return GENERIC_TITLE_PATTERNS.some(p => p.test(title));
}

function parseMetadata(html: string, baseUrl: string): Omit<LinkMetadata, 'domain'> {
  const rawTitle =
    findMetaContent(html, ['og:title', 'twitter:title']) ??
    decodeHtml(findTitle(html) ?? '');

  const description =
    findMetaContent(html, ['og:description', 'twitter:description', 'description']);

  // Instagram 캡션 추출 시도: og:description 또는 임베디드 JSON에서
  let caption: string | undefined;
  if (isInstagramUrl(baseUrl)) {
    caption = extractInstagramCaption(description, html);
  }

  const fullDescription = isYouTubeUrl(baseUrl)
    ? extractYouTubeDescription(html)
    : undefined;

  // 제네릭 제목이면 캡션 또는 description에서 의미 있는 제목 추출
  let title = rawTitle;
  if ((!title || isGenericTitle(title)) && (caption || description)) {
    const source = caption || description!;
    // "1. 우선..." 같은 번호 매김의 첫 토큰('1') 등 의미 없는 짧은 조각은 skip
    const firstLine = source
      .split(/[.\n]/)
      .map(s => s.trim())
      .find(s => s.length >= 3 && !/^\d+$/.test(s));
    const candidate = firstLine ?? source.trim();
    title = candidate.length > 100 ? candidate.slice(0, 100) + '…' : candidate;
  } else if (title && isGenericTitle(title) && isInstagramUrl(baseUrl)) {
    // 캡션/description을 못 가져왔으면 계정명 단독 노출 대신 형식 기반 fallback 사용
    title = instagramFallbackTitle(baseUrl);
  }

  const thumbnail =
    findMetaContent(html, ['og:image', 'og:image:url', 'twitter:image', 'twitter:image:src']);

  return {
    title: cleanText(title),
    description: cleanMultilineText(caption || fullDescription || description),
    thumbnail_url: thumbnail ? absolutizeUrl(thumbnail, baseUrl) : undefined,
  };
}

function extractYouTubeDescription(html: string): string | undefined {
  const shortDescriptionMatch = html.match(/"shortDescription"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  if (shortDescriptionMatch?.[1]) {
    const decoded = decodeJsonString(shortDescriptionMatch[1]);
    if (decoded) return decoded;
  }

  const descriptionTextMatch = html.match(/"description"\s*:\s*\{\s*"simpleText"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  if (descriptionTextMatch?.[1]) {
    const decoded = decodeJsonString(descriptionTextMatch[1]);
    if (decoded) return decoded;
  }

  return undefined;
}

/**
 * Instagram og:description에서 캡션 추출
 * 형식: "N likes, M comments - @user on Instagram: \"실제 캡션\""
 * 또는 HTML 내 embedded JSON에서 caption.text 추출
 */
function extractInstagramCaption(description?: string, html?: string): string | undefined {
  // 1. og:description에서 인용된 캡션 추출
  if (description) {
    // "... on Instagram: "캡션 내용"" 패턴
    const quotedMatch = description.match(/on Instagram:\s*["""](.+?)["""]\s*$/s);
    if (quotedMatch?.[1]?.trim()) {
      return decodeJsonString(quotedMatch[1]) ?? quotedMatch[1].trim();
    }
    // "... on Instagram: 캡션 내용" (따옴표 없는 경우)
    const colonMatch = description.match(/on Instagram:\s*(.+)$/s);
    if (colonMatch?.[1]?.trim() && colonMatch[1].trim().length > 10) {
      return decodeJsonString(colonMatch[1]) ?? colonMatch[1].trim();
    }
  }

  // 2. HTML 내 embedded JSON에서 캡션 추출
  if (html) {
    // Instagram은 JSON-LD 또는 script 태그에 캡션을 포함할 수 있음
    const captionMatch = html.match(/"caption"\s*:\s*\{[^}]*"text"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    if (captionMatch?.[1]) {
      const decoded = decodeJsonString(captionMatch[1]);
      if (decoded) return decoded;
    }
    // 대체 패턴: "edge_media_to_caption"
    const altMatch = html.match(/"edge_media_to_caption".*?"text"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    if (altMatch?.[1]) {
      const decoded = decodeJsonString(altMatch[1]);
      if (decoded) return decoded;
    }
  }

  return undefined;
}

function findMetaContent(html: string, names: string[]) {
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

function findTitle(html: string) {
  return html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1];
}

function getAttribute(tag: string, attr: string) {
  const match = tag.match(new RegExp(`${attr}\\s*=\\s*(['"])(.*?)\\1`, 'i'));
  return match?.[2];
}

function absolutizeUrl(value: string, baseUrl: string) {
  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return value;
  }
}

function cleanText(value?: string) {
  const cleaned = value?.replace(/\s+/g, ' ').trim();
  return cleaned || undefined;
}

function cleanMultilineText(value?: string) {
  const cleaned = value
    ?.replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return cleaned || undefined;
}

/** JSON 문자열의 이스케이프 시퀀스를 디코딩 (\uXXXX, \n, \" 등) */
function decodeJsonString(raw: string): string | undefined {
  try {
    // JSON.parse로 \uXXXX 포함 모든 이스케이프 처리
    const decoded = JSON.parse(`"${raw}"`);
    return typeof decoded === 'string' && decoded.trim() ? decoded.trim() : undefined;
  } catch {
    // JSON.parse 실패 시 수동 디코딩
    return raw
      .replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
      .replace(/\\n/g, '\n')
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\')
      .trim() || undefined;
  }
}

function decodeHtml(value: string) {
  return value
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}
