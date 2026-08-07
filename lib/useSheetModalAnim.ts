import { useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';
import { Colors } from '@/constants';

// 데스크탑 웹에서 바텀시트를 중앙 모달로 바꿀 때 쓰는 공용 모션 값 + 스타일.
// 모바일(바텀시트)의 translateY 애니메이션은 각 시트에 그대로 두고, 데스크탑일 때만
// 이 fade + subtle scale로 대체한다(제자리 등장/사라짐 — review-animations 표준 #5).
export function useSheetModalAnim(isDesktop: boolean) {
  const scale = useRef(new Animated.Value(isDesktop ? 0.96 : 1)).current;
  const opacity = useRef(new Animated.Value(isDesktop ? 0 : 1)).current;

  // 반환 객체를 안정 참조로 유지한다. Animated 값은 ref라 이미 안정적이고,
  // enter/exit도 여기서 고정해야 각 시트의 visible useEffect가 매 렌더마다 재실행되지 않는다.
  return useMemo(() => {
    const enter = () => [
      Animated.timing(opacity, { toValue: 1, duration: 160, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, damping: 22, stiffness: 230, mass: 0.9, useNativeDriver: true }),
    ];
    const exit = () => [
      Animated.timing(opacity, { toValue: 0, duration: 140, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(scale, { toValue: 0.97, duration: 140, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ];
    return { scale, opacity, enter, exit };
  }, [scale, opacity]);
}

// 각 시트의 backdrop/sheetContainer/sheet 스타일 배열에 `isDesktop && sheetModalStyles.*`로 끼운다.
export const sheetModalStyles = StyleSheet.create({
  backdropCentered: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  containerCentered: {
    maxWidth: 440,
  },
  sheetCentered: {
    borderRadius: 20,
    paddingTop: 22,
    paddingBottom: 22,
    backgroundColor: Colors.surface,
  },
});
