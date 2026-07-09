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

---

## 086. 프로필 계정 액션 배치 정리 (2026-07-03)

**결정**: 프로필 카드 전체를 계정 설정 진입점으로 사용하고, 로그아웃은 프로필 카드 바로 아래 단독 row로 배치한다. 계정 설정 화면에서는 로그아웃을 제거하고 계정 삭제하기만 낮은 강조도의 하단 액션으로 유지한다.

**배경**: 기존 프로필 화면에는 `계정 설정` row와 `로그아웃` row가 함께 있고, 계정 설정 화면에도 로그아웃이 있어 계정 액션이 중복됐다. 로그아웃은 자주 필요한 세션 액션이므로 1depth에서 찾기 쉬워야 하지만, 계정 삭제는 실수 방지를 위해 한 단계 안쪽에 두는 편이 안전하다.

**결과**:
- 프로필 카드에 chevron을 추가하고 탭 시 `/account-settings`로 이동한다.
- 프로필 화면의 `계정 설정` row를 제거했다.
- 로그아웃 row를 프로필 카드 바로 아래로 이동했다.
- 계정 설정 화면의 로그아웃 섹션을 제거하고 계정 정보와 계정 삭제하기만 남겼다.

**교훈**: 같은 계정 액션이라도 접근성 요구가 다르다. 로그아웃은 빠르게 찾을 수 있어야 하고, 계정 삭제는 의도 확인을 위해 더 깊은 위치에 두는 편이 UX와 안전성의 균형이 좋다.

---

## 087. 카테고리 아이콘 lucide 전환 (2026-07-03)

**결정**: 카테고리 프리셋 아이콘 렌더링을 Ionicons에서 `lucide-react-native`로 전환한다. 앱 전체 아이콘은 유지하고, 카테고리 아이콘에만 lucide를 적용한다.

**배경**: 카테고리 폴더/시트 아이콘은 브랜드 톤에 맞는 얇은 선형 아이콘이 더 적합하다. 다만 기존 DB에는 Ionicons 이름이 저장되어 있을 수 있으므로, 저장값 호환 없이 단순 교체하면 기존 카테고리 아이콘이 사라질 수 있다.

**결과**:
- `lucide-react-native`와 peer dependency인 `react-native-svg`를 추가했다.
- `CategoryIcon` 컴포넌트를 추가해 카테고리 아이콘 렌더링을 한 곳으로 모았다.
- 새 카테고리 아이콘 프리셋은 lucide key로 저장한다.
- 기존 Ionicons 저장값은 legacy map으로 lucide key에 매핑해 그대로 표시되게 했다.
- 폴더 카드, 카테고리 상세 헤더, 카테고리 추가/수정 시트, 카테고리 이동 시트, 순서 편집 화면의 카테고리 아이콘만 lucide로 전환했다.

**대안 검토**:
- 앱 전체 Ionicons 교체: 변경 범위가 크고 탭/내비게이션/시스템 액션 아이콘까지 재검증이 필요해 제외했다.
- DB 마이그레이션으로 기존 icon 값을 일괄 변경: 당장은 필요하지 않다. 렌더링 호환 매핑으로 기존 데이터를 보존하며 새 저장값만 lucide key로 전환한다.

**교훈**: 아이콘 라이브러리 변경은 시각 교체보다 저장값 호환이 더 중요하다. UI 프리셋 key와 렌더링 컴포넌트를 분리하면 추후 아이콘 세트를 다시 조정해도 DB 영향을 줄일 수 있다.

---

## 088. lucide-react-native 0.577.0 다운그레이드 + 아이콘 세트 확장 (2026-07-03)

**결정**: `lucide-react-native`를 `0.577.0`으로 다운그레이드해 정확 버전 pin, 카테고리 아이콘 프리셋을 12개 → 41개(도메인별 그룹)로 확장한다.

**배경**: `1.23.0`을 도입했으나 배럴 모듈이 Expo SDK 56 / Metro 0.84 환경에서 번들 실패했다. 근본 원인은 세 겹.

1. **`.mjs` 재export 사슬**: `dist/esm/lucide-react-native.mjs`가 `./icons/xxx.mjs`를 상대 경로로 재export 하는데, Metro 기본 `sourceExts`에 `mjs`가 빠져 있다.
2. **`exports` 필드가 존재하지 않는 파일을 가리킴**: `package.json`의 `exports["./icons"]`가 `dist/esm/icons/index.mjs` / `dist/cjs/icons/index.js`로 정의됐지만 두 파일 모두 패키지에 포함돼 있지 않다 (배포 자체가 손상).
3. **`unstable_enablePackageExports`가 default true (Metro 0.84)**: `exports` 필드가 강제되므로 `dist/cjs/icons/xxx.js` 같은 딥 import 우회도 리졸버 단계에서 차단된다.

즉 `1.23.0`은 barrel도, 서브패스도, 딥 import도 전부 막혀 있어 실질적으로 사용 불가능한 상태.

**결과**:
- `lucide-react-native@0.577.0`로 다운그레이드 (`--save-exact`). 0.577.0은 마지막 pre-v1 stable로 `.js` 재export 사슬, 존재하는 `./icons` 서브패스, 정상 배럴을 가진다.
- `CategoryIcon` 컴포넌트는 `import { Sparkles, Cpu, ... } from 'lucide-react-native'` 방식으로 필요한 43개(사용자 노출 41 + 내부용 `folder` / `inbox`)만 매핑. Metro tree-shaking으로 실제 번들에는 사용된 아이콘만 포함.
- `metro.config.js` 불필요 (`.mjs` sourceExts 확장 롤백).
- 아이콘 세트를 도메인별 12그룹으로 재구성: 콘텐츠 성격 / AI·개발 / 경제·비즈니스 / 커리어·학습 / 디자인·사진 / 주거 / 여행 / 음식 / 미디어 / 운동 / 자연·반려 / 쇼핑·취미.
- 온보딩 12개 매핑은 그대로 유지.
- **결정 087의 `LEGACY_IONICON_MAP`은 제거**. 카테고리 아이콘 기능(PR #31)이 v1.0.0(2026-06-25) 이후에 병합됐고, 이후 v1.1.x 빌드는 아직 배포 전이라 저자 테스트 계정 외에는 Ionicons 아이콘 값이 저장된 DB row가 없다. `getCategoryIcon`은 `CATEGORY_ICON_SET` 조회 한 갈래로 단순화.
- **`CategoryIcon` 컴포넌트는 namespace import 사용**: `import * as Lucide from 'lucide-react-native'` 후 `Lucide.Bookmark` 형태로 참조. named import 시 Metro/Hermes 조합에서 모든 아이콘이 동일 컴포넌트로 리솔브되는 현상이 관찰돼 namespace import로 각 참조를 명시.
- **카테고리 추가/수정 시트 레이아웃**: 아이콘 프리셋이 41개로 늘어 시트 전체가 지나치게 커지는 문제를 이름/색상/CTA는 고정, 아이콘 그리드만 자체 `ScrollView`로 분리해 해결. 상한은 `Math.min(161, maxSheetHeight - 360)` — 한 행 46px 기준 정확히 3.5행이 노출되게 잡아 4번째 행이 위쪽 절반만 보이는 **peek 패턴**을 만든다. 잘린 행이 "더 아래에 아이콘이 있다"는 시각적 힌트가 되어 별도 fade/스크롤바 조작 없이도 스크롤 가능성을 인지시킨다.

**대안 검토**:
- **`unstable_enablePackageExports: false` 전역 비활성화 + `1.23.0` 딥 import**: 리졸버 우회는 되지만 다른 패키지의 exports 필드도 함께 무시되어 리스크가 넓다.
- **`.mjs` sourceExts 확장 + `1.23.0` barrel**: 원인 1은 해결되지만 원인 2 (존재하지 않는 파일)가 남는다. 실제로 유저 환경에서 캐시 클리어 후에도 재현.
- **@expo/vector-icons Feather로 회귀**: `sparkles` 등 최신 아이콘 부재. 카테고리 표현력 감소.
- **`1.23.0` 유지 + 커스텀 resolver hook으로 딥 import 강제**: 가능하지만 브로큰 패키지에 workaround를 얹는 형태라 유지보수 부담.

**교훈**:
- 새 패키지를 도입할 때 최신 major가 반드시 stable은 아니다. 특히 `exports` 필드는 배포 스크립트 실수로 존재하지 않는 파일을 가리킬 수 있고, 이 경우 딥 import 우회도 Metro packageExports에 막힌다.
- 아이콘 라이브러리는 카테고리 UX의 확장성에 직접 영향. 초기 24~26개보다 도메인 그룹 40개 근처가 실제 유저 폴더 다양성을 흡수하기 좋다.

---

## 089. 카테고리 컬러칩 정리 (2026-07-03)

**결정**: 9개 유지, `red` → `coral`, `slate` → `sage`로 이름·톤 함께 교체. 배열 순서는 뉴트럴 → 웜(coral/pink/peach/sand) → 그린(sage/mint) → 쿨(blue/lavender)로 재정렬.

**배경**: 기존 9개 팔레트에서 두 가지 문제가 있었다.

1. `red`의 실제 값(`#E8DDE2`)은 dusty mauve라 이름과 톤이 어긋났고 `pink`와 시각적으로 거의 구분되지 않았다.
2. `slate`(`#DDE3E5`)는 `gray`(`#E8E8E8`)와 거의 같은 뉴트럴 계열이라 폴더 구분 용도로 기능이 약했다.

또 웜 뉴트럴이 4종(sand/peach/pink/red)으로 편중된 반면 그린 계열은 mint 하나뿐이었다.

**결과**:
- `red` → `coral` (`bg #F5D5CE / tab #E8B4A8`) — 진짜 웜 코랄 톤. `pink`(`#F3DDDE`)와 색조가 분명히 구분되도록 오렌지 기미를 실었다.
- `slate` → `sage` (`bg #DFE5D5 / tab #C6D0B5`) — 옐로우-그린 계열 sage. `mint`(`#DDEBDF`, 블루-그린 pastel)와 색조 차이가 명확하다.
- `CategoryColorKey` union 및 `CATEGORY_COLOR_PRESETS` 배열 수정. 다른 상수·컴포넌트는 key 문자열만 참조하므로 재렌더링 외 영향 없음.
- **DB 호환 매핑은 추가하지 않는다**. 카테고리 컬러 저장 기능도 카테고리 아이콘과 같은 미배포 시점(v1.1.x)에서 저자 테스트 계정에만 존재. 결정 087·088의 legacy 판단과 동일 근거.

**대안 검토**:
- 12개로 확장(옐로우/코랄/sage 추가, red·slate 제거): 색상환 균형은 좋지만 3×4 그리드 재배치·시트 높이 재조정 필요. 우선 이름 왜곡/중복 이슈만 해결.
- red 톤만 진짜 붉게 조정(이름 유지): 브랜드 pastel 톤과 어긋난다. coral 정도가 상한.

**교훈**: 팔레트에서는 key 이름과 실제 톤의 일치가 유저 예측 가능성에 직결된다. "red"가 실제 mauve로 저장되면 향후 다크 모드/컬러 로직 확장 시 혼란이 커진다.

---

## 090. 카테고리 순서 편집 드롭 모션 조정 (2026-07-03)

**결정**: 카테고리 순서 편집의 드롭 스프링을 더 빠르게 정착하도록 조정하고, 활성 row 강조를 조금 키운다. 함께 확인된 리포트 섹션 설명 문구의 마침표는 제거해 다른 화면의 짧은 설명 톤과 맞춘다.

**배경**: 기존 드롭 모션은 안전하게 멈추지만 마지막 tail이 약간 길어져 정렬 확정이 늦게 느껴질 수 있었다. 사용자가 손을 뗀 뒤 row가 자연스럽게 내려앉되 미세 진동 구간은 빨리 끝나는 쪽이 편집 화면의 조작감에 더 맞다.

**결과**:
- `DRAG_ANIMATION_CONFIG`의 stiffness/rest threshold를 높이고 overshoot clamping을 해제해 초기 가속과 소프트 정착감을 함께 확보했다.
- 드래그 중 row scale을 `1.03 → 1.05`로 키웠다.
- 활성 row shadow를 조금 더 강하게 조정했다.
- 리포트 `관심 분포`, `관련 주제` 설명 문구 끝 마침표를 제거했다.

**교훈**: 드래그 편집 UI는 데이터 저장 안정성뿐 아니라 손을 뗀 직후의 물리감도 중요하다. 저장 가능 시점은 유지하되, 시각적인 tail을 줄이면 조작이 더 즉각적으로 느껴진다.

---

## 090. 푸시 알림 DB 스키마 (2026-07-04)

**결정**: 푸시 알림 1차 범위(Forgotten + Rediscover)를 지원하기 위해 세 테이블 — `device_tokens`, `notification_settings`, `notification_logs` — 을 도입한다. 발송은 Supabase pg_cron이 매일 09:00 KST에 Edge Function `send-daily-notifications`를 호출해 서버에서 수행한다. 로컬 알림 스케줄링은 사용하지 않는다.

**배경**: 콘텐츠 데이터가 서버(Supabase)에 있으므로 "잊혀진 링크" 후보 계산과 사용자 관심 카테고리 기반 Rediscover 후보 계산은 서버가 담당해야 정확하다. 로컬 스케줄은 앱이 최근 실행돼야 계산이 가능해 재발견 목적과 어긋난다. 여러 기기 대응·발송 로그·중복 방지도 서버 단이 유리하다.

**결과**:
- `device_tokens`: 유저별 Expo Push Token upsert. `(user_id, expo_push_token)` unique. RLS로 본인 행만 접근.
- `notification_settings`: `user_id` PK 1행. 전체 on/off + 종류별 on/off + `quiet_hours_start/end`(0~23) + `timezone`(기본 `Asia/Seoul`). 기본값은 opt-in 정책상 `enabled = true` — 클라이언트에서 권한 획득 후에만 row가 생성되므로 로그인만 한 유저에게는 발송되지 않는다.
- `notification_logs`: 발송 이력. `type` (`forgotten` / `rediscover` / 향후 `weekly_summary`), `content_ids` uuid 배열, `title` / `body`, `expo_ticket_id` / `expo_receipt_status`, `opened_at`. 인덱스는 `(user_id, sent_at desc)` + `(user_id, type, sent_at desc)` — 중복 방지 쿼리(같은 type을 오늘 이미 보냈나?) 최적화.
- RLS 정책: `device_tokens` / `notification_settings`는 유저가 CRUD 가능. `notification_logs`는 유저가 select와 `opened_at` update만 가능하고 insert는 Edge Function service role이 수행.

**대안 검토**:
- **로컬 알림(expo-notifications scheduleNotificationAsync)**: 서버 비용 0. 그러나 앱 실행이 없으면 후보 재계산이 불가능하고, "오래 안 본 링크"가 정확히 로컬에서 계산되지 않는다. 재발견 축의 정확도가 앱 사용 빈도에 종속되는 역설이 생겨 제외.
- **`notification_settings`를 `users`에 컬럼 추가**: 스키마는 단순해지지만 조용한 시간·종류별 토글 등이 늘어나면 users 테이블이 부풀어오른다. 향후 tz별 배치·A/B용 컬럼 확장도 부담. 별도 테이블 유지.
- **`content_ids`를 별도 조인 테이블**로 정규화: 감사·분석 정확도는 오르지만 하루 1건 상한에서 배열 저장으로 충분. 초기 단순화 우선.
- **notification_logs insert에도 유저 policy 허용**: 유저가 임의로 로그를 만들 수 있으면 발송 이력 신뢰도가 깨진다. service role만 insert.

**교훈**: 재발견 축(Forgotten/Rediscover)은 정의상 사용자가 앱을 안 열고 있을 때 알아채는 게 목적이므로, 이 기능만큼은 서버 스케줄이 로컬 스케줄보다 우선한다. 알림 정책·발송 로그·기기 토큰을 각각 다른 테이블로 나누면 향후 채널 추가(주간 요약·저장 완료 등)도 로그 스키마 변경 없이 `type` enum 확장만으로 가능하다.

---

## 091. 푸시 알림 클라이언트 (2026-07-04)

**결정**: `expo-notifications` + `expo-device` 도입, 세션 활성 시점에 토큰 upsert, 알림 설정은 프로필 하위의 독립 화면 하나로 관리. 온보딩 권한 요청 스텝과 딥링크 라우팅은 이 PR에서 분리해 40차에서 처리.

**배경**: 결정 090에서 스키마와 서버 발송 방침을 정했다. 클라이언트에서는 (1) 실기기에서 권한을 확보하고 Expo Push Token을 발급받아 서버에 등록하고, (2) 유저가 언제든 종류별 알림을 껐다 켤 수 있는 진입점을 제공해야 한다. 범위가 커서 온보딩 UX·딥링크 라우팅과 함께 한 PR로 묶으면 리뷰가 어려워진다.

**결과**:
- `expo-notifications@~56.0.19`, `expo-device` 설치. `app.json` plugins에 `"expo-notifications"` 추가. 별도 설정 없이 iOS aps-environment entitlement가 EAS Build 시 자동 부여된다.
- `lib/notifications.ts`
  - `Notifications.setNotificationHandler`로 포그라운드에서도 배너 노출 (sound off, badge off).
  - `requestNotificationPermission()`은 `undetermined`에서만 요청 다이얼로그를 띄우고, 이미 결정된 상태에서는 그대로 반환. iOS 재요청 불가 제약을 UX 흐름에 반영.
  - `syncDeviceToken()`은 실기기 + granted 상태에서만 토큰을 발급받아 `upsertDeviceToken`으로 서버에 등록. 시뮬레이터/권한 없음/실패는 조용히 스킵 (fail-silent).
- `lib/api.ts`
  - `upsertDeviceToken` — `(user_id, expo_push_token)` unique 제약을 활용해 upsert.
  - `getNotificationSettings` — `maybeSingle()`로 row 부재 시 `null` 반환 (아직 알림을 켜본 적 없는 유저).
  - `upsertNotificationSettings` — patch 형태로 부분 업데이트. 최초 호출 시 서버 default(`enabled: true`, `quiet_hours 22~08`, `Asia/Seoul`)로 row 생성.
- `app/notification-settings.tsx`
  - 전체 알림 마스터 토글이 꺼져 있으면 종류별 토글은 disabled + opacity 0.5로 시각적으로 잠금.
  - 마스터 토글을 켤 때 iOS 권한이 없으면 즉시 요청 → 거절 시 "iOS 설정 열기" Alert. 이후에는 상단 배너(`iOS 설정에서 알림이 꺼져 있어요`)로 재유도.
  - 발송 시간은 `매일 09:00 KST` + 조용한 시간(22~08) 안내만 표시. 사용자 커스텀 편집 UI는 후속.
  - RN 기본 `Switch`를 트랙 색 `#1A1A1A`, thumb 흰색으로 스타일링해 브랜드 뉴트럴 톤에 맞춤.
- `app/_layout.tsx` — 세션이 활성일 때 `syncDeviceToken`을 fire-and-forget 실행. `notification-settings` Stack.Screen을 slide_from_right로 등록.
- `app/(tabs)/profile.tsx` — 로그아웃과 같은 카드에 "알림 설정" 진입점을 추가 (Divider로 분리).

**대안 검토**:
- **로그인 직후 자동 권한 요청**: iOS는 권한 다이얼로그를 한 번만 띄울 수 있어 온보딩과 맥락 없이 나타나면 유저가 자동 반사로 거절할 확률이 높다. 40차에서 카테고리 선택 직후 문맥이 있는 스텝으로 배치할 예정.
- **알림 설정을 계정 설정 화면 하위로**: 정보 성격이 달라(계정=식별/보안, 알림=재발견 UX) 프로필 최상위 카드로 노출하는 편이 발견성이 높다.
- **`upsertNotificationSettings` 대신 update-only + row 존재 여부 체크**: upsert 한 번으로 최초 진입/재진입을 모두 처리하는 편이 오류 경로가 적어 채택.
- **포그라운드에서 배너를 숨기고 인앱 토스트로 대체**: MVP 범위 초과. Expo 기본 배너로 시작해 반응 보고 조정.

**교훈**: 알림 설정 UI는 "권한 상태"와 "유저 설정" 두 축이 항상 함께 있어야 한다. 유저가 앱 내에서 토글을 다 켜뒀는데 iOS 권한이 꺼져 있으면 아무것도 오지 않아 혼란스러운데, 상단 배너로 이 gap을 명시적으로 시각화하면 지원 문의를 줄일 수 있다. 또 시뮬레이터/에뮬레이터에서는 토큰 발급이 실패하므로 `Device.isDevice` 가드를 반드시 두어야 개발 환경에서 노이즈가 안 생긴다.

---

## 092. 푸시 알림 온보딩 스텝 + 딥링크 라우팅 + 설정 화면 폴리싱 (2026-07-04)

**결정**: 온보딩 흐름 마지막에 알림 권한 요청 전용 화면을 추가하고, 알림 탭 시 payload `data.type`에 따라 딥링크로 라우팅한다. `notification-settings` 화면에는 AppState 리스너를 붙여 iOS 설정에서 권한을 바꾸고 앱으로 돌아왔을 때 배너/토큰 상태가 즉시 반영되게 한다.

**배경**: 결정 091에서 토큰 등록 + 설정 화면을 만들었지만 자동 권한 요청 흐름이 없어 유저가 프로필에 들어가야만 권한이 뜨는 문제가 있었다. 또 실제 테스트에서 (1) 토글마다 하단에 "저장 중…" hint가 깜빡여 산만하고 (2) iOS 설정에서 알림을 다시 켠 후 앱으로 돌아와도 빨간 배너가 그대로 남아있는 두 이슈가 발견됐다.

**결과**:
- `app/notification-permission.tsx` 신규 — Sparkles 아이콘 카드 + "다시 발견할 준비 됐어요" 타이틀 + "알림 받기" / "나중에" 이원 액션. 이미 결정된 상태(granted/denied)라면 mount 즉시 `/(tabs)`로 replace해 스텝을 skip.
- `app/choose-interests.tsx` — `createInitialCategories` 성공 후 `router.replace('/(tabs)')` → `router.replace('/notification-permission')`으로 교체.
- `app/_layout.tsx`
  - Auth 라우팅 가드의 `inAuthFlow`에 `notification-permission`을 포함시켜 인증 완료 유저가 이 화면에 머무는 것을 허용. 단 카테고리 존재 확인 리다이렉트는 `onboarding` / `choose-interests`에서만 수행(이 화면은 이미 카테고리 생성 후 도달).
  - `useNotificationRouting(Boolean(session))`으로 알림 딥링크 라우팅 활성화.
  - `notification-permission` Stack.Screen 추가 (`gestureEnabled: false` — 스와이프로 뒤로 못 감).
- `lib/notifications.ts`
  - `useNotificationRouting(active)` — 세션 활성일 때 (1) 콜드 스타트 알림 탭은 `getLastNotificationResponseAsync()`, (2) 실행 중 탭은 `addNotificationResponseReceivedListener`로 처리.
  - Payload 계약: `data.type === 'forgotten' | 'rediscover'` → `/forgotten` / `/rediscover`. `data.log_id`가 있으면 `markNotificationOpened`로 서버에 열람 시각 기록.
- `lib/api.ts` — `markNotificationOpened(logId)` 추가. RLS 정책상 유저는 본인 로그의 `opened_at`만 update 가능하므로 `.eq('user_id', userId).is('opened_at', null)`로 중복 update 방지.
- `app/notification-settings.tsx`
  - AppState 리스너 추가 — background → active 복귀 시 `refreshPermission` + `syncDeviceToken`. iOS 설정에서 알림 토글 바꾼 뒤 복귀 시 배너 자동 갱신.
  - 토글 저장 중 하단 "저장 중…" hint 및 `saving` state 제거. 낙관적 업데이트만 남기고 실패 시 이전 값으로 되돌리는 흐름은 유지.

**대안 검토**:
- **온보딩 스텝 대신 첫 저장 후 요청**: 문맥은 더 강하지만 저장 흐름 중간에 다이얼로그가 뜨면 저장 UX가 끊긴다. 카테고리 직후가 문맥 자연성과 흐름 연속성 모두 낫다.
- **딥링크를 expo-linking URL 스킴(`nook://forgotten`)으로 처리**: 앱 외부 링크와 통합할 수 있으나 스킴 관리 부담이 있고 알림 payload는 이미 앱 내 이벤트라 URL로 변환할 이유가 없어 `data.type`을 직접 라우터로 매핑.
- **`notification-permission`을 modal presentation**: 모달로 띄우면 뒤에 (tabs)가 살짝 보여 흐름이 부자연스러움. 전용 스크린 + `gestureEnabled: false`로 뒤로가기 봉쇄.
- **AppState 리스너를 앱 루트에서 공유**: 이미 `_layout.tsx`에 분석 이벤트용 리스너가 있어 하나 더 만드는 게 부담이었으나, notification-settings 화면에서만 필요한 갱신이라 화면 범위로 한정.

**교훈**: 권한 요청은 "언제" 요청하느냐가 승인률을 좌우한다. 로그인 직후는 문맥이 없어 반사적 거절 확률이 높고, 첫 저장 직후는 저장 UX를 방해한다. 온보딩 마지막 전용 스텝에서 재발견 가치 제안과 함께 요청하는 게 실질적으로 승인/거절 결정을 유도할 수 있는 유일한 시점이다. 또 iOS 권한은 설정에서만 되돌릴 수 있으므로 앱 내 상태와 시스템 상태 동기화(AppState 리스너)가 없으면 유저는 "왜 배너가 안 사라지지?"라는 혼란을 겪는다.

---

## 093. 푸시 알림 v1.2 성격 재정의 — 미열람 리마인더 단일 채널 + 유저 발송 시간 지정 (2026-07-05)

**결정**: 푸시 알림 v1.2 범위를 **"저장했지만 열어보지 않은 링크를 잊지 않도록 깨워주는 리마인더"** 단일 채널로 확정한다. Forgotten/Rediscover 두 축을 통합하지 않고 아예 다른 성격(**미열람**)으로 재정의. 유저는 30분 단위로 발송 시간을 자유롭게 선택할 수 있으며 기본값은 20:00 KST. pg_cron은 매 30분 정각/반정각에 tick하고 Edge Function이 현재 KST 시각과 일치하는 유저만 처리.

**배경**: 결정 090에서 Forgotten + Rediscover 두 채널을 계획했지만, 실제 알림 성격을 재검토하니 이 둘은 유저 관점에서 **홈 화면의 재발견 큐레이션 섹션과 겹치는** 콘텐츠였다. 알림은 "홈에서 볼 수 있는 것을 미리 push"가 아니라 **"유저가 스스로는 절대 상기하지 못할 것을 깨워주는"** 역할이어야 한다. 저장한 지 며칠 지났는데 한 번도 안 본 링크(=`viewed_at IS NULL AND saved_at 7~14일`)가 이 정의에 정확히 부합. 홈에서는 이런 콘텐츠를 별도 섹션으로 노출하지 않으므로 알림 채널로만 존재해도 겹침이 없다.

또 09:00 KST 고정 발송은 아침 러시 시간에 링크를 다시 볼 여유가 없어 실효성이 낮다는 판단. 저녁 콘텐츠 소비 시간대(20:00) 기본값 + 유저가 시:분(30분 단위)으로 자유롭게 조정하는 방향이 Nook 특성(저빈도, 여유 시간대 소비)과 맞는다.

**결과**:
- 마이그레이션 `007_notification_settings_time.sql`
  - `send_at_hour int not null default 20 check (0~23)` 추가
  - `send_at_minute int not null default 0 check (0 or 30)` 추가
  - `quiet_hours_start`, `quiet_hours_end`, `forgotten_enabled`, `rediscover_enabled` 삭제 (dead column 정리 — 알림 미배포 시점이라 데이터 손실 없음, 결정 088·089·091과 동일 근거)
- `types/index.ts` — `NotificationSettings` 재구성, `NotificationType = 'unread_reminder'` 단일
- `components/TimePickerSheet.tsx` 신규 — iOS 알람 스타일 3-column wheel picker (오전·오후 / 시 1~12 / 분 00·30). 각 column은 `snapToInterval` ScrollView, 중앙 하이라이트 오버레이 + 거리 기반 opacity 감쇠(0.14~1)로 wheel 감성 재현. `mode='time'` native DateTimePicker 대신 커스텀으로 만든 이유: (1) native module 재빌드 회피 (2) 브랜드 톤 유지 (3) 30분 단위 이산 옵션 제약이 native picker의 60분 그리드와 어긋남.
- `app/notification-settings.tsx`
  - "종류" 섹션(Forgotten/Rediscover 토글) 완전 제거
  - 마스터 토글 라벨을 "미열람 리마인더"로 변경 + 설명 문구 "저장했지만 열어보지 않은 링크가 쌓이면 주 1회 알려드려요"
  - "발송 시간" 정적 안내 → **누르면 TimePickerSheet 여는 pressable 카드**로 교체. 시간 표시는 오전/오후 12시 형식.
- 알림 로직 확정 (Edge Function 41차에서 구현)
  - 후보: `viewed_at IS NULL AND saved_at BETWEEN 7~14일 전`
  - 최소 3개 이상일 때만 발송
  - 유저별 최근 7일 이내 발송 이력 있으면 skip (주 1회 상한)
  - pg_cron `0,30 * * * *` → Edge Function이 KST 기준 현재 시각 매칭 유저만 처리

**대안 검토**:
- **Forgotten + Rediscover 두 채널 유지**: 유저 인지 부담(어떤 걸 켜지?) + 홈 섹션과 겹침. 단일 축(미열람)만 남기면 결정 피로 없이 utility 명확.
- **네이티브 DateTimePicker(`@react-native-community/datetimepicker`)**: 접근성/일관성은 좋으나 native module 재빌드가 필요하고 스타일 커스터마이즈가 제한적. 커스텀 BottomSheet(48행 FlatList)로 브랜드 톤 유지 + 재빌드 없음.
- **프리셋 4개(아침/점심/저녁/밤)만 제공**: 구현 단순하지만 유저 선호가 자유도 있어야 한다는 판단. 30분 단위 자유 선택 유지.
- **매시간 pg_cron 1개 + minute 필터 없음(정각만)**: 30분 단위 자유 선택 스펙과 불일치. `0,30 * * * *`로 매 30분 tick.

**교훈**: 알림 채널을 "홈 UI의 push 확장"으로 설계하면 유저 관점에서 중복으로 느껴진다. 알림은 **홈에서 절대 발견하지 못할 사각지대**를 채워야 한다. 미열람 링크는 홈 어디에도 노출되지 않는 사각지대라 알림 전용 채널로 명확한 가치가 있다. 시간 지정은 pg_cron 스케줄 세분화(4개→매 30분)로 인프라 부담을 감수하되 유저 자유도를 확보하는 편이 저빈도 앱의 리마인더 UX에 맞는다.

---

## 094. 알림 마스터/채널 토글 분리 + 채널별 컬럼 방식 (2026-07-05)

**결정**: `notification_settings.enabled`(마스터)와 채널별 컬럼(`unread_reminder_enabled` 등)을 명시적으로 분리한다. 향후 채널 추가는 조인 테이블이 아니라 컬럼 추가 방식으로 확장한다. UI도 "전체 알림" 섹션과 "알림 종류" 섹션을 나눠 iOS 시스템 알림과 동일한 멘탈 모델을 유지.

**배경**: 결정 093에서 v1.2 채널은 단일 미열람 리마인더로 축소하며 마스터와 채널 구분 없이 `enabled` 하나로 통합했다. 그러나 v1.3 이후 채널 추가(관심사 급부상, Throwback 등)가 로드맵에 있어 지금 마스터/채널을 분리해두면 채널 추가 시 UI/스키마 리팩터가 없다. 확장 방식으로는 (a) 컬럼당 채널 vs (b) `notification_channels(user_id, type, enabled)` 조인 테이블 두 안이 있었다.

**결과**:
- 마이그레이션 `008_notification_channels.sql` — `notification_settings`에 `unread_reminder_enabled boolean not null default true` 추가.
- `types/index.ts` — `NotificationSettings`에 `unread_reminder_enabled` 필드 추가.
- `app/notification-settings.tsx`
  - "알림" 섹션: **전체 알림** 마스터 토글 — Nook 알림 전체 on/off + iOS 권한 게이트.
  - "알림 종류" 섹션 신설: **미열람 리마인더** 채널 토글. 마스터 off일 때 disabled + opacity 0.5.
  - "발송 시간" 섹션: 마스터 off 이거나 채널 off일 때 disabled.
- Edge Function 조건은 `enabled = true AND unread_reminder_enabled = true`인 유저만 발송 대상 (42차에서 구현).

**대안 검토 — 컬럼당 채널 vs 조인 테이블**:

| 축 | 컬럼당 채널 (채택) | 조인 테이블 |
|---|---|---|
| 읽기 (Edge Function 필터) | 단일 row select | 조인 필요 |
| 쓰기 (토글 저장) | 단일 row update | 채널별 upsert |
| 스키마 진화 | 채널당 `ALTER TABLE ADD COLUMN` | 마이그레이션 불필요 |
| TypeScript 타입 안전성 | 명시적 필드 | dynamic map |
| 코드 복잡도 | 단순 | 살짝 복잡 |

Nook은 채널 수가 v1.x 로드맵상 최대 5개(미열람 / 관심사 급부상 / 사그라든 관심사 / Throwback / 마일스톤). 20개 넘어가면 조인 테이블 리팩터가 이득이지만 그 스케일까지 안 감. 읽기·쓰기 성능과 타입 안전성에서 컬럼당 채널이 우세.

**다른 대안**:
- **마스터/채널 통합 유지 (결정 093 그대로)**: v1.2 유지 관점에선 심플하지만 v1.3 채널 추가 시 UI/스키마 두 곳 리팩터 필요. 지금 분리해두는 게 총 비용이 낮음.
- **채널 컬럼을 `_enabled` 대신 시맨틱 이름(`unread_reminders` bool)**: 접미사 컨벤션이 명시적이라 다른 곳(`enabled` 마스터)과 충돌 안 나게 유지. 유지 결정.

**교훈**: iOS 시스템 알림 UX(전체 앱 알림 + 종류별)는 유저에게 익숙한 멘탈 모델이라 우리도 같은 구조를 취하면 학습 비용이 없다. 확장 방식은 컬럼당 vs 조인 테이블 선택에서 "지금 채널 몇 개고 최대 몇 개 예상하는가"가 결정 요인 — 5개 이하면 컬럼당이 이득. 20개+ 되면 리팩터.

---

## 095. 미열람 리마인더 Edge Function + pg_cron 발송 (2026-07-05)

**결정**: pg_cron이 매 30분(`0,30 * * * *`) tick으로 Edge Function `send-unread-reminder`를 호출한다. Function은 현재 KST hour+minute을 매칭하는 유저를 조회하고 조건을 통과한 유저에게 Expo Push API로 미열람 리마인더를 발송하며 `notification_logs`에 이력을 남긴다. 딥링크 라우팅은 우선 홈(`/(tabs)`)으로 하고 전용 화면은 별도 스프린트로 분리한다.

**배경**: 결정 093에서 발송 스펙(30분 단위 유저 지정 시간, 주 1회 상한, 후보 3개 이상)이 확정됐고 결정 094에서 마스터/채널 컬럼이 분리됐다. 이제 서버 인프라(Edge Function + 스케줄러 + Expo Push 연동)를 조립해 실제 알림을 유저에게 도달시켜야 한다. 딥링크 대상은 아직 전용 화면이 없어 임시 landing 결정도 필요했다.

**결과**:
- `supabase/functions/send-unread-reminder/index.ts` 신규
  - 인증: `Authorization: Bearer <CRON_SECRET>` 검증 후 service role 클라이언트 생성. RLS 우회로 전 유저 조회 필요.
  - KST 시각 계산: UTC + 9h → hour + minute(30분 그리드 floor: 0~29→0, 30~59→30). pg_cron이 :00/:30에 tick하지만 지연 대응.
  - 대상 유저: `notification_settings WHERE enabled AND unread_reminder_enabled AND send_at_hour=X AND send_at_minute=Y`
  - 유저별 파이프라인:
    1. `notification_logs`에 지난 7일 이내 `unread_reminder` 있으면 skip (주 1회 상한)
    2. 후보 조회: `contents WHERE user_id=X AND viewed_at IS NULL AND saved_at BETWEEN now()-14d AND now()-7d`, `saved_at desc`, 상위 5개
    3. 3개 미만이면 skip
    4. `device_tokens` 조회 (여러 기기 지원) — 0개면 skip
    5. `crypto.randomUUID()`로 `log_id` 사전 발급 → payload `data.log_id`에 포함 → 유저가 알림 탭 시 `markNotificationOpened` update 가능
    6. Expo Push 배치 전송 (100 chunk), 성공 여부를 `expo_ticket_id` / `expo_receipt_status`에 기록
    7. `notification_logs` 삽입
- `lib/notifications.ts` — payload 타입을 `'forgotten' | 'rediscover'` → `'unread_reminder'`로 축소. `routeForType` 반환을 `/(tabs)` (홈)로 단순화. 전용 화면 도입 시 여기만 갱신하면 됨.
- Message body: 후보 리스트 첫 번째 콘텐츠 제목을 40자 이내로 slice해 "…외에도 다시 볼만한 링크가 쌓였어요" 톤으로 조립. 제목 없으면 폴백 문구.
- Return payload에 `stats` 반환 (`candidateUsers` / `sent` / `skippedRecent` / `skippedNoCandidates` / `skippedNoTokens` / `expoErrors`) — 모니터링/디버깅용.

**pg_cron 스케줄 SQL (Supabase Dashboard)**:
```sql
select cron.schedule(
  'send-unread-reminder',
  '0,30 * * * *',
  $$
  select net.http_post(
    url := 'https://<project-ref>.supabase.co/functions/v1/send-unread-reminder',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer <CRON_SECRET>'
    ),
    body := '{}'::jsonb
  ) as request_id;
  $$
);
```

**대안 검토**:
- **JWT 검증 유지 + 유저 토큰으로 호출**: 서비스 롤 없이 하려면 각 유저별로 함수를 호출해야 함. pg_cron이 유저별 tick을 돌리는 건 비효율(N번 http_post). 서비스 롤 + service role 클라이언트로 한 번에 처리.
- **콘텐츠 후보를 클라이언트에서 계산해서 Edge Function에 넘기기**: 서버 스케줄에서 클라이언트를 개입시킬 방법이 없음 (앱이 꺼진 상태). 서버 계산 필수.
- **딥링크를 `/forgotten`으로 라우팅**: 스펙 불일치 — `/forgotten`은 `viewed_at IS NOT NULL AND lt 14d ago`(본 적 있음), 미열람 리마인더는 `viewed_at IS NULL`(본 적 없음). 다른 축. 홈으로 라우팅하는 게 오해 없음.
- **딥링크 전용 화면 `/unread-reminder?log_id=...` 이번에 함께 구현**: PR 부담이 커짐. `notification_logs.content_ids`로 정확히 그 알림에 포함된 콘텐츠 렌더링하는 뷰가 필요한데 스코프 별도 분리.
- **`send_at_minute`을 무시하고 매시간 발송**: 30분 단위 자유 선택 스펙과 불일치. `0,30 * * * *`로 매 30분 tick + minute 필터로 정확히 매칭.
- **Expo receipt 조회 정리 함수 이번에 함께**: 무효 토큰 정리는 주 1회 정도만 필요. 별도 함수(43차 이후)로 분리.

**교훈**: 스케줄 기반 서버 발송은 인증/스케줄러/후보 계산/외부 API/이력 저장의 5단 파이프라인이라 초기부터 각 단계의 실패 격리(fail-silent + stats 반환)를 설계해두면 부분 장애가 전체 발송을 막지 않는다. 특히 Expo Push 실패는 유저별로 격리되고 로그에 receipt 상태를 남겨 후속 정리 함수로 처리하는 편이 안정적이다. 딥링크 대상은 임시 landing으로 시작해 유저 반응 보고 전용 화면 필요성을 판단하는 게 오버엔지니어링을 방지한다.

---

## 096. 클립보드 감지 저장 프롬프트 (2026-07-05)

**결정**: 앱이 foreground로 진입할 때마다 클립보드에 URL이 있는지 non-intrusive 방식(`Clipboard.hasUrlAsync()`)으로 체크하고, 있으면 컴팩트 BottomSheet로 "저장할까요?"를 노출한다. 세션 스코프의 dismissed set으로 같은 URL 반복 프롬프트를 방지한다. Share Intent 처리 중이거나 온보딩 흐름에서는 자동으로 비활성화.

**배경**: 신규 유저 activation의 핵심 gap은 "온보딩 후 첫 저장까지의 지연"이다. 관심 카테고리를 정했지만 홈이 비어있으면 다시 앱을 열 이유가 없어 이탈로 이어진다. 대부분 사용자는 어딘가에서 URL을 이미 복사한 상태로 앱을 여는 경우가 많은데, 이 순간을 잡아 첫 저장 마찰을 극도로 낮추면 activation curve가 개선된다.

**결과**:
- `components/ClipboardSavePrompt.tsx` 신규 — Modal + 컴팩트 BottomSheet. 도메인/URL preview 카드 + "지금은 아니에요" / "저장" 이원 액션. 드래그 핸들, 배경 dim, spring 애니메이션은 기존 시트 톤과 일치.
- `lib/useClipboardSavePrompt.ts` 신규 — 훅. `hasUrlAsync`로 배너 없이 존재만 체크 후, 있을 때만 `getUrlAsync`로 실제 URL을 읽어와(iOS 16+ 클립보드 접근 배지 1회 노출) 프롬프트 상태를 세팅. 400ms 디바운스 + 세션 스코프 dismissed Set(URL 기준)으로 중복 프롬프트 방지. AppState 리스너로 매 foreground 진입 시 재검사.
- `app/_layout.tsx`
  - `inAuthFlow`를 컴포넌트 레벨로 hoist해 라우팅 가드와 클립보드 훅에서 공유.
  - `useClipboardSavePrompt(Boolean(session) && !hasShareIntent && !inAuthFlow)` — 세션 있고 Share Intent 미처리 중이며 온보딩/권한 스텝이 아닐 때만 활성.
  - `<ClipboardSavePrompt>`를 Stack 아래에 렌더해서 어느 라우트에서든 오버레이로 노출.
- 저장 로직은 기존 `saveContent({ url }, { entry_source: 'direct' })` 재사용. 중복 URL은 `isDuplicateContentUrlError`로 판별해 "이미 저장된 링크예요" 토스트.

**대안 검토**:
- **홈에 hint bar만 노출(자동 시트 X)**: iOS 배너를 전혀 노출하지 않아 조용하지만, "자동으로 저장" 마찰 감소 효과가 사라짐. 유저가 홈에 들어와야만 감지 → activation 목적 반감.
- **Widget으로 홈스크린 저장 버튼**: 진짜 습관화에 강력하지만 iOS Widget은 native/Expo Widget SDK 필요해 개발 비용 큼. 별도 스프린트.
- **매 AppState active마다 배너 노출**: getUrlAsync를 조건 없이 매번 호출하면 iOS 16+ 배지가 앱 열 때마다 뜸. hasUrlAsync 필터로 URL 있을 때만 실제 read해서 배지 노출 빈도 최소화.
- **URL 감지 후 자동 저장(사용자 확인 없이)**: 유저 의도 없는 저장 = 스팸. 확인 시트로 유저 통제 유지.
- **AsyncStorage에 dismissed URL 영구 저장**: 세션 넘어 지속하면 유저가 새로 복사한 뒤 다시 열어도 프롬프트 안 뜨는 케이스는 없지만, 며칠 전 dismiss한 URL을 다시 복사했을 때도 안 뜸 → UX 손해. 세션 스코프가 낫다.

**교훈**: iOS 16+ 클립보드 접근 배지는 유저 프라이버시 신뢰 축 하나라 함부로 트리거하면 앱 신뢰가 훼손된다. `hasStringAsync`/`hasUrlAsync` 계열은 introspective(존재 유무만 확인)라 배지가 안 뜨므로, 이걸 first-line filter로 두고 실제 read는 조건 만족할 때만 하는 게 정석. Activation 기능은 "낮은 마찰 + 유저 통제 유지"라는 두 축을 동시에 만족해야 스팸으로 인지되지 않는다.

---

## 097. 콘텐츠 리마인더 — 유저 지정 스누즈 알림 (2026-07-06)

**결정**: Content Detail 상단 bell 아이콘으로 유저가 콘텐츠별 리마인더를 예약할 수 있게 한다. 3개 프리셋(1시간 뒤 / 내일 / 주말)만 노출하고 시간은 프로필 미열람 발송 시간을 재사용한다. 저장소는 OS pending 큐(`expo-notifications`)를 진실의 원천으로 삼아 별도 AsyncStorage/DB를 두지 않는다. 알림 탭 → 해당 콘텐츠 상세로 딥링크.

**배경**: 기존 미열람 리마인더는 시스템이 자동으로 판단해서 aggregate로 알려주는 축이었다면, 콘텐츠 리마인더는 유저가 "이거 이따 봐야지" 순간에 explicit intent를 잡아주는 축이다. Slack "Remind me" / Gmail 스누즈 같은 익숙한 패턴. 홈 화면에서 절대 발견하지 못하는 "특정 링크를 특정 시점에" 축을 채운다. 유저가 반복해서 지적한 "선택지 피로" 문제를 최소화하기 위해 프리셋을 3개로 축소하고 시간은 프로필 설정을 재사용.

**결과**:
- `lib/reminders.ts` 신규 — 저장소는 `Notifications.getAllScheduledNotificationsAsync()` 반환값의 data(`type: 'reminder', content_id`)로 콘텐츠 매칭. `getReminder`/`scheduleReminder`/`cancelReminder`가 pending 큐에 직접 CRUD.
  - 프로필 발송 시간 재사용: `getUserPreferredTime()`이 `notification_settings.send_at_hour/minute` 로드 (실패 시 20:00 default), 모듈 캐시로 반복 조회 억제.
  - 프리셋 시간 계산: `computePresetTime(preset, userTime, now)` — hour(+1h) / tomorrow(내일 유저 시간) / weekend(주말 정책).
  - 주말 정책: 월~금 → 이번 주 토요일 / 토 유저시간 전 → 오늘 / 토 유저시간 후 → 일요일 / 일 유저시간 전 → 오늘 / 일 유저시간 후 → 다음 주 토요일.
  - 라벨은 동적 계산: `labelForPreset` 이 계산된 실제 요일과 시간을 괄호로 노출 ("주말 (토, 20:00)", "주말 (오늘, 20:00)", "주말 (다음 토, 20:00)"). 유저가 헷갈릴 여지 없음.
- `lib/useContentReminder.ts` 신규 — `refresh` / `schedule` / `cancel` / `busy` state를 노출하는 훅. 콘텐츠 id 변경 시 자동 조회.
- `components/ReminderSheet.tsx` 신규 — ActionSheet 톤의 카드 UI + 3개 프리셋 row + (예약된 경우) 상단 "예약됨: N일 뒤 20:00" 상태 + 하단 "리마인더 취소" 버튼.
- `app/content/[id].tsx` 수정 — 우상단 nav에 bell 아이콘 (outline / filled + accent 컬러) 추가. 탭 시 ReminderSheet 노출. 성공/취소 시 인앱 토스트.
- `lib/notifications.ts` 수정 — payload 타입에 `'reminder'` 추가. `data.type === 'reminder' && data.content_id`이면 `/content/[id]?source=direct`로 라우팅. 기존 `'unread_reminder'` 처리는 유지.

**대안 검토**:
- **AsyncStorage에 로컬 record 저장**: OS pending 큐와 로컬 저장소 두 곳을 sync해야 해서 실패 케이스가 늘어남. pending 큐 자체가 이미 진실의 원천 — 단일 소스가 훨씬 안정적.
- **서버 백업 + 서버 발송**: 다중 기기 sync/재설치 유지에는 좋지만 스코프 2배(마이그레이션 + Edge Function + pg_cron + device_tokens 활용). Nook은 iOS 개인 유저 중심 → 로컬 알림으로 충분. 후속 스프린트에서 미열람 후보 exclusion 로직과 함께 필요 시 추가.
- **프리셋 6개 (오늘 저녁 / 다음 주 등)**: 유저 요청 "귀찮음 최소화"와 배치. 3개(1시간 뒤 / 내일 / 주말)로 축소해 상황별 커버 90%+ 달성.
- **커스텀 시간 선택 옵션**: MVP 스코프 초과. 유저 반응 보고 후속 스프린트에서 date+time picker 추가 검토.
- **미열람 리마인더 후보에서 예약된 콘텐츠 제외**: 서버가 로컬 알림 예약 상태를 모르므로 지금은 불가. 오늘 겹침은 iOS 알림 그룹핑으로 완화. 서버 백업 도입 시 함께 처리.
- **bell 아이콘 없이 ActionSheet 항목으로만**: 발견성 저하. 리마인더는 재발견 축의 핵심 UX라 우상단 접근성이 필요.
- **저장소 이름 `nook.reminders.v1` AsyncStorage 키**: pending 큐 방식 채택으로 불필요. AsyncStorage 의존성 자체 회피.

**교훈**: 로컬 알림 기반 기능은 OS pending 큐가 이미 강력한 저장소라 앱이 별도 저장을 두면 sync 실패 케이스만 늘어난다. `data` payload를 조회 keying에 활용하면 큐 자체를 DB처럼 쓸 수 있다. 프리셋 라벨을 static 문자열로 두면 "이번 주말이 언제지?" 같은 계산이 유저에게 넘어가 결정 피로가 커지지만, 계산 결과를 라벨에 함께 노출하면 유저는 즉시 시각적으로 이해할 수 있다. 유저 지정 시간을 프로필 설정과 재사용하면 프로필 시간의 의미가 확장되어 일관된 리듬을 유지할 수 있다.

---

## 098. 예정된 리마인더 목록 뷰 (2026-07-06)

**결정**: Profile 하위에 "예정된 리마인더" 진입점 추가. 진입 시 pending 리마인더를 시간 오름차순으로 나열하고, 카드 탭 → 해당 콘텐츠 상세, 우측 X 버튼 → 확인 Alert 후 취소. 데이터는 로컬 OS pending 큐 + 콘텐츠 배치 조회로 조합. 지난 알림 이력은 서버 백업 도입 시 함께 처리.

**배경**: 결정 097로 콘텐츠 리마인더가 도입됐지만 유저가 여러 콘텐츠에 리마인더를 걸어두면 무엇이 예약돼 있는지 한눈에 볼 수 없었다. 개별 Content Detail에 진입해야만 상태 확인이 가능해 발견성이 떨어지고, 유저가 자신의 예약을 놓칠 위험이 있었다. Profile 진입점에 개수 배지를 함께 노출해 pending 존재를 상시 알린다.

**결과**:
- `lib/reminders.ts` — `getAllReminders()` 추가. `getAllScheduledNotificationsAsync()` 전체 스캔 후 `type: 'reminder'` 필터, 이미 지난 항목 제외, 시간 오름차순 정렬.
- `lib/api.ts` — `getContentsByIds(ids)` 추가. `.in('id', ids)`로 배치 조회. RLS로 유저 스코프 자동 필터.
- `app/reminders.tsx` 신규 — pending 리마인더 카드 리스트. 각 카드에 썸네일/제목/도메인/예정 시간, 우측 X 버튼(확인 Alert 후 `cancelReminder`). `useFocusEffect`로 진입 시마다 재조회. 빈 상태 안내 문구 표시.
- `app/(tabs)/profile.tsx` — "예정된 리마인더" `SettingRow`에 `badge` prop 추가(accent 컬러). 항상 pending 개수 노출. `useFocusEffect`로 pending 큐 재조회.
- `app/_layout.tsx` — `reminders` Stack.Screen 등록 (`slide_from_right`).
- 삭제된 콘텐츠 처리: 콘텐츠 배치 조회에서 매치 실패한 리마인더는 "(삭제된 콘텐츠)" 텍스트로 표시. 탭 비활성화. 유저가 X 버튼으로 취소만 가능.

**대안 검토**:
- **홈 하단 섹션 형태**: 홈이 이미 재발견 축 3개(Recent/Rediscover/Forgotten)+Insight로 복잡. 추가 섹션은 인지 부담. Profile 진입점 방식이 더 조용함.
- **탭 바에 리마인더 탭 추가**: 발견성은 높지만 코어 4탭(홈/폴더/리포트/프로필)이 이미 정착. 리마인더는 부가 기능이라 Profile 하위가 맞다.
- **콘텐츠 배치 조회 없이 알림 데이터에 제목 저장**: OS pending 큐의 notification 본문에 제목이 이미 저장되어 있어 재활용 가능. 하지만 도메인/썸네일 등은 없어 결국 콘텐츠 fetch 필요. 배치 조회 한 번이 fetch 총량이 더 적다.
- **iOS-style swipe to delete**: 개발 부담 큼(제스처 라이브러리), 우측 X 버튼이 발견성/접근성 모두 우수. 유지.
- **지난 리마인더 이력 함께 노출**: 로컬 알림은 delivered 이력이 없어 반쪽만 커버됨. 서버 백업 도입 시 함께 처리하는 게 완결성.
- **배지를 개수 대신 dot(점)만**: 개수가 유용한 정보(0 vs 3+). 정확한 개수 노출.
- **개수 0일 때도 진입점 유지**: 예약 없어도 "언제든 콘텐츠 상세에서 예약할 수 있다"는 안내 화면 노출 유지. 진입점 자체는 항상 존재.

**교훈**: 개인용 로컬 알림 시스템은 유저가 "지금 뭐가 예약돼 있지?"를 자주 궁금해하는데 이걸 못 보면 시스템 신뢰가 훼손된다. 배지는 pending의 존재 자체를 상시 알려주는 저비용 신호이며, 진입점의 위치는 자주 쓰는 기능 옆(알림 설정)이 발견성이 가장 좋다. 삭제된 콘텐츠에 대한 리마인더는 예외적으로 발생하지만 UI에서 명시적으로 표시하고 취소만 허용하는 게 fail-silent보다 유저 통제감이 크다.

---

## 099. 미열람 리마인더 딥링크 전용 화면 (2026-07-09)

**결정**: 미열람 리마인더 알림 탭 시 홈(`/(tabs)`) 임시 landing에서 `/unread-reminder?log_id=...` 전용 화면으로 이동. `notification_logs` 로우를 조회해 그 알림에 실제로 포함됐던 콘텐츠만 정확히 렌더하고, 진입 시 `opened_at`을 기록해 열람 지표를 확보. `log_id`가 없거나 로그를 찾지 못하면 empty state로 fallback.

**배경**: 결정 095에서 미열람 리마인더 발송 파이프라인은 완성했지만 딥링크 전용 화면은 스코프 분리 이유로 유보하고 홈으로 임시 landing 시켰다. 그 결과 (1) "링크 3개가 쌓였어요"라는 알림 문구와 실제 열리는 화면(홈)이 어긋나 유저 기대와 불일치, (2) 알림에 포함됐던 정확히 그 콘텐츠 세트를 다시 볼 방법이 없음, (3) `opened_at` 기록은 됐지만 실제 어떤 콘텐츠가 재열람되는지 후속 추적이 어려운 문제가 남았다.

**결과**:
- `types/index.ts` — `NotificationLog` 타입 추가 (`notification_logs` 스키마와 1:1).
- `lib/api.ts` — `getNotificationLog(logId)` 추가. RLS로 본인 로그만 접근, 없으면 null.
- `app/unread-reminder.tsx` 신규 — `useLocalSearchParams<{ log_id }>` 파싱 → `getNotificationLog` → `content_ids` 배치 조회 (`getContentsByIds`) → 원본 순서 유지 렌더. `ContentCard` 그리드, `source=unread_reminder`로 상세 이동.
- `lib/notifications.ts` — `resolveRoute` 업데이트. `type='unread_reminder' && log_id` 있으면 `/unread-reminder?log_id=...`, 없으면 홈 fallback.
- `lib/analytics.ts` / `app/content/[id].tsx` — `ContentOpenedSource`에 `'unread_reminder'` 추가. 재열람 세션의 유입 채널 구분 가능.
- `app/_layout.tsx` — `unread-reminder` Stack.Screen 등록 (`slide_from_right`).
- `opened_at` 기록은 알림 탭 핸들러(`handleNotificationResponse`)와 화면 진입(`markNotificationOpened`) 양쪽에서 호출. RLS + `.is('opened_at', null)` 가드로 idempotent.
- 삭제된 콘텐츠는 `content_ids` 순서 유지 매핑에서 자동 제외. 모두 삭제된 경우 별도 empty state.

**대안 검토**:
- **`/forgotten` 재사용**: 스펙 불일치 (`viewed_at` 유무 축이 반대). 결정 095에서 이미 배제.
- **홈 유지 + hero 카드로 강조**: 홈 진입 후 유저가 별도로 다시 탐색해야 함. 알림 → 후보 리스트의 직접성이 약해짐.
- **`log_id` 대신 콘텐츠 후보를 payload에 직접 담기**: Expo Push data 크기 제한(~4KB) 위험, 삭제된 콘텐츠 반영 어려움. `log_id`로 서버 조회하는 편이 안전.
- **`markNotificationOpened`를 화면에서만 호출**: cold start 라우팅 후 화면 도달 사이 지연/실패 시 지표 누락. 알림 탭 핸들러 호출 유지가 안전.
- **로그 없거나 만료 시 홈으로 replace**: empty state가 UX 상 더 명확 ("이미 열어봤거나 만료된 알림이에요"). 무음 리다이렉트는 혼란.

**교훈**: 서버 발송/딥링크 화면을 두 단계로 나눠 처리하면 초기 발송 안정화와 UI 완성도를 독립적으로 검증할 수 있다. 특히 알림 payload에 후보 데이터 자체가 아닌 `log_id`만 담고 화면 진입 시 서버 로그를 재조회하는 방식은 payload 크기와 삭제된 콘텐츠 반영을 한 번에 해결한다. `opened_at` 같은 idempotent 지표는 여러 진입 경로에서 반복 호출해도 안전하도록 스키마 레벨(`.is null` 가드)에서 보장하는 게 애플리케이션 로직 단순화의 열쇠다.

