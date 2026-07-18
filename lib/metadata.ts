export type LinkMetadata = {
  title?: string;
  thumbnail_url?: string;
  domain?: string;
  description?: string;
};

const META_TIMEOUT_MS = 8000;
const OEMBED_TIMEOUT_MS = 6000;

const INSTAGRAM_HOST_RE = /^(www\.)?instagram\.com$/i;
const INSTAGRAM_POST_RE = /^https?:\/\/(www\.)?instagram\.com\/(p|reel|reels|tv)\//i;
const INSTAGRAM_REEL_RE = /^https?:\/\/(www\.)?instagram\.com\/(reel|reels)\//i;
const YOUTUBE_HOST_RE = /^(www\.)?(youtube\.com|youtu\.be)$/i;
const X_HOST_RE = /^(www\.)?(x\.com|twitter\.com)$/i;
const NOTION_HOST_RE = /(^|\.)notion\.(so|site|com)$/i;

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
  { match: (h) => h === 'notion.so' || h.endsWith('.notion.so') || h === 'notion.site' || h.endsWith('.notion.site') || h === 'notion.com' || h.endsWith('.notion.com'), title: 'Notion 페이지' },
];

export function platformFallbackTitle(url: string): string | undefined {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '').toLowerCase();
    if (INSTAGRAM_REEL_RE.test(url)) return 'Instagram 릴스';
    if (NOTION_HOST_RE.test(host)) {
      return titleFromNotionUrl(url) ?? 'Notion 페이지';
    }
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

function isXUrl(url: string) {
  try {
    return X_HOST_RE.test(new URL(url).hostname);
  } catch {
    return false;
  }
}

function isNotionUrl(url: string) {
  try {
    return NOTION_HOST_RE.test(new URL(url).hostname);
  } catch {
    return false;
  }
}

function extractXStatusId(url: string): string | undefined {
  try {
    return new URL(url).pathname.match(/\/(?:i\/)?status(?:es)?\/(\d+)/)?.[1];
  } catch {
    return undefined;
  }
}

/**
 * iOS Safari share extension은 페이지 head의 메타 태그를 JavaScript preprocessing으로 추출해
 * `ShareIntent.meta`에 전달한다(클라이언트 렌더 후 상태 포함).
 * 이 객체를 기존 `parseMetadata` 파이프라인이 이해할 수 있는 가짜 HTML로 변환한다.
 * → generic/bad title 차단, <title> description 폴백 등 모든 가드를 그대로 재사용.
 *
 * meta.title 키는 Safari preprocessing 결과의 페이지 title(<title> 태그)이므로
 * `<title>` 요소로 변환한다. 나머지 og:* / twitter:* / name=* 키는 그대로 메타 태그로.
 */
function shareIntentMetaToHtml(meta: Record<string, string | undefined> | null | undefined): string {
  if (!meta) return '';
  const escape = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const parts: string[] = [];
  // title 키는 별도로 <title> 요소로 변환 (parseMetadata가 findTitle에서 활용)
  const titleValue = meta.title;
  if (typeof titleValue === 'string' && titleValue.length > 0) {
    parts.push(`<title>${escape(titleValue)}</title>`);
  }
  for (const [k, v] of Object.entries(meta)) {
    if (k === 'title') continue;
    if (typeof v !== 'string' || v.length === 0) continue;
    const attr = k.startsWith('og:') || k.startsWith('al:') || k.startsWith('fb:') ? 'property' : 'name';
    parts.push(`<meta ${attr}="${escape(k)}" content="${escape(v)}" />`);
  }
  return `<html><head>${parts.join('\n')}</head></html>`;
}

/** share intent meta가 OG 핵심 키를 하나라도 들고 있는지 — fetch 생략 판단 기준. */
function hasUsefulShareIntentMeta(meta: Record<string, string | undefined> | null | undefined): boolean {
  if (!meta) return false;
  return !!(
    meta['og:title'] ||
    meta['og:description'] ||
    meta['twitter:title'] ||
    meta['twitter:description'] ||
    meta.title
  );
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

export async function fetchLinkMetadata(
  url: string,
  options?: { shareIntentMeta?: Record<string, string | undefined> | null },
): Promise<LinkMetadata> {
  const normalizedUrl = normalizeUrl(url);
  const domain = getDomain(normalizedUrl);

  // Safari 공유 시 share extension이 클라이언트 렌더 후 head meta를 함께 전달한다.
  // 풍부한 OG가 있으면 fetch 생략하고 그 정보로 LinkMetadata 구성 — 서버 SSR이 누락하는
  // dynamic-injected meta(og:description 등)까지 살릴 수 있다.
  if (options?.shareIntentMeta && hasUsefulShareIntentMeta(options.shareIntentMeta)) {
    const fakeHtml = shareIntentMetaToHtml(options.shareIntentMeta);
    const parsed = parseMetadata(fakeHtml, normalizedUrl);
    if (isUsefulParsedMetadata(parsed, normalizedUrl)) {
      return { domain, ...parsed };
    }
  }

  const isInsta = isInstagramUrl(normalizedUrl);
  const isX = isXUrl(normalizedUrl);
  const isNotion = isNotionUrl(normalizedUrl);

  try {
    if (isNotion) {
      const notionMetadata = await fetchNotionPageMetadata(normalizedUrl);
      if (notionMetadata?.title) {
        return { domain, ...notionMetadata };
      }
    }

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
      if (isX) {
        const xMetadata = await fetchXPostMetadata(normalizedUrl);
        if (xMetadata) return { domain, ...xMetadata };
      }
      const fallback = platformFallbackTitle(normalizedUrl);
      return fallback ? { domain, title: fallback } : { domain };
    }
    const parsed = parseMetadata(html, normalizedUrl);
    if (isX && !isUsefulParsedMetadata(parsed, normalizedUrl)) {
      const xMetadata = await fetchXPostMetadata(normalizedUrl);
      if (xMetadata) {
        return {
          domain,
          ...xMetadata,
          thumbnail_url: parsed.thumbnail_url ?? xMetadata.thumbnail_url,
        };
      }
    }
    return { domain, ...parsed };
  } catch {
    if (isX) {
      const xMetadata = await fetchXPostMetadata(normalizedUrl);
      if (xMetadata) return { domain: getDomain(normalizedUrl), ...xMetadata };
    }
    const fallback = platformFallbackTitle(normalizedUrl);
    return fallback
      ? { domain: getDomain(normalizedUrl), title: fallback }
      : { domain: getDomain(normalizedUrl) };
  }
}

async function fetchNotionPageMetadata(url: string): Promise<Omit<LinkMetadata, 'domain'> | undefined> {
  const pageId = extractNotionPageId(url);
  if (!pageId) return undefined;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), META_TIMEOUT_MS);
  try {
    const response = await fetch('https://www.notion.so/api/v3/loadPageChunk', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'User-Agent': DEFAULT_FETCH_UA,
      },
      body: JSON.stringify({
        pageId,
        limit: 100,
        cursor: { stack: [] },
        chunkNumber: 0,
        verticalColumns: false,
      }),
    });
    if (!response.ok) return undefined;

    const data = await response.json();
    const blocks = getNotionBlocks(data);
    const page = blocks[pageId];
    if (!page) return undefined;

    const title = extractNotionPlainText(page.properties?.title) ?? titleFromNotionUrl(url);
    const description = extractNotionDescription(page, blocks);
    const cover = typeof page.format?.page_cover === 'string'
      ? absolutizeUrl(page.format.page_cover, 'https://www.notion.so')
      : undefined;

    return {
      title: cleanText(title),
      description: cleanMultilineText(description),
      thumbnail_url: cover,
    };
  } catch {
    return undefined;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchXPostMetadata(url: string): Promise<Omit<LinkMetadata, 'domain'> | undefined> {
  const id = extractXStatusId(url);
  if (!id) return undefined;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OEMBED_TIMEOUT_MS);
  try {
    const oembedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(`https://x.com/i/status/${id}`)}&omit_script=true`;
    const response = await fetch(oembedUrl, {
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'User-Agent': DEFAULT_FETCH_UA,
      },
    });
    if (!response.ok) return undefined;

    const data = await response.json();
    const html = typeof data?.html === 'string' ? data.html : '';
    const text = extractTextFromXEmbedHtml(html);
    if (!text) return undefined;

    const firstLine = text
      .split('\n')
      .map((line) => line.trim())
      .find((line) => line.length >= 3);

    return {
      title: firstLine ? cleanText(firstLine.length > 100 ? firstLine.slice(0, 100) + '…' : firstLine) : undefined,
      description: cleanMultilineText(text),
    };
  } catch {
    return undefined;
  } finally {
    clearTimeout(timeout);
  }
}

type NotionBlock = {
  id?: string;
  type?: string;
  properties?: Record<string, unknown>;
  content?: string[];
  format?: { page_cover?: string };
};

function getNotionBlocks(data: unknown): Record<string, NotionBlock> {
  const recordMap = (data as { recordMap?: { block?: Record<string, unknown> } })?.recordMap;
  const rawBlocks = recordMap?.block ?? {};
  const blocks: Record<string, NotionBlock> = {};

  for (const [id, record] of Object.entries(rawBlocks)) {
    const value = unwrapNotionRecord(record);
    if (value) blocks[id] = value;
  }

  return blocks;
}

function unwrapNotionRecord(record: unknown): NotionBlock | undefined {
  const first = (record as { value?: unknown })?.value;
  const second = (first as { value?: unknown })?.value;
  const candidate = (second ?? first) as NotionBlock | undefined;
  return candidate && typeof candidate === 'object' ? candidate : undefined;
}

function extractNotionDescription(page: NotionBlock, blocks: Record<string, NotionBlock>) {
  const lines: string[] = [];
  const visit = (ids?: string[]) => {
    if (!ids || lines.join('\n').length > 1800) return;

    for (const id of ids) {
      const block = blocks[id];
      if (!block) continue;

      const text = extractNotionBlockText(block);
      if (text) lines.push(text);

      if (block.content && block.type !== 'page') {
        visit(block.content);
      }

      if (lines.join('\n').length > 1800) break;
    }
  };

  visit(page.content);
  return lines.join('\n');
}

function extractNotionBlockText(block: NotionBlock) {
  if (!block.type || ['page', 'column', 'column_list', 'divider', 'breadcrumb'].includes(block.type)) {
    return undefined;
  }

  const title = extractNotionPlainText(block.properties?.title);
  if (!title) return undefined;

  if (block.type === 'bulleted_list') return `• ${title}`;
  if (block.type === 'numbered_list') return `- ${title}`;
  if (block.type === 'to_do') return `□ ${title}`;
  return title;
}

function extractNotionPlainText(property: unknown): string | undefined {
  if (!Array.isArray(property)) return undefined;

  const text = property
    .map((part) => {
      if (typeof part === 'string') return part;
      if (Array.isArray(part)) return typeof part[0] === 'string' ? part[0] : '';
      return '';
    })
    .join('')
    .replace(/\s+/g, ' ')
    .trim();

  return text || undefined;
}

function extractTextFromXEmbedHtml(html: string): string | undefined {
  const paragraph = html.match(/<p\b[^>]*>([\s\S]*?)<\/p>/i)?.[1];
  if (!paragraph) return undefined;

  const withLineBreaks = paragraph
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>\s*<p\b[^>]*>/gi, '\n\n');
  const withoutTags = withLineBreaks.replace(/<[^>]+>/g, '');
  return cleanMultilineText(decodeHtml(withoutTags));
}

function isUsefulParsedMetadata(metadata: Omit<LinkMetadata, 'domain'>, url: string) {
  if (metadata.description) return true;

  const fallback = platformFallbackTitle(url);
  return Boolean(
    metadata.title &&
    metadata.title !== fallback &&
    !isBadMetadataText(metadata.title) &&
    !isGenericPlatformTitle(metadata.title)
  );
}

// 콘텐츠 식별과 무관한 추적/공유 파라미터.
// 보존: v(YouTube 영상 ID), t(타임스탬프), list(플레이리스트), id 등 콘텐츠 식별자.
// 화이트리스트 대신 명시적 블랙리스트 — 알 수 없는 파라미터로 서로 다른 콘텐츠를
// 같은 것으로 오인해 데이터가 사라지는 사고를 막는다.
const TRACKING_PARAMS = new Set([
  'si',          // YouTube share ID — 공유 때마다 변경되어 중복 저장 유발
  'feature',     // YouTube 공유 출처
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'fbclid',      // Facebook click ID
  'gclid',       // Google click ID
  'igshid',      // Instagram share ID
  's',           // X(Twitter) 공유 source (예: ?s=46)
]);

// YouTube 영상 URL의 다양한 표기를 동일한 캐논 형태로 묶기 위한 도메인 집합.
// (music.youtube.com은 별도 플레이어 경험이라 보존 — 향후 중복 빈도 보고 결정.)
const YOUTUBE_VIDEO_HOSTS = new Set([
  'youtu.be',
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
]);

// 같은 영상이 youtu.be/<id>, www.youtube.com/watch?v=<id>, m.youtube.com/watch?v=<id>,
// youtube.com/shorts/<id> 같은 여러 형태로 들어와도 동일 row로 모이도록
// `https://www.youtube.com/watch?v=<id>` 캐논 폼으로 정규화한다.
// v= 값이 YouTube 표준 11자(A-Za-z0-9_-)가 아니면 미인식 URL로 보고 변형하지 않는다.
function canonicalizeYoutube(parsed: URL): URL | undefined {
  const host = parsed.hostname.toLowerCase();
  if (!YOUTUBE_VIDEO_HOSTS.has(host)) return undefined;

  let videoId: string | undefined;
  if (host === 'youtu.be') {
    videoId = parsed.pathname.match(/^\/([A-Za-z0-9_-]{11})/)?.[1];
  } else if (parsed.pathname === '/watch') {
    videoId = parsed.searchParams.get('v') ?? undefined;
  } else {
    videoId = parsed.pathname.match(/^\/shorts\/([A-Za-z0-9_-]{11})/)?.[1];
  }

  if (!videoId || !/^[A-Za-z0-9_-]{11}$/.test(videoId)) return undefined;

  const canonical = new URL('https://www.youtube.com/watch');
  canonical.searchParams.set('v', videoId);
  // v 외의 의미 있는 파라미터(t, list, index 등)는 보존
  for (const [key, value] of parsed.searchParams) {
    if (key === 'v') continue;
    canonical.searchParams.set(key, value);
  }
  return canonical;
}

export function normalizeUrl(url: string) {
  const trimmed = url.trim();
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const parsed = new URL(withScheme);

    for (const key of Array.from(parsed.searchParams.keys())) {
      if (TRACKING_PARAMS.has(key)) {
        parsed.searchParams.delete(key);
      }
    }

    const youtubeCanonical = canonicalizeYoutube(parsed);
    if (youtubeCanonical) return youtubeCanonical.toString();

    // searchParams.toString()이 빈 결과여도 '?'를 남기는 경우가 있어 수동 정리.
    const search = parsed.searchParams.toString();
    parsed.search = search ? `?${search}` : '';
    return parsed.toString();
  } catch {
    return withScheme;
  }
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
  const ogTitle = findMetaContent(html, ['og:title', 'twitter:title']);
  const titleTag = decodeHtml(findTitle(html) ?? '');
  const rawTitle = ogTitle ?? titleTag;

  const ogDescription =
    findMetaContent(html, ['og:description', 'twitter:description', 'description']);
  const xPostText = isXUrl(baseUrl) ? extractXPostTextFromTitle(titleTag) : undefined;
  const notionTitle = isNotionUrl(baseUrl) ? titleFromNotionUrl(baseUrl) : undefined;

  // Threads는 og:title이 항상 작성자 generic("X의 …(@handle)님")이고,
  // <title> 태그에 게시물 본문을 통째로 담는다.
  // <title>이 og:title과 다르고 generic/bad가 아니면 description 후보로 활용 →
  // 기존 description-as-title 폴백이 첫 줄을 title로, 전체를 description으로 처리한다.
  // 일반 사이트는 보통 <title> === og:title이므로 영향 없음.
  const titleTagUseful =
    !!titleTag &&
    !xPostText &&
    titleTag !== ogTitle &&
    !isGenericTitle(titleTag) &&
    !isBadMetadataText(titleTag);
  const description =
    xPostText ??
    (titleTagUseful && (!ogDescription || titleTag.length > ogDescription.length)
      ? titleTag
      : ogDescription);

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
  const isBadNotionMetadata = isNotionUrl(baseUrl) && isBadTitle;
  const canUseDescriptionForTitle = canUseDescription && !isBadNotionMetadata;

  // 제네릭/오염 제목이면 caption 또는 description에서 의미 있는 제목 추출
  let title = rawTitle;
  if ((!title || isGenericTitle(title) || isBadTitle) && (caption || xPostText || canUseDescriptionForTitle)) {
    const source = caption || xPostText || description!;
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

  if ((!title || isGenericTitle(title) || isBadTitle || title === 'Notion 페이지') && notionTitle) {
    title = notionTitle;
  }

  const thumbnail =
    findMetaContent(html, ['og:image', 'og:image:url', 'twitter:image', 'twitter:image:src']);

  return {
    title: cleanText(title),
    description: cleanMultilineText(
      caption ||
      fullDescription ||
      xPostText ||
      (isBadNotionMetadata ? undefined : (isBadDesc || isGenericDesc ? undefined : description)),
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

function extractXPostTextFromTitle(title: string): string | undefined {
  const match = title.match(/\bon\s+X:\s*["“”]([\s\S]+?)["“”]\s*\/\s*X\s*$/i);
  const candidate = match?.[1]?.trim();
  if (!candidate || candidate.includes('\uFFFD') || isGenericTitle(candidate)) return undefined;
  return candidate;
}

function titleFromNotionUrl(url: string): string | undefined {
  let pathname = '';
  try {
    pathname = decodeURIComponent(new URL(url).pathname);
  } catch {
    return undefined;
  }

  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 0) return undefined;

  const ignored = new Set([
    'desktop',
    'download',
    'help',
    'login',
    'mobile',
    'product',
    'templates',
  ]);

  for (let i = segments.length - 1; i >= 0; i--) {
    const raw = segments[i];
    if (ignored.has(raw.toLowerCase())) continue;

    const withoutQueryish = raw.split('?')[0].split('#')[0];
    const withoutUuid = withoutQueryish
      .replace(/[-_]?([0-9a-f]{32})$/i, '')
      .replace(/[-_]?([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i, '');

    const title = withoutUuid
      .replace(/[-_]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (title && !/^[0-9a-f-]{16,}$/i.test(title)) {
      return title;
    }
  }

  return undefined;
}

function extractNotionPageId(url: string): string | undefined {
  let pathname = '';
  try {
    pathname = decodeURIComponent(new URL(url).pathname);
  } catch {
    return undefined;
  }

  const match = pathname.match(/([0-9a-f]{32}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i);
  if (!match?.[1]) return undefined;

  const raw = match[1].replace(/-/g, '').toLowerCase();
  return raw.replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, '$1-$2-$3-$4-$5');
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
  /^Notion$/i,
  /^Notion\s*\|/i,
  /^Page\s*not\s*found$/i,
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
  /^A\s*collaborative\s*AI\s*workspace/i,
  /^Notion\s*[–—-]\s*The\s*AI\s*workspace/i,
  /^The\s*AI\s*workspace\s*that\s*works\s*for\s*you\.?\s*\|\s*Notion$/i,
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
