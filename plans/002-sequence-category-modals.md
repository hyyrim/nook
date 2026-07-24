# 002 — 카테고리 Modal 전환 직렬화

- **Status**: DONE
- **Commit**: 263af76
- **Severity**: HIGH
- **Category**: Interruptibility
- **Estimated scope**: 1 file, 약 35줄 수정

## Problem

`components/MoveCategorySheet.tsx:102`의 native `Modal` 내부에서
`CategoryBottomSheet`라는 두 번째 native `Modal`을 동시에 표시한다.

```tsx
<Modal visible={isMounted} transparent animationType="none" onRequestClose={onClose}>
  {/* MoveCategorySheet content */}
  <CategoryBottomSheet
    visible={showAddSheet}
    mode="add"
    existingNames={categories.map((c) => c.name)}
    onClose={() => setShowAddSheet(false)}
    onSubmit={handleAddCategory}
  />
</Modal>
```

프로젝트의 `app/content/[id].tsx:480`에도 여러 native Modal의 present/dismiss가
겹치면 orphan backdrop이 터치를 잡아 화면 먹통을 만들 수 있다고 기록되어 있다.

## Target

두 Modal을 sibling으로 렌더하고, MoveCategorySheet의 퇴장 완료(`onDismiss`) 후에만
CategoryBottomSheet를 연다. 사용자가 카테고리 생성을 취소하면 MoveCategorySheet를
다시 연다.

```tsx
<>
  <Modal
    visible={isMounted}
    transparent
    animationType="none"
    onDismiss={handleMoveSheetDismiss}
    onRequestClose={onClose}
  >
    {/* existing MoveCategorySheet content */}
  </Modal>
  <CategoryBottomSheet
    visible={showAddSheet}
    mode="add"
    existingNames={categories.map((c) => c.name)}
    onClose={handleAddSheetClose}
    onSubmit={handleAddCategory}
  />
</>
```

전환 상태는 boolean 하나로 제한한다.

```tsx
const [openAddAfterDismiss, setOpenAddAfterDismiss] = useState(false);
```

## Repo conventions to follow

- `components/ActionSheet.tsx:26`처럼 다음 native UI는 현재 Modal의 `onDismiss`
  이후에만 실행한다.
- 기존 180ms backdrop, spring `damping: 22`, `stiffness: 230`, `mass: 0.9`,
  190ms 퇴장 값은 변경하지 않는다.
- 기존 카테고리 생성과 선택 API 흐름을 유지한다.

## Steps

1. `CategoryBottomSheet`를 `Modal` 바깥 sibling으로 옮기고 최상위를 fragment로 감싼다.
2. `openAddAfterDismiss` 상태를 추가한다.
3. "새 카테고리 만들기" press에서 `openAddAfterDismiss=true`로 설정하고 기존
   MoveCategorySheet 퇴장 애니메이션을 시작한다. 퇴장 완료 후 `isMounted=false`가
   되도록 기존 close 경로를 재사용한다.
4. MoveCategorySheet `Modal.onDismiss`에서 `openAddAfterDismiss`가 true일 때만
   이를 false로 되돌리고 `showAddSheet=true`로 설정한다.
5. CategoryBottomSheet 취소 시 `showAddSheet=false`, `isMounted=true`로 바꾸고
   기존 MoveCategorySheet 진입 spring을 다시 시작한다.
6. 카테고리 생성 성공 시 기존 `handleAddCategory`와 `handleSelect` 흐름을 유지하고
   MoveCategorySheet를 다시 열지 않는다.

## Boundaries

- `components/MoveCategorySheet.tsx` 외 파일을 수정하지 않는다.
- 두 native Modal을 동시에 `visible=true`로 만들지 않는다.
- timeout으로 전환 순서를 맞추지 않는다. `onDismiss`만 사용한다.
- API 호출, 카테고리 데이터 구조, 시트 디자인을 변경하지 않는다.
- 현재 코드가 위 excerpt와 다르면 임의로 진행하지 말고 drift를 보고한다.

## Verification

- **Mechanical**: `npx tsc --noEmit`, `git diff --check`가 모두 성공해야 한다.
- **Feel check**: 실기기에서 콘텐츠 선택 → 카테고리 이동 → 새 카테고리 만들기를
  10회 반복한다.
  - MoveCategorySheet가 완전히 사라진 뒤 CategoryBottomSheet가 나타나야 한다.
  - 생성 취소 시 이전 카테고리 목록으로 자연스럽게 복귀해야 한다.
  - 전환 중 탭을 빠르게 반복해도 backdrop이 남거나 화면 터치가 막히면 실패다.
- **Done when**: 어느 프레임에도 두 native Modal이 동시에 표시되지 않고 생성,
  취소, 선택 흐름이 모두 유지된다.
