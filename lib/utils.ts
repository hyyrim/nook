import { Linking } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

// Instagram은 게시물 deep-link용 공개 scheme이 없어(`instagram://app/reel/…`은 앱 홈으로 빠짐),
// SFSafariViewController(인앱 브라우저)로 라우팅한다.
const INSTAGRAM_HOSTS = new Set(['instagram.com', 'www.instagram.com']);

const APP_SCHEMES: { match: (host: string) => boolean; toAppUrl: (url: URL) => string; scheme: string }[] = [
  {
    match: (h) => ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be'].includes(h),
    toAppUrl: (url) => `youtube://${url.pathname}${url.search}`,
    scheme: 'youtube',
  },
  {
    match: (h) => ['twitter.com', 'www.twitter.com', 'x.com', 'www.x.com'].includes(h),
    toAppUrl: (url) => `twitter://open${url.pathname}`,
    scheme: 'twitter',
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
    // 앱 설치 시: https URL을 그대로 던져 iOS Universal Link로 Instagram 앱이 잡게 함
    // (instagram://app{path}는 path를 무시하고 홈으로 빠지므로 사용 X)
    try {
      const hasApp = await Linking.canOpenURL('instagram://app');
      if (hasApp) {
        await Linking.openURL(urlString);
        return;
      }
    } catch {}
    // 미설치: SFSafariViewController 인앱 브라우저로 — Safari 외부 이탈 방지
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

const PLACEHOLDER_COLORS = [
  '#DDD7CE', '#CAD8D4', '#D4CFE0', '#D0CEDB',
  '#CCDBD8', '#DDD9D0', '#DCCCD4', '#D4E0CC',
  '#CCE0D8', '#CCD8DC', '#D8D4CC', '#CDD4DC',
];

export function placeholderColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  return PLACEHOLDER_COLORS[Math.abs(hash) % PLACEHOLDER_COLORS.length];
}

const DARK_COLORS = [
  '#1E1C2A',
  '#172128',
  '#201E18',
  '#1A2020',
  '#221A22',
];

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
  'threads.net': 'Threads',
  'www.threads.net': 'Threads',
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
  return DOMAIN_LABELS[domain.toLowerCase()] ?? domain.replace(/^www\./, '');
}

export function rediscoverColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  return DARK_COLORS[Math.abs(hash) % DARK_COLORS.length];
}
