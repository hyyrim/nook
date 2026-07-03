export type CategoryColorKey =
  | 'gray'
  | 'sand'
  | 'peach'
  | 'pink'
  | 'red'
  | 'lavender'
  | 'blue'
  | 'mint'
  | 'slate';

export const CATEGORY_ICON_PRESETS = [
  'sparkles',
  'cpu',
  'trending-up',
  'briefcase',
  'rocket',
  'palette',
  'house',
  'plane',
  'utensils',
  'music',
  'film',
  'dumbbell',
  'book-open',
  'bookmark',
  'tag',
  'heart',
  'star',
  'camera',
  'leaf',
  'coffee',
  'bike',
  'gift',
  'pencil',
  'lightbulb',
] as const;

export type CategoryIconName = (typeof CATEGORY_ICON_PRESETS)[number] | 'folder' | 'inbox';

type ColorPreset = {
  key: CategoryColorKey;
  bg: string;
  tab: string;
};

export const CATEGORY_COLOR_PRESETS: ColorPreset[] = [
  { key: 'gray',     bg: '#E8E8E8', tab: '#CCCCCC' },
  { key: 'sand',     bg: '#F4EBD6', tab: '#E8D8B8' },
  { key: 'peach',    bg: '#F0E0D5', tab: '#DDBEA9' },
  { key: 'pink',     bg: '#F3DDDE', tab: '#E8BBC0' },
  { key: 'red',      bg: '#E8DDE2', tab: '#D1B8C2' },
  { key: 'lavender', bg: '#E7E0F1', tab: '#CEC2E3' },
  { key: 'blue',     bg: '#DDE8F1', tab: '#BBCDE0' },
  { key: 'mint',     bg: '#DDEBDF', tab: '#BFD8C2' },
  { key: 'slate',    bg: '#DDE3E5', tab: '#C1CACE' },
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

const LEGACY_IONICON_MAP: Record<string, CategoryIconName> = {
  'sparkles-outline': 'sparkles',
  'hardware-chip-outline': 'cpu',
  'trending-up-outline': 'trending-up',
  'briefcase-outline': 'briefcase',
  'rocket-outline': 'rocket',
  'color-palette-outline': 'palette',
  'home-outline': 'house',
  'airplane-outline': 'plane',
  'restaurant-outline': 'utensils',
  'musical-notes-outline': 'music',
  'film-outline': 'film',
  'barbell-outline': 'dumbbell',
  'book-outline': 'book-open',
  'bookmark-outline': 'bookmark',
  'pricetag-outline': 'tag',
  'heart-outline': 'heart',
  'star-outline': 'star',
  'camera-outline': 'camera',
  'leaf-outline': 'leaf',
  'cafe-outline': 'coffee',
  'bicycle-outline': 'bike',
  'gift-outline': 'gift',
  'pencil-outline': 'pencil',
  'bulb-outline': 'lightbulb',
};

const CATEGORY_ICON_SET = new Set<string>(CATEGORY_ICON_PRESETS);

export function getCategoryIcon(icon?: string | null): CategoryIconName | null {
  if (!icon) return null;
  if (CATEGORY_ICON_SET.has(icon)) return icon as CategoryIconName;
  if (icon in LEGACY_IONICON_MAP) return LEGACY_IONICON_MAP[icon];
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
  '영화': 'film',
  '운동': 'dumbbell',
};
