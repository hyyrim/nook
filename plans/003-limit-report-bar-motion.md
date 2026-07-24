# 003 — 리포트 막대 반복 모션 제한

- **Status**: REVERTED
- **Commit**: 263af76
- **Severity**: HIGH
- **Category**: Purpose & frequency
- **Estimated scope**: 1 file, 약 30줄 수정

## Problem

`app/(tabs)/report.tsx:103`에서 탭에 포커스가 올 때마다 animation key를 증가시킨다.

```tsx
useFocusEffect(
  useCallback(() => {
    setEntryAnimationKey((key) => key + 1);
    loadData();
  }, [loadData])
);
```

각 막대는 520ms 동안 움직이고 항목마다 55ms delay가 추가된다.

```tsx
Animated.timing(scale, {
  toValue: percentage / 100,
  duration: 520,
  delay: index * 55,
  easing: Easing.out(Easing.cubic),
  useNativeDriver: true,
});
```

6개 카테고리 기준 마지막 막대는 약 795ms 후 완료된다. 반복 방문하는 탭에서
매번 재생되며 시스템 reduced-motion 설정도 반영하지 않는다.

## Target

막대 모션은 최초 mount와 사용자가 기간을 바꾼 경우에만 실행한다. duration은
200ms, stagger는 항목당 15ms로 제한해 6개 기준 275ms 안에 완료한다.
reduced motion에서는 애니메이션 없이 최종 scale을 즉시 적용한다.

```tsx
const reduceMotion = useReducedMotion();
```

```tsx
<DistributionCard
  stats={view.distribution}
  animationKey={selectedWindowKey}
  reduceMotion={reduceMotion}
/>
```

```tsx
if (reduceMotion) {
  scale.setValue(percentage / 100);
  return;
}

scale.setValue(0);
const animation = Animated.timing(scale, {
  toValue: percentage / 100,
  duration: 200,
  delay: index * 15,
  easing: Easing.out(Easing.cubic),
  useNativeDriver: true,
});
```

## Repo conventions to follow

- 같은 파일의 dropdown이 사용하는 `useReducedMotion()` 분기 패턴을 따른다.
- 막대는 `scaleX`와 native driver를 유지해 layout width를 애니메이션하지 않는다.
- 데이터 조회와 기간 필터링 로직은 변경하지 않는다.

## Steps

1. `entryAnimationKey` state를 삭제한다.
2. `useFocusEffect`에서 `setEntryAnimationKey` 호출을 삭제하고 `loadData()`만 유지한다.
3. `ReportScreen`에서 `useReducedMotion()`을 호출한다.
4. `DistributionCard`와 `AnimatedProgressBar`에 `reduceMotion: boolean` prop을 전달한다.
5. animation key는 `selectedWindowKey`만 사용한다.
6. `AnimatedProgressBar`에서 reduced motion이면 최종 scale을 즉시 설정한다.
7. 일반 모션 duration을 200ms, delay를 `index * 15`로 변경한다.

## Boundaries

- `app/(tabs)/report.tsx` 외 파일을 수정하지 않는다.
- 리포트 데이터, 카테고리 분포 계산, UI 구조를 변경하지 않는다.
- width나 다른 layout 속성을 애니메이션하지 않는다.
- 새 dependency나 전역 motion token을 추가하지 않는다.
- 현재 코드가 위 excerpt와 다르면 임의로 진행하지 말고 drift를 보고한다.

## Verification

- **Mechanical**: `npx tsc --noEmit`, `git diff --check`가 모두 성공해야 한다.
- **Feel check**: 실기기에서 리포트 탭 진입, 다른 탭 이동, 리포트 재진입,
  기간 변경을 각각 확인한다.
  - 첫 진입과 기간 변경에서만 막대가 275ms 안에 완료되어야 한다.
  - 다른 탭에서 돌아왔을 때 막대가 0부터 다시 시작하면 실패다.
  - iOS의 동작 줄이기를 켜면 막대가 즉시 최종 길이로 표시되어야 한다.
- **Done when**: 탭 재포커스로 모션이 재실행되지 않고 reduced motion을 준수한다.
