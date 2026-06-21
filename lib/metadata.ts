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

// 봇 차단/로그인 게이트 상황에서 플랫폼별로 generic title fallback.
// 호스트 매칭은 normalizeHost(hostname.replace(/^www\./, '').toLowerCase()) 기준.
const PLATFORM_FALLBACK_TITLES: { match: (host: string, url: string) => boolean; title: string }[] = [
  { match: (h) => h === 'instagram.com', title: 'Instagram 게시물' }, // reel은 platformFallbackTitle 진입부에서 별도 분기
  { match: (h) => h === 'threads.net' || h === 'threads.com', title: 'Threads 게시물' },
  { match: (h) => h === 'x.com' || h === 'twitter.com', title: 'X 게시물' },
  { match: (h) => h === 'tiktok.com' || h.endsWith('.tiktok.com'), title: 'TikTok 영상' }, // vt./vm./m. 단축·모바일 서브도메인 포함
  { match: (h) => h === 'linkedin.com', title: 'LinkedIn 게시물' },
  { match: (h) => h === 'medium.com' || h.endsWith('.medium.com'), title: 'Medium 글' },
  { match: (h) => h === 'velog.io', title: 'Velog 글' },
  { match: (h) => h === 'brunch.co.kr', title: '브런치 글' },
  { match: (h) => h === 'blog.naver.com' || h === 'm.blog.naver.com', title: '네이버 블로그 글' },
];

export function platformFallbackTitle(url: string): string | undefined {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '').toLowerCase();
    if (INSTAGRAM_REEL_RE.test(url)) return 'Instagram 릴스';
    return PLATFORM_FALLBACK_TITLES.find((p) => p.match(host, url))?.title;
  } catch {
    return undefined;
  }
}

const DEFAULT_FETCH_UA = 'Nook/1.0 (+https://nook.app)';

// Instagram은 link-preview bot UA에 따라 다른 메타데이터를 노출한다.
// - facebookexternalhit: 응답 HTML 안에 `"caption":{"text":"..."}` JSON으로 캡션 전문(있는 경우)
// - Slackbot: og:description에 짧은 캡션 인용 (모든 게시물에서 비교적 일관되게 제공)
// fb는 풍부하지만 일부 게시물에서 caption JSON이 누락 → 1차로 시도 후 실패 시 Slackbot으로 폴백.
const INSTAGRAM_FETCH_UA_PRIMARY = 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)';
const INSTAGRAM_FETCH_UA_FALLBACK = 'Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)';

function extractInstagramShortcode(url: string): string | undefined {
  return url.match(/\/(?:p|reel|reels|tv)\/([A-Za-z0-9_-]+)/)?.[1];
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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

async function fetchHtmlWithUA(url: string, userAgent: string): Promise<string | undefined> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), META_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: 'text/html,application/xhtml+xml',
        'User-Agent': userAgent,
      },
    });
    if (!response.ok) return undefined;
    return await response.text();
  } catch {
    return undefined;
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchLinkMetadata(url: string): Promise<LinkMetadata> {
  const normalizedUrl = normalizeUrl(url);
  const domain = getDomain(normalizedUrl);
  const isInsta = isInstagramUrl(normalizedUrl);

  try {
    if (isInsta) {
      // 1차: facebookexternalhit — 응답 HTML 안의 caption.text JSON에서 풍부한 캡션 시도
      const primaryHtml = await fetchHtmlWithUA(normalizedUrl, INSTAGRAM_FETCH_UA_PRIMARY);
      if (primaryHtml) {
        const captionFromHtml = extractInstagramCaptionFromHtml(primaryHtml, normalizedUrl);
        if (captionFromHtml) {
          return { domain, ...parseMetadata(primaryHtml, normalizedUrl) };
        }
      }
      // 2차: Slackbot — og:description 짧은 캡션 인용 (모든 게시물에서 비교적 일관)
      const fallbackHtml = await fetchHtmlWithUA(normalizedUrl, INSTAGRAM_FETCH_UA_FALLBACK);
      if (fallbackHtml) {
        return { domain, ...parseMetadata(fallbackHtml, normalizedUrl) };
      }
      return INSTAGRAM_POST_RE.test(normalizedUrl)
        ? { domain, title: platformFallbackTitle(normalizedUrl) }
        : { domain };
    }

    const html = await fetchHtmlWithUA(normalizedUrl, DEFAULT_FETCH_UA);
    if (!html) {
      const fallback = platformFallbackTitle(normalizedUrl);
      return fallback ? { domain, title: fallback } : { domain };
    }
    return { domain, ...parseMetadata(html, normalizedUrl) };
  } catch {
    const fallback = platformFallbackTitle(normalizedUrl);
    return fallback
      ? { domain: getDomain(normalizedUrl), title: fallback }
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
// 매칭 시 title이 부적합하다고 보고 caption → description → platformFallbackTitle 순으로 강등.
const GENERIC_TITLE_PATTERNS = [
  // Instagram
  /instagram\s+(사진|동영상|photos?|videos?|reels?|릴스)/i,
  /on\s+instagram/i,
  /\(@[\w.]+\)\s*[·•]\s*Instagram/i,
  /^Instagram(의|에서)/i,
  // Threads
  /^Threads(의|에서)/i,
  /\(@[\w.]+\)\s*[·•]\s*Threads/i,
  /on\s+Threads/i,
  // X (twitter)
  /^X(에서|의)\s/i,
  /\(@[\w.]+\)\s*[·•]\s*X\b/i,
  /on\s+X(\s|$)/i,
  // TikTok
  /^TikTok(에서|의)/i,
  /\(@[\w.]+\)\s*[·•]\s*TikTok/i,
  /on\s+TikTok/i,
  // 공통 꼬리 — "...(@handle) 님" (X/Threads/Instagram link-preview에서 자주 등장)
  /\(@[\w.]+\)\s*님\s*$/,
];

function isGenericTitle(title: string) {
  return GENERIC_TITLE_PATTERNS.some(p => p.test(title));
}

// 외부에서 기존 저장 레코드 오염 판정에 쓰는 헬퍼.
// isBadMetadataText(완전 차단 패턴)와 다르게 generic 제목 케이스(`Threads의 …`, `X에서 …` 등)도 잡는다.
export function isGenericPlatformTitle(value?: string | null) {
  if (!value) return false;
  return isGenericTitle(value);
}

function parseMetadata(html: string, baseUrl: string): Omit<LinkMetadata, 'domain'> {
  const rawTitle =
    findMetaContent(html, ['og:title', 'twitter:title']) ??
    decodeHtml(findTitle(html) ?? '');

  const description =
    findMetaContent(html, ['og:description', 'twitter:description', 'description']);

  // Instagram 캡션 추출 시도: 1) 응답 HTML embedded JSON(shortcode 컨텍스트), 2) og:description 인용 패턴
  let caption: string | undefined;
  if (isInstagramUrl(baseUrl)) {
    caption = extractInstagramCaptionFromHtml(html, baseUrl) ?? extractInstagramCaption(description, html);
  }

  const fullDescription = isYouTubeUrl(baseUrl)
    ? extractYouTubeDescription(html)
    : undefined;

  const fallback = platformFallbackTitle(baseUrl);
  const isBadTitle = isBadMetadataText(rawTitle);
  const isBadDesc = isBadMetadataText(description);
  // description이 generic 제목 패턴(예: "Threads의 …(@handle)님")과 일치하면
  // title 강등 소스로도, 콘텐츠 저장용으로도 사용하지 않는다.
  // X/Threads는 og:title과 og:description이 동일한 generic 텍스트를 함께 내려보내기 때문.
  const isGenericDesc = !!description && isGenericTitle(description);
  const canUseDescription = description && !isBadDesc && !isGenericDesc;

  // 제네릭/오염 제목이면 caption 또는 description에서 의미 있는 제목 추출
  let title = rawTitle;
  if ((!title || isGenericTitle(title) || isBadTitle) && (caption || canUseDescription)) {
    const source = caption || description!;
    // "1. 우선..." 같은 번호 매김의 첫 토큰('1') 등 의미 없는 짧은 조각은 skip,
    // 그리고 첫 줄 자체가 generic 패턴(`X에서 …`, `Threads의 …`)이면 skip
    const firstLine = source
      .split(/[.\n]/)
      .map(s => s.trim())
      .find(s => s.length >= 3 && !/^\d+$/.test(s) && !isGenericTitle(s));
    const candidate = firstLine ?? (isGenericTitle(source.trim()) ? undefined : source.trim());
    if (candidate) {
      title = candidate.length > 100 ? candidate.slice(0, 100) + '…' : candidate;
    } else if (fallback) {
      title = fallback;
    }
  } else if ((!title || isGenericTitle(title) || isBadTitle) && fallback) {
    // 캡션/description도 못 가져왔거나 오염 — 도메인 기반 fallback
    title = fallback;
  }

  const thumbnail =
    findMetaContent(html, ['og:image', 'og:image:url', 'twitter:image', 'twitter:image:src']);

  return {
    title: cleanText(title),
    description: cleanMultilineText(
      caption || fullDescription || (isBadDesc || isGenericDesc ? undefined : description),
    ),
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
    const quotedMatch = description.match(/on Instagram:\s*["“”](.+?)["“”]\s*$/s);
    if (quotedMatch?.[1]?.trim()) {
      return cleanInstagramCaptionCandidate(quotedMatch[1]);
    }
    // Slackbot UA 응답 형식: "N views, M likes: "캡션"" — 마지막 콜론 뒤 인용된 텍스트
    const trailingQuoted = description.match(/[:：]\s*["“”]([\s\S]+?)["“”]\s*$/);
    if (trailingQuoted?.[1]?.trim()) {
      return cleanInstagramCaptionCandidate(trailingQuoted[1]);
    }
    // Instagram이 캡션을 자르며 닫는 따옴표를 생략하는 경우:
    // `조회 346K회, 좋아요 5,021개: "실제 캡션...`
    const trailingOpenQuote = description.match(/[:：]\s*["“”]([\s\S]+)$/);
    if (trailingOpenQuote?.[1]?.trim()) {
      return cleanInstagramCaptionCandidate(trailingOpenQuote[1]);
    }
    // "... on Instagram: 캡션 내용" (따옴표 없는 경우)
    const colonMatch = description.match(/on Instagram:\s*(.+)$/s);
    if (colonMatch?.[1]?.trim() && colonMatch[1].trim().length > 10) {
      return cleanInstagramCaptionCandidate(colonMatch[1]);
    }
  }

  // 2. HTML 내 embedded JSON 추출은 추천 게시물 캡션과 섞일 위험이 있어
  //    별도 함수 `extractInstagramCaptionFromHtml(html, baseUrl)`에서 shortcode 컨텍스트로 처리한다.

  return undefined;
}

function cleanInstagramCaptionCandidate(raw: string) {
  const candidate = (decodeJsonString(raw) ?? raw.trim()).trim();
  if (!candidate || candidate.includes('\uFFFD')) return undefined;
  return candidate;
}

// 봇 차단/로그인 게이트/통계 텍스트 등 콘텐츠로 부적합한 메타데이터 패턴.
// title과 description 양쪽 모두에 사용.
const BAD_METADATA_GENERIC_PATTERNS: RegExp[] = [
  /^Threads\s*[•·]\s*Log\s*in$/i,
  /^Threads\s*[•·]\s*로그인$/i,
  /^로그인\s*[•·]\s*Threads$/i,
  /^Just\s*a\s*moment(\.{0,3})?$/i,
  /^Login\s*[•·]/i,
  /^Log\s*in\s*[•·]/i,
  /^Sign\s*in\s*[•·]/i,
  /^Threads$/i,
  /^TikTok$/i,
  /^LinkedIn$/i,
  /^Instagram$/i,
  /^Medium$/i,
  /^Twitter$/i,
  /^X\s*\/\s*\?$/i,
  /^네이버\s*블로그$/i,
  /^블로그\s*::\s*네이버$/i,
  /^TikTok\s*[-—]\s*Make\s*Your\s*Day$/i,
  /^Visit\s*TikTok\s*to\s*discover/i,
  /^Watch,\s*follow,\s*and\s*discover/i,
  /^Join\s*Threads\s*to\s*share/i,
  /^Top\s*Career\s*Content\s*from\s*LinkedIn/i,
  /^Explore\s*top\s*LinkedIn/i,
];

const BAD_METADATA_NONANCHORED_PATTERNS: RegExp[] = [
  /(?:views?|조회)\s*[\d,.KM만천]+/i,
  /(?:likes?|좋아요)\s*[\d,.KM만천]+/i,
  /(?:comments?|댓글)\s*[\d,.KM만천]+/i,
];

export function isBadMetadataText(value?: string | null) {
  if (!value) return false;
  if (value.includes('\uFFFD')) return true;
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (BAD_METADATA_GENERIC_PATTERNS.some((p) => p.test(trimmed))) return true;
  if (BAD_METADATA_NONANCHORED_PATTERNS.some((p) => p.test(trimmed))) return true;
  return false;
}

/** baseUrl의 shortcode와 같은 객체 블록에 속한 caption.text를 추출. 추천 게시물 캡션 오염 방지. */
function extractInstagramCaptionFromHtml(html: string, baseUrl: string): string | undefined {
  const shortcode = extractInstagramShortcode(baseUrl);
  if (!shortcode) return undefined;
  const esc = escapeRegex(shortcode);

  // Instagram fb 응답에는 추천 게시물 caption도 함께 들어온다.
  // 현재 콘텐츠 객체는 응답 구조에 따라 code 앞/뒤에 caption이 올 수 있으므로,
  // 반드시 URL shortcode와 같은 media 객체 안의 caption만 매치한다.
  const fields = ['code', 'shortcode'];
  for (const field of fields) {
    const m = html.match(new RegExp(
      `"__isXIGPolarisMedia"\\s*:\\s*"[^"]+"[\\s\\S]{0,300}?"${field}"\\s*:\\s*"${esc}"[\\s\\S]{0,2500}?"caption"\\s*:\\s*\\{[^}]*?"text"\\s*:\\s*"((?:[^"\\\\]|\\\\.)+?)"`,
    ));
    if (m?.[1]) {
      const decoded = decodeJsonString(m[1]);
      if (decoded) return decoded;
    }
  }

  for (const field of fields) {
    const m = html.match(new RegExp(
      `"caption"\\s*:\\s*\\{[^}]*?"text"\\s*:\\s*"((?:[^"\\\\]|\\\\.)+?)"[\\s\\S]{0,1500}?"${field}"\\s*:\\s*"${esc}"`,
    ));
    if (m?.[1]) {
      const decoded = decodeJsonString(m[1]);
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
