import type { Ionicons } from '@expo/vector-icons';

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

export type CategoryIconName = React.ComponentProps<typeof Ionicons>['name'];

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

export const CATEGORY_ICON_PRESETS: CategoryIconName[] = [
  'sparkles-outline',
  'hardware-chip-outline',
  'trending-up-outline',
  'briefcase-outline',
  'rocket-outline',
  'color-palette-outline',
  'home-outline',
  'airplane-outline',
  'restaurant-outline',
  'musical-notes-outline',
  'film-outline',
  'barbell-outline',
  'book-outline',
  'bookmark-outline',
  'pricetag-outline',
  'heart-outline',
  'star-outline',
  'camera-outline',
  'leaf-outline',
  'cafe-outline',
  'bicycle-outline',
  'gift-outline',
  'pencil-outline',
  'bulb-outline',
];

export function getCategoryIcon(icon?: string | null): CategoryIconName | null {
  if (!icon) return null;
  if ((CATEGORY_ICON_PRESETS as string[]).includes(icon)) return icon as CategoryIconName;
  return null;
}

// 온보딩 기본 12개 카테고리 → 아이콘 매핑 (컬러는 사용자 선택에 맡김)
export const PRESET_CATEGORY_ICON_MAP: Record<string, CategoryIconName> = {
  AI: 'sparkles-outline',
  '테크': 'hardware-chip-outline',
  '경제': 'trending-up-outline',
  '비즈니스': 'briefcase-outline',
  '커리어': 'rocket-outline',
  '디자인': 'color-palette-outline',
  '인테리어': 'home-outline',
  '여행': 'airplane-outline',
  '음식': 'restaurant-outline',
  '음악': 'musical-notes-outline',
  '영화': 'film-outline',
  '운동': 'barbell-outline',
};
