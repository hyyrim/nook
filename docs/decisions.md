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
