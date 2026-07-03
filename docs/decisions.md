# 의사결정 로그

> 현재 진행 중인 Phase의 기술/디자인/UX 의사결정을 기록합니다.
> 완료된 Phase 기록은 `docs/archive/`에서 확인합니다.
> 포맷: **결정** → **배경** → **결과** (필요 시 **대안 검토**, **교훈** 추가)

Archived records:
- Phase 1: `docs/archive/decisions-phase-1.md` (001~054)
- Phase 2 part 1: `docs/archive/decisions-phase-2-part-1.md` (055~076)

---

## 077. Anthropic API 키 서버 이전 — Edge Function classify (2026-07-03)

**결정**: 클라이언트 번들에 노출되던 Anthropic API 호출을 Supabase Edge Function `classify`로 이전하고, 앱에서는 `supabase.functions.invoke('classify')`만 호출한다.

**배경**: `EXPO_PUBLIC_ANTHROPIC_API_KEY`는 Expo 빌드 시 앱 번들에 인라인되므로 secret 저장에 부적합하다. Codex/Claude 보안 리뷰에서 IPA 추출 가능성이 확인되어 기존 키를 revoke하고 서버 전용 키로 교체해야 했다.

**결과**:
- 기존 Anthropic 키를 revoke하고 EAS production env 및 로컬 `.env`에서 public 키를 제거했다.
- 새 서버 전용 키를 Supabase Edge Function secret으로 등록했다.
- `supabase/functions/classify/index.ts`를 추가해 JWT 인증, 사용자 카테고리 조회, 프롬프트 구성, Anthropic 호출, 결과 파싱을 서버에서 처리한다.
- `lib/ai.ts`는 직접 Anthropic fetch 대신 `classify` Edge Function 호출로 변경했다.
- 클라이언트에서 API 키와 프롬프트 로직을 제거했고, 기존 fail-silent 계약은 유지했다.

**대안 검토**:
- 클라이언트 키 유지: 보안상 불가.
- EAS Update만으로 hotfix: 이미 노출된 키는 revoke가 필요하고, 바이너리 내 public env 구조 자체를 제거해야 하므로 서버 이전이 필요.

**교훈**: Expo public env는 설정값용이지 secret 저장소가 아니다. AI 호출처럼 키가 필요한 기능은 MVP라도 서버 경유 구조로 두는 편이 안전하다.

---

## 078. Content Detail 관련 콘텐츠 복귀 깜빡임 제거 (2026-07-03)

**결정**: Content Detail의 콘텐츠/관련 콘텐츠 로드는 id 변경 시에만 실행하고, `viewed_at` 업데이트와 `content_opened` 이벤트만 focus 진입마다 유지한다.

**배경**: PR #48에서 `useFocusEffect`로 로드를 묶으면서, 관련 콘텐츠 상세로 들어갔다가 뒤로가기 했을 때 이전 화면의 관련 콘텐츠가 `setRelated([])`로 비워진 뒤 다시 렌더링되어 skeleton 깜빡임이 보였다.

**결과**:
- 콘텐츠 본문과 관련 콘텐츠 로드는 `useEffect([id, session, isAuthLoading])` 기반으로 이동했다.
- `viewed_at` 업데이트와 analytics 이벤트는 `useFocusEffect`에 남겨 focus 진입마다 동작하게 했다.
- 뒤로가기 복귀 시 이전 상세 화면의 관련 콘텐츠 리스트가 유지된다.

**교훈**: focus마다 실행해야 하는 부수효과와 id 변경 때만 필요한 데이터 로드는 분리해야 한다. 같은 화면에 있어도 UX 안정성 요구가 다르다.

---

## 079. 리포트 미분류 카운트 전체 기준 고정 (2026-07-03)

**결정**: 리포트의 미분류 알림 카운트는 기간 필터와 무관하게 현재 전체 미분류 개수를 표시한다.

**배경**: 미분류 알림 CTA는 전체 미분류 폴더(`/category/uncategorized`)로 이동하지만, 기존 카운트는 선택 기간 내 미분류만 집계했다. 그 결과 오래된 미분류가 있어도 `일주일` 같은 짧은 기간에서는 알림이 사라지는 문제가 있었다.

**결과**:
- `getUncategorizedCount` 경량 count 쿼리를 추가했다.
- ReportView의 window 종속 `uncategorizedCount` 필드를 제거하고 별도 상태로 관리한다.
- 기간 전환과 무관하게 미분류 알림 카운트가 전체 미분류 폴더 개수와 맞는다.
- 기록 부족 상태에서는 기존 정책대로 알림을 숨긴다.

**교훈**: 알림의 숫자는 이동 대상과 같은 기준이어야 한다. CTA가 전체 폴더로 이동한다면 카운트도 전체 기준이어야 사용자가 납득한다.

---

## 080. MoveCategorySheet fetch를 애니메이션 이후로 지연 (2026-07-03)

**결정**: `MoveCategorySheet`가 열릴 때 카테고리 fetch를 즉시 실행하지 않고, `InteractionManager.runAfterInteractions`로 시트 등장 애니메이션 이후 실행한다.

**배경**: 시트 진입과 동시에 `getCategories` fetch가 시작되면서 첫 등장 프레임과 경합해 바텀시트가 버벅여 보였다. 이 시트는 목록 fetch가 작으므로, 등장 애니메이션을 먼저 확보하는 편이 체감 품질에 유리하다.

**결과**:
- `visible=true` 후 fetch를 interaction 완료 뒤 실행하도록 조정했다.
- 시트가 빠르게 닫히면 cleanup에서 task를 cancel해 낭비와 경고를 방지한다.
- Category Detail 선택 모드와 Content Detail 카테고리 변경 시트 모두 같은 체감 개선을 받는다.

**대안 검토**:
- parent에서 categories prefetch 후 prop 전달: 가장 빠르지만 호출부 복잡도가 늘어난다. 현재는 fetch 지연만으로 충분한지 먼저 검증한다.

**교훈**: 작은 네트워크 요청도 애니메이션 첫 프레임과 겹치면 크게 느껴진다. 바텀시트는 데이터보다 진입 프레임을 먼저 안정화하는 편이 자연스럽다.

---

## 081. Radius 시맨틱 스케일과 press overlay 토큰 도입 (2026-07-03)

**결정**: 반복되는 borderRadius와 밝은 배경 pressed overlay를 토큰화해 디자인 시스템 기준으로 관리한다.

**배경**: 카드, 버튼, 시트, 칩 등에서 12/16/20/100 같은 반경 값이 하드코딩되어 있었다. PrimaryButton 등 공통 컴포넌트를 만들기 전에 반경과 pressed overlay 기준을 먼저 정리해야 했다.

**결과**:
- `constants/radius.ts`에 `xs/sm/md/lg/xl/pill` 시맨틱 스케일을 추가했다.
- `Colors.pressOverlay`를 추가해 밝은 배경 위 pressed 상태를 공통 토큰으로 관리한다.
- 버튼/카드/시트 중심의 20개 파일에서 의미가 명확한 radius 값을 토큰으로 이관했다.
- 특수 시각 의도가 있는 edge 값은 raw 값으로 유지했다.

**대안 검토**:
- 모든 숫자 반경 일괄 치환: 특수 UI의 비율 의도를 깨뜨릴 수 있어 배제.
- 토큰 없이 파일별 유지: 단기 변경은 적지만 디자인 drift가 계속 누적됨.

**교훈**: 토큰화는 모든 숫자를 없애는 작업이 아니다. 의미가 반복되는 값만 이름을 주고, 특수한 값은 의도를 유지하는 균형이 필요하다.

---

## 082. PrimaryButton 공통 CTA 컴포넌트 추출 (2026-07-03)

**결정**: 주요 CTA 버튼 스타일을 `components/PrimaryButton.tsx`로 공통화하고, 저장/수정/추가/재시도 등 반복되는 primary 액션을 해당 컴포넌트로 마이그레이션한다.

**배경**: SaveBottomSheet, CategoryBottomSheet, TagsSheet, ContentTitleSheet, choose-interests 등에서 CTA 스타일과 disabled/loading 처리가 중복되어 있었다. 반경 토큰과 press overlay가 정리된 뒤, CTA도 한 컴포넌트에서 크기와 상태를 관리하는 편이 유지보수에 안전하다.

**결과**:
- `PrimaryButton`은 `variant`, `size`, `loading`, `disabled`, `fullWidth`, `style`, `labelStyle`을 지원한다.
- large/small 두 사이즈로 시트 CTA와 small retry 버튼을 커버한다.
- `accessibilityRole="button"`과 disabled/busy 상태를 컴포넌트 내부에서 자동 반영한다.
- 기존 7개 시트/화면의 중복 CTA 스타일을 제거했다.
- Apple/Google 로그인 버튼은 아이콘+텍스트가 결합된 auth provider 전용 패턴이라 이번 공통화 범위에서 제외했다.

**대안 검토**:
- 각 화면 스타일 유지: 변경 범위는 작지만 disabled/loading/accessibility 정책이 계속 흩어짐.
- icon slot까지 포함한 범용 버튼: 확장성은 높지만 현재 MVP 범위에서는 API가 과해짐. auth provider 버튼은 별도 컴포넌트로 남기는 편이 명확함.

**교훈**: 버튼 공통화는 색상/반경 토큰 다음 단계에서 하는 편이 안정적이다. 토큰이 먼저 잡혀 있어야 공통 컴포넌트가 새 디자인 기준을 강제하는 역할을 할 수 있다.

---

## 083. 출시 전 정책 문서 정합성 정리 (2026-07-03)

**결정**: App Store 제출 전 개인정보처리방침과 서비스 이용약관을 현재 앱의 실제 데이터 처리 범위와 계정 삭제 경로에 맞게 갱신한다.

**배경**: Nook는 Supabase Auth/DB, Apple/Google 로그인, Anthropic 기반 AI 분류, 자체 분석 이벤트를 사용한다. 출시 문서는 실제 수집/처리/삭제 흐름과 맞아야 하며, 앱 내 계정 삭제 경로도 문서에 반영되어야 한다.

**결과**:
- 개인정보처리방침 최종 업데이트일을 2026-07-03으로 갱신했다.
- 계정 정보, 저장 콘텐츠, 사용자 설정/카테고리, 분석 이벤트, AI 처리, 제3자 제공자 범위를 현재 구현 기준으로 정리했다.
- 광고 식별자/제3자 광고 SDK 미사용, 개인정보 판매 미사용을 명시했다.
- 서비스 이용약관에 링크 메타데이터 처리, AI 보조 기능, 제3자 콘텐츠, 계정 삭제 및 면책 범위를 보강했다.
- 계정 삭제 경로를 `Profile → 계정 설정 → 계정 삭제하기`로 맞췄다.

**교훈**: 정책 문서는 출시 직전 한 번 작성하고 끝나는 문서가 아니라, 실제 앱 기능과 데이터 흐름이 바뀔 때 함께 따라와야 하는 운영 문서다.

---

## 084. Category Detail 헤더 검색 영역 재배치 (2026-07-03)

**결정**: Category Detail 일반 모드 헤더를 `NavHeader → SearchBar → 저장 개수/뷰 타입 버튼 → 콘텐츠 리스트` 순서로 재배치한다. 선택 모드에서는 검색/저장 개수/뷰 타입 영역을 숨기고 선택 액션 흐름만 보여준다.

**배경**: 기존 배치는 저장 개수와 뷰 타입 버튼이 검색창보다 먼저 노출되어, 폴더 안에서 찾는 주요 행동보다 보조 정보가 먼저 보이는 느낌이 있었다. 사용자가 제시한 시뮬레이터 화면 기준으로 검색을 상단에 두고, 저장 개수와 뷰 타입은 그 아래 보조 줄로 두는 편이 시각 흐름이 자연스럽다.

**결과**:
- `app/category/[id].tsx`에서 일반 모드 headerSection 순서를 SearchBar 우선으로 변경했다.
- 저장 개수와 grid/list 토글은 SearchBar 아래 한 줄에 유지했다.
- 선택 모드에서는 headerSection 자체를 렌더링하지 않아 `취소 / 항목 선택 / 전체 선택` 아래로 바로 콘텐츠 리스트가 이어진다.
- 검색 로직, 뷰 타입 저장 로직, 콘텐츠 리스트 렌더링 로직은 변경하지 않았다.

**교훈**: 상세 화면의 헤더 보조 정보는 모드별 우선순위가 다르다. 일반 모드에서는 탐색/검색이 우선이고, 선택 모드에서는 선택 상태와 일괄 액션이 우선이다.

---

## 085. 카테고리 순서 편집 안정화와 입력창 높이 고정 (2026-07-03)

**결정**: 카테고리 순서 편집에서 드래그 후 정렬 반영과 저장 안정성을 보강하고, 카테고리 추가/수정 바텀시트의 TextInput 높이를 고정한다.

**배경**: `react-native-draggable-flatlist`는 `onDragEnd`를 드롭 애니메이션 완료 후 호출한다. 이 때문에 드래그 후 실제 상태 반영이 늦어 보이고, 사용자가 빠르게 저장할 경우 이전 순서가 저장될 위험이 있었다. 또한 CategoryBottomSheet의 TextInput은 고정 높이가 없어 입력 중 intrinsic height가 변하면서 시트가 흔들릴 수 있었다.

**결과**:
- `app/reorder-categories.tsx`:
  - 드롭 spring 설정을 조정해 정렬 반영 지연 체감을 줄였다.
  - 드래그 중에는 저장/취소 액션을 잠그고, `onDragEnd`에서 실제 순서를 반영한 뒤 잠금을 해제한다.
  - dirty 계산에 length 비교를 포함했다.
  - 인증 로딩 중 empty 상태가 먼저 보이지 않도록 `isAuthLoading` 분기를 조정했다.
  - row와 헤더 버튼에 접근성 role/state/label을 보강했다.
- `lib/api.ts`:
  - `reorderCategories`가 Supabase update 결과의 `error`를 확인하고 실패 시 throw한다.
  - 각 update에 `select('id').single()`을 붙여 실제 row 업데이트 여부를 확인한다.
- `components/CategoryBottomSheet.tsx`:
  - input에 `height: 44`, `paddingVertical: 0`, `textAlignVertical: 'center'`를 적용해 입력창 크기 변동을 막았다.
- 취소 시 변경사항 버리기 Alert는 의도적으로 추가하지 않는다. 기존 UX처럼 저장 중/드래그 중이 아니면 바로 뒤로 간다.

**대안 검토**:
- `onRelease`에서 즉시 순서를 저장: 드롭 애니메이션 전 데이터와 시각 상태가 어긋날 수 있어 배제.
- 저장 함수를 DB RPC로 원자화: 가장 안전하지만 스키마/함수 추가가 필요하다. MVP 안정화 범위에서는 클라이언트의 실패 감지를 먼저 보강했다.
- 취소 전 확인 Alert: 이전에 제거한 UX라 다시 도입하지 않음.

**교훈**: 드래그 UI는 손을 뗀 순간과 상태가 확정되는 순간이 다를 수 있다. 라이브러리의 이벤트 타이밍을 기준으로 저장 가능 시점을 잠그는 것이 시각 보정보다 중요하다.
