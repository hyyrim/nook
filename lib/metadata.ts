export type LinkMetadata = {
  title?: string;
  thumbnail_url?: string;
  domain?: string;
  description?: string;
};

const META_TIMEOUT_MS = 8000;

const INSTAGRAM_HOST_RE = /^(www\.)?instagram\.com$/i;
const INSTAGRAM_POST_RE = /^https?:\/\/(www\.)?instagram\.com\/(p|reel|reels|tv)\//i;

const BROWSER_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';

async function fetchInstagramOEmbed(url: string): Promise<{ title?: string; thumbnail_url?: string } | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), META_TIMEOUT_MS);
    const res = await fetch(`https://api.instagram.com/oembed/?url=${encodeURIComponent(url)}`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const data = await res.json();
    return {
      title: data.title || undefined,
      thumbnail_url: data.thumbnail_url || undefined,
    };
  } catch {
    return null;
  }
}

function isInstagramUrl(url: string) {
  try {
    return INSTAGRAM_HOST_RE.test(new URL(url).hostname);
  } catch {
    return false;
  }
}

export async function fetchLinkMetadata(url: string): Promise<LinkMetadata> {
  const normalizedUrl = normalizeUrl(url);
  const domain = getDomain(normalizedUrl);

  try {
    const isInsta = isInstagramUrl(normalizedUrl);

    // Instagram 포스트: oEmbed로 캡션(title)과 썸네일을 직접 가져옴
    if (isInsta && INSTAGRAM_POST_RE.test(normalizedUrl)) {
      const oembed = await fetchInstagramOEmbed(normalizedUrl);
      if (oembed?.title) {
        const oembedTitle = oembed.title.length > 100 ? oembed.title.slice(0, 100) + '…' : oembed.title;
        return {
          domain,
          title: oembedTitle,
          description: oembed.title, // oEmbed title = 캡션 전문
          thumbnail_url: oembed.thumbnail_url,
        };
      }
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), META_TIMEOUT_MS);

    // Instagram은 브라우저 UA로 요청해야 description을 반환
    const userAgent = isInsta ? BROWSER_UA : 'Nook/1.0 (+https://nook.app)';

    const response = await fetch(normalizedUrl, {
      signal: controller.signal,
      headers: {
        Accept: 'text/html,application/xhtml+xml',
        'User-Agent': userAgent,
      },
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return { domain };
    }

    const html = await response.text();
    const metadata = parseMetadata(html, normalizedUrl);

    return {
      domain,
      ...metadata,
    };
  } catch {
    return { domain };
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
  /instagram\s+사진\s+및\s+동영상/i,
  /instagram\s+photos?\s+and\s+videos?/i,
  /on\s+instagram/i,
  /instagram\s*릴스/i,
  /instagram\s*reels?/i,
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

  // 제네릭 제목이면 캡션 또는 description에서 의미 있는 제목 추출
  let title = rawTitle;
  if ((!title || isGenericTitle(title)) && (caption || description)) {
    const source = caption || description!;
    const firstLine = source.split(/[.\n]/).find(s => s.trim().length > 0)?.trim();
    title = firstLine && firstLine.length > 100 ? firstLine.slice(0, 100) + '…' : firstLine ?? source.slice(0, 100);
  } else if (title && isGenericTitle(title)) {
    // 캡션/description 없으면 제네릭 접미사만 제거 (계정명만 표시)
    title = title
      .replace(/\s*[·•]\s*Instagram\s+(사진\s+및\s+동영상|릴스|Reels?|photos?\s+and\s+videos?)\s*$/i, '')
      .trim();
  }

  const thumbnail =
    findMetaContent(html, ['og:image', 'og:image:url', 'twitter:image', 'twitter:image:src']);

  return {
    title: cleanText(title),
    description: cleanMultilineText(caption || description),
    thumbnail_url: thumbnail ? absolutizeUrl(thumbnail, baseUrl) : undefined,
  };
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
