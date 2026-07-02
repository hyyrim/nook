import { Linking } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

// Instagram은 공개 deep-link scheme이 빈약하다. 게시물용 비공식 스킴 `instagram://media?id=<numeric>`은
// shortcode(`/p|reel|tv|reels/<shortcode>`)를 64진수 디코딩해 얻는 media ID로 호출해야 한다.
// 비공식이지만 다년간 안정적이며, 인스타 앱이 강제종료된 상태에서 Universal Link로 진입했을 때
// 앱이 URL을 잃어버리고 홈 피드로 빠지는 cold-start 버그를 우회할 수 있다.
const INSTAGRAM_HOSTS = new Set(['instagram.com', 'www.instagram.com']);
const INSTAGRAM_SHORTCODE_RE = /^\/(?:p|reel|reels|tv)\/([A-Za-z0-9_-]+)/;
const INSTAGRAM_SHORTCODE_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

function instagramMediaIdFromUrl(url: string): string | undefined {
  let shortcode: string | undefined;
  try {
    const m = new URL(url).pathname.match(INSTAGRAM_SHORTCODE_RE);
    shortcode = m?.[1];
  } catch {
    return undefined;
  }
  if (!shortcode) return undefined;

  let id = 0n;
  for (const ch of shortcode) {
    const idx = INSTAGRAM_SHORTCODE_ALPHABET.indexOf(ch);
    if (idx < 0) return undefined;
    id = id * 64n + BigInt(idx);
  }
  return id.toString();
}
const X_HOSTS = new Set(['x.com', 'www.x.com', 'twitter.com', 'www.twitter.com']);
// notion.so / notion.com 본진과 모든 서브도메인 (`app.notion.com` 포함)
// — Notion이 공유 링크 형식을 늘려가면서 호스트가 다양해지는 걸 한 번에 흡수.
const NOTION_APP_RE = /(^|\.)notion\.(so|com)$/i;
const NOTION_SITE_RE = /(^|\.)notion\.site$/i;

const APP_SCHEMES: { match: (host: string) => boolean; toAppUrl: (url: URL) => string; scheme: string }[] = [
  {
    match: (h) => ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be'].includes(h),
    toAppUrl: (url) => `youtube://${url.pathname}${url.search}`,
    scheme: 'youtube',
  },
  {
    match: (h) => ['blog.naver.com', 'm.blog.naver.com'].includes(h),
    toAppUrl: () => 'naverblog://',
    scheme: 'naverblog',
  },
  {
    match: (h) => h.endsWith('naver.com'),
    toAppUrl: () => 'naversearchapp://',
    scheme: 'naversearchapp',
  },
  {
    match: (h) => ['tiktok.com', 'www.tiktok.com'].includes(h),
    toAppUrl: (url) => `tiktok://open${url.pathname}`,
    scheme: 'tiktok',
  },
  {
    match: (h) => ['threads.net', 'www.threads.net'].includes(h),
    toAppUrl: (url) => `threads://open${url.pathname}`,
    scheme: 'threads',
  },
  {
    match: (h) => ['linkedin.com', 'www.linkedin.com'].includes(h),
    toAppUrl: (url) => `linkedin://open${url.pathname}`,
    scheme: 'linkedin',
  },
];

export async function openInAppOrBrowser(urlString: string) {
  let host = '';
  try {
    host = new URL(urlString).hostname.toLowerCase();
  } catch {}

  if (INSTAGRAM_HOSTS.has(host)) {
    try {
      const hasApp = await Linking.canOpenURL('instagram://app');
      if (hasApp) {
        // 1순위: instagram://media?id=<numeric> — shortcode를 64진수 디코딩한 media ID로 직접 호출.
        // 강제종료 직후 cold start 케이스에서도 게시물을 잃지 않고 정확히 진입.
        const mediaId = instagramMediaIdFromUrl(urlString);
        if (mediaId) {
          try {
            await Linking.openURL(`instagram://media?id=${mediaId}`);
            return;
          } catch {}
        }
        // 2순위: https URL → iOS Universal Link (앱이 warm일 때만 안정적)
        try {
          await Linking.openURL(urlString);
          return;
        } catch {}
      }
    } catch {}
    // 미설치 또는 모든 in-app 경로 실패: SFSafariViewController 인앱 브라우저로 — Safari 외부 이탈 방지
    try {
      await WebBrowser.openBrowserAsync(urlString);
      return;
    } catch {}
  }

  if (X_HOSTS.has(host)) {
    // twitter://open{path} can open the app without preserving the exact post.
    // Hand the HTTPS URL to iOS so X's Universal Link handler can route to the post.
    try {
      await Linking.openURL(urlString);
      return;
    } catch {}

    try {
      await WebBrowser.openBrowserAsync(urlString);
      return;
    } catch {}
  }

  if (NOTION_SITE_RE.test(host)) {
    // Public notion.site pages often bounce from the Notion app back to Safari.
    // Keep them in an in-app browser instead of forcing the app scheme.
    try {
      await WebBrowser.openBrowserAsync(urlString);
      return;
    } catch {}

    try {
      await Linking.openURL(urlString);
      return;
    } catch {}
  }

  if (NOTION_APP_RE.test(host)) {
    try {
      const parsed = new URL(urlString);
      const notionUrl = `notion://www.notion.so${parsed.pathname}${parsed.search}`;
      await Linking.openURL(notionUrl);
      return;
    } catch {}

    try {
      await Linking.openURL(urlString);
      return;
    } catch {}

    try {
      await WebBrowser.openBrowserAsync(urlString);
      return;
    } catch {}
  }

  try {
    const parsed = new URL(urlString);
    const entry = APP_SCHEMES.find((e) => e.match(host));

    if (entry) {
      const appUrl = entry.toAppUrl(parsed);
      const canOpen = await Linking.canOpenURL(appUrl);
      if (canOpen) {
        await Linking.openURL(appUrl);
        return;
      }
    }
  } catch {}

  await Linking.openURL(urlString);
}

export function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;

  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}일 전`;

  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}주 전`;

  const months = Math.floor(days / 30);
  return `${months}개월 전`;
}

// 썸네일 없을 때 카드/히어로 자리에 들어가는 단일 placeholder 색.
// 콘텐츠 ID별 무작위 색 대신 한 톤으로 통일해 화면 간 시각적 일관성을 유지한다.
// Recent / Category / Search / Rediscover / Content Detail 모두 이 값을 사용.
export const THUMBNAIL_PLACEHOLDER = '#DDD7CE';

const DOMAIN_LABELS: Record<string, string> = {
  'instagram.com': 'Instagram',
  'www.instagram.com': 'Instagram',
  'youtube.com': 'YouTube',
  'www.youtube.com': 'YouTube',
  'youtu.be': 'YouTube',
  'm.youtube.com': 'YouTube',
  'twitter.com': 'X',
  'www.twitter.com': 'X',
  'x.com': 'X',
  'www.x.com': 'X',
  'github.com': 'GitHub',
  'www.github.com': 'GitHub',
  'medium.com': 'Medium',
  'www.medium.com': 'Medium',
  'linkedin.com': 'LinkedIn',
  'www.linkedin.com': 'LinkedIn',
  'tiktok.com': 'TikTok',
  'www.tiktok.com': 'TikTok',
  'm.tiktok.com': 'TikTok',
  'vt.tiktok.com': 'TikTok',
  'vm.tiktok.com': 'TikTok',
  'threads.net': 'Threads',
  'www.threads.net': 'Threads',
  'threads.com': 'Threads',
  'www.threads.com': 'Threads',
  'velog.io': 'Velog',
  'brunch.co.kr': 'Brunch',
  'naver.com': 'Naver',
  'blog.naver.com': 'Naver Blog',
  'm.blog.naver.com': 'Naver Blog',
  'news.naver.com': 'Naver News',
  'n.news.naver.com': 'Naver News',
};

export function formatSource(domain?: string): string {
  if (!domain) return 'Unknown';
  const host = domain.toLowerCase();
  // notion.so / notion.com / notion.site의 모든 서브도메인(app.notion.com 등)을 "Notion"으로 통일
  if (NOTION_APP_RE.test(host) || NOTION_SITE_RE.test(host)) return 'Notion';
  return DOMAIN_LABELS[host] ?? domain.replace(/^www\./, '');
}

/**
 * 카드/상세에서 보여줄 제목. AI 분류/메타 백필 이전에도 URL 원문이 노출되지 않도록 도메인 라벨로 fallback.
 */
export function displayTitle(content: {
  title?: string | null;
  domain?: string | null;
  url?: string | null;
}): string {
  const trimmed = content.title?.trim();
  if (trimmed) return trimmed;
  if (content.domain) return formatSource(content.domain);
  if (content.url) {
    try {
      return formatSource(new URL(content.url).hostname);
    } catch {
      /* URL 파싱 실패 시 아래 fallback */
    }
  }
  return '링크';
}

