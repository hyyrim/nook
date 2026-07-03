export type CategoryColorKey =
  | 'gray'
  | 'coral'
  | 'pink'
  | 'peach'
  | 'sand'
  | 'sage'
  | 'mint'
  | 'blue'
  | 'lavender';

// 사용자에게 노출되는 아이콘. 도메인별 그룹 순서로 정렬.
export const CATEGORY_ICON_PRESETS = [
  // 콘텐츠 성격
  'bookmark',
  'tag',
  'star',
  'heart',
  // AI / 개발
  'sparkles',
  'cpu',
  'code',
  'terminal',
  // 경제 / 비즈니스
  'trending-up',
  'briefcase',
  'coins',
  'target',
  // 커리어 / 학습
  'rocket',
  'graduation-cap',
  'book-open',
  'lightbulb',
  'pencil',
  // 디자인 / 사진
  'palette',
  'camera',
  'image',
  // 주거 / 인테리어
  'house',
  'sofa',
  // 여행 / 야외
  'plane',
  'map',
  'tent',
  // 음식 / 카페
  'utensils',
  'coffee',
  'wine',
  // 미디어
  'music',
  'clapperboard',
  'tv',
  'newspaper',
  // 운동 / 스포츠
  'dumbbell',
  'bike',
  'medal',
  // 자연 / 반려
  'leaf',
  'paw-print',
  // 쇼핑 / 취미
  'shopping-bag',
  'gift',
  'gamepad-2',
  'car',
] as const;

export type CategoryIconName = (typeof CATEGORY_ICON_PRESETS)[number] | 'folder' | 'inbox';

type ColorPreset = {
  key: CategoryColorKey;
  bg: string;
  tab: string;
};

// 뉴트럴 → 웜(코랄·핑크·피치·샌드) → 그린(세이지·민트) → 쿨(블루·라벤더) 순.
export const CATEGORY_COLOR_PRESETS: ColorPreset[] = [
  { key: 'gray',     bg: '#E8E8E8', tab: '#CCCCCC' },
  { key: 'coral',    bg: '#F5D5CE', tab: '#E8B4A8' },
  { key: 'pink',     bg: '#F3DDDE', tab: '#E8BBC0' },
  { key: 'peach',    bg: '#F0E0D5', tab: '#DDBEA9' },
  { key: 'sand',     bg: '#F4EBD6', tab: '#E8D8B8' },
  { key: 'sage',     bg: '#DFE5D5', tab: '#C6D0B5' },
  { key: 'mint',     bg: '#DDEBDF', tab: '#BFD8C2' },
  { key: 'blue',     bg: '#DDE8F1', tab: '#BBCDE0' },
  { key: 'lavender', bg: '#E7E0F1', tab: '#CEC2E3' },
];

export const CATEGORY_DEFAULT_BG = '#F7F7F7';
export const CATEGORY_DEFAULT_TAB = '#E5E4E4';

const COLOR_MAP: Record<string, ColorPreset> = Object.fromEntries(
  CATEGORY_COLOR_PRESETS.map((p) => [p.key, p]),
);

export function getCategoryColor(key?: string | null): { bg: string; tab: string } {
  if (!key || !(key in COLOR_MAP)) {
    return { bg: CATEGORY_DEFAULT_BG, tab: CATEGORY_DEFAULT_TAB };
  }
  return COLOR_MAP[key];
}

const CATEGORY_ICON_SET = new Set<string>(CATEGORY_ICON_PRESETS);

export function getCategoryIcon(icon?: string | null): CategoryIconName | null {
  if (!icon) return null;
  if (CATEGORY_ICON_SET.has(icon)) return icon as CategoryIconName;
  return null;
}

// 온보딩 기본 12개 카테고리 → 아이콘 매핑 (컬러는 사용자 선택에 맡김)
export const PRESET_CATEGORY_ICON_MAP: Record<string, CategoryIconName> = {
  AI: 'sparkles',
  '테크': 'cpu',
  '경제': 'trending-up',
  '비즈니스': 'briefcase',
  '커리어': 'rocket',
  '디자인': 'palette',
  '인테리어': 'house',
  '여행': 'plane',
  '음식': 'utensils',
  '음악': 'music',
  '영화': 'clapperboard',
  '운동': 'dumbbell',
};
