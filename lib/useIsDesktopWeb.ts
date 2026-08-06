import { Platform, useWindowDimensions } from 'react-native';

// 데스크탑 웹 판별 단일 소스. 사이드바 셸·화면별 반응형 분기가 공유해 임계값 드리프트를 막는다.
// (모바일 웹은 스코프 밖 — 이 폭 미만은 네이티브와 동일 레이아웃)
export const DESKTOP_MIN_WIDTH = 768;

// 데스크탑 콘텐츠 폭 상한 — 콘텐츠 상세와 동일. root 레이아웃의 콘텐츠 wrapper 한 곳에 적용해
// 모든 화면을 같은 폭으로 중앙 정렬(화면별 개별 적용 대신 단일화).
export const DESKTOP_CONTENT_MAX_WIDTH = 1040;

export function useIsDesktopWeb(): boolean {
  const { width } = useWindowDimensions();
  return Platform.OS === 'web' && width >= DESKTOP_MIN_WIDTH;
}
