export function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;

  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;

  const months = Math.floor(days / 30);
  return `${months}mo ago`;
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
  { dark: '#1E1C2A', mid: '#2E2B40' },
  { dark: '#172128', mid: '#243240' },
  { dark: '#201E18', mid: '#342F24' },
  { dark: '#1A2020', mid: '#283434' },
  { dark: '#221A22', mid: '#382E38' },
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

export function rediscoverColors(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  return DARK_COLORS[Math.abs(hash) % DARK_COLORS.length];
}
