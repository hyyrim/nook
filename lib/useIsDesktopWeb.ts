import { Platform, useWindowDimensions } from 'react-native';

// 데스크탑 웹 판별 단일 소스. 사이드바 셸·화면별 반응형 분기가 공유해 임계값 드리프트를 막는다.
// (모바일 웹은 스코프 밖 — 이 폭 미만은 네이티브와 동일 레이아웃)
export const DESKTOP_MIN_WIDTH = 768;

export function useIsDesktopWeb(): boolean {
  const { width } = useWindowDimensions();
  return Platform.OS === 'web' && width >= DESKTOP_MIN_WIDTH;
}
