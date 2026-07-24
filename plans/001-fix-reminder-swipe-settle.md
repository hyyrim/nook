# 001 — 리마인더 스와이프 정착 폭 일치

- **Status**: REVERTED
- **Commit**: 263af76
- **Severity**: HIGH
- **Category**: Physicality
- **Estimated scope**: 1 file, 약 15줄 수정

## Problem

`app/reminders.tsx:207`의 right action은 삭제 버튼 76pt와 왼쪽 gap 8pt를 합친
84pt로 측정된다.

```tsx
const SWIPE_ACTION_WIDTH = 76;
const SWIPE_ACTION_GAP = 8;

const renderRightActions = () => (
  <View style={styles.swipeActionWrap}>
    <Pressable onPress={onDelete} style={styles.swipeAction}>
      <Ionicons name="trash-outline" size={17} color="#FFFFFF" />
      <Text style={styles.swipeActionText}>삭제</Text>
    </Pressable>
  </View>
);
```

```tsx
rightThreshold={40}
overshootRight={false}
friction={1}
```

```tsx
swipeActionWrap: {
  width: SWIPE_ACTION_WIDTH + SWIPE_ACTION_GAP,
  paddingLeft: SWIPE_ACTION_GAP,
  justifyContent: 'center',
  alignItems: 'flex-end',
},
```

`ReanimatedSwipeable`은 action 전체 측정 폭인 84pt를 열린 위치로 사용한다.
버튼은 76pt에서 이미 전부 보이므로 release 후 남은 8pt 정착이 버튼이 앞으로
튀는 것처럼 보인다. `friction={1}`은 드래그 추종만 바꾸며 정착 목표는 바꾸지 않는다.

## Target

action의 측정 폭과 삭제 버튼 폭을 모두 76pt로 일치시킨다. 별도 gap wrapper와
수동 threshold를 제거하고 `ReanimatedSwipeable`의 기본 threshold인 action 폭의
절반을 사용한다.

```tsx
const SWIPE_ACTION_WIDTH = 76;

const renderRightActions = () => (
  <Pressable onPress={onDelete} style={styles.swipeAction}>
    <Ionicons name="trash-outline" size={17} color="#FFFFFF" />
    <Text style={styles.swipeActionText}>삭제</Text>
  </Pressable>
);
```

```tsx
overshootRight={false}
friction={1}
```

```tsx
swipeAction: {
  width: SWIPE_ACTION_WIDTH,
  height: '100%',
  // 기존 색상, 정렬, radius 유지
},
```

## Repo conventions to follow

- 기존 `ReanimatedSwipeable`과 `GestureHandlerRootView`를 유지한다.
- 삭제 action의 색상, 아이콘, 텍스트 및 76pt 폭은 유지한다.
- `overshootRight={false}`와 `friction={1}`을 유지해 손가락을 1:1로 추종한다.

## Steps

1. `app/reminders.tsx`에서 `SWIPE_ACTION_GAP`을 삭제한다.
2. `renderRightActions`의 `swipeActionWrap`을 제거하고 `Pressable`을 직접 반환한다.
3. `rightThreshold={40}`을 제거해 action 측정 폭 절반인 기본 threshold를 사용한다.
4. `styles.swipeActionWrap`을 삭제한다.
5. `styles.swipeAction`의 76pt 폭과 `height: '100%'`는 유지한다.

## Boundaries

- `app/reminders.tsx` 외 파일을 수정하지 않는다.
- 삭제, undo, 다른 행 자동 닫기 로직을 변경하지 않는다.
- 새 dependency나 별도 gesture 구현을 추가하지 않는다.
- 현재 코드가 위 excerpt와 다르면 임의로 진행하지 말고 drift를 보고한다.

## Verification

- **Mechanical**: `npx tsc --noEmit`, `git diff --check`가 모두 성공해야 한다.
- **Feel check**: 실기기 Dev Client에서 행을 천천히 30pt, 50pt, 76pt 이상 각각
  스와이프한 뒤 놓는다.
  - 열리는 경우 카드 정착과 버튼 노출이 같은 프레임에 끝나야 한다.
  - 버튼이 전부 보인 뒤 카드가 추가로 8pt 이동하면 실패다.
  - 빠르게 열고 닫아도 버튼 위치가 역방향으로 튀지 않아야 한다.
- **Done when**: action 측정 폭이 76pt이고 release 후 별도 gap 정착이 보이지 않는다.
