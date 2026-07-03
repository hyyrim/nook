# Nook 개발 진행 상태 — Phase 2 Part 1

> 보관 범위: 완료 19차~29차 (2026-06-25 ~ 2026-07-02).
> 현재 진행 상태는 `docs/progress.md`를 확인합니다.

## 완료 (19차 — 홈 Forgotten Content + Report 1차)

| 항목 | 상태 |
|------|------|
| 홈 "잊고 있던 콘텐츠" 섹션 추가 — `viewed_at IS NOT NULL AND viewed_at < 14일 전`, 최대 10개 (→ 결정 055) | ✅ |
| `ContentOpenedSource`에 `'forgotten'` 추가, Content Detail 화이트리스트 갱신 | ✅ |
| 리포트 탭 1차 — "관심사 회고" 화면 (관심 분포 + 관련 주제, AI 호출 없이 단순 집계) (→ 결정 056) | ✅ |
| `lib/report.ts` 순수 함수 모듈 — aggregateByCategory / computeDistribution / topTagsPerCategory | ✅ |
| 30일 단일 fetch + 클라이언트 derive (7일/30일 in-memory 분기) | ✅ |
| v1.0.0 MVP 정식 출시 | ✅ |

## 완료 (20차 — 리포트 다듬기 + 홈 재발견 섹션 안정화)

| 항목 | 상태 |
|------|------|
| 리포트 "많이 저장한 카테고리" 섹션 제거 — 관심 분포와 중복 (→ 결정 057) | ✅ |
| 리포트 개발 모드 더미 케이스 선택기 제거 (검증 종료) (→ 결정 058) | ✅ |
| 리포트 기간 라벨 badge화 + 섹션 헤더 아이콘 정렬 (→ 결정 059) | ✅ |
| 리포트 기간 기준 — 자동 fallback → 사용자 선택(`일주일/14일/한달` 드롭다운) (→ 결정 060) | ✅ |
| 리포트 관심 분포 Top 강조 테스트 원복 (→ 결정 061) | ✅ |
| 홈 Forgotten Content 14일 기준 단일화 — 함수 default 30→14, 호출부 override 제거 (→ 결정 062) | ✅ |
| Rediscover 저장 직후 노출 완화 — 3일 숙성 기간 + 탭 후 세션 유지 (→ 결정 063) | ✅ |
| Forgotten Content 카테고리당 최대 2개 다양성 제약 (→ 결정 064) | ✅ |
| 홈 Rediscover/Forgotten 섹션 subtitle 추가 — 데이터 기준 설명 (→ 결정 065) | ✅ |
| 홈 데이터 상태별 밀도 조절 — 보조 섹션 개수에 따라 최근 저장 노출 수(3/4/6) 가변 (→ 결정 066) | ✅ |
| dev preview 케이스 검증 후 제거 | ✅ |

## 완료 (21차 — 재발견 재정의 + Interest Insight 홈 카드)

| 항목 | 상태 |
|------|------|
| Rediscover 정의 변경 — viewed 무관, "한동안 안 들여다본 관심 콘텐츠" (→ 결정 067) | ✅ |
| 망각도 계산 = `lastInteraction (viewed_at ?? saved_at)` 기준으로 변경 | ✅ |
| `minAgeDays` 3 → 2 (저장 후 노출까지 단축) | ✅ |
| `retainedRediscoverIdsRef` 세션 유지 로직 제거 — viewed 무관으로 자연 해결 | ✅ |
| 발견된 콘텐츠 subtitle "한동안 안 들여다본 관심 콘텐츠예요"로 변경 | ✅ |
| `getInterestInsight` 함수 추가 — 최근 14일 vs 이전 14일 카테고리 저장 수 비교, Top 1 (→ 결정 068) | ✅ |
| `InterestInsightCard` 컴포넌트 추가 — "최근 2주 [카테고리] 저장이 평소보다 늘었어요" + 클릭 시 폴더 이동 | ✅ |
| 홈 섹션 순서: 최근 저장 → Interest Insight (있을 때) → 발견된 콘텐츠 → 잊고 있던 콘텐츠 | ✅ |
| TypeScript 검증 통과 | ✅ |

## 완료 (22차 — 온보딩 카테고리 직접 추가)

| 항목 | 상태 |
|------|------|
| `app/choose-interests.tsx` — 기본 12개 칩 + 사용자 정의 칩 + "+ 직접 추가" 칩 (그리드 끝, dashed border) (→ 결정 069) | ✅ |
| 커스텀 칩 우측 × 버튼으로 제거 (선택 해제 + 목록 제거) | ✅ |
| 사용자 정의 추가는 `CategoryBottomSheet` (mode=add) 재사용, existingNames에 preset + custom 모두 전달 | ✅ |
| 추가 후 자동 선택 (선택 수가 MAX 미만일 때만, 그 외엔 칩만 추가) | ✅ |
| 칩 영역을 `ScrollView`로 변경 — 칩이 늘어나도 하단 CTA 가려지지 않음 | ✅ |
| `createInitialCategories(selected)` 기존 함수 그대로 사용 — preset/custom 구분 없이 names만 전달 | ✅ |
| TypeScript 검증 통과 | ✅ |

## 완료 (23차 — 카테고리 폴더 색상/아이콘 시스템)

| 항목 | 상태 |
|------|------|
| `supabase/migrations/004_add_category_color_icon.sql` — `categories.color`, `categories.icon` 컬럼 추가 + 기본 12개 카테고리 icon backfill | ✅ |
| `types/Category`에 `color`, `icon` nullable 필드 추가 | ✅ |
| `constants/categoryStyle.ts` 추가 — 카테고리 컬러 preset, 아이콘 preset, 기본 카테고리 icon map 관리 (→ 결정 070) | ✅ |
| `createCategory`, `updateCategory`, `createInitialCategories`가 color/icon 저장을 지원하도록 확장 | ✅ |
| `FolderCard` — 폴더 카드에 색상 탭/배경 적용, 아이콘이 있으면 기존 아이콘 위치에 `[아이콘] [폴더명]` 표시, 아이콘 없으면 폴더명만 표시 | ✅ |
| `CategoryBottomSheet` — 카테고리 추가/수정에서 이름 + 색상 + 아이콘 선택 지원. 긴 icon grid가 CTA와 겹치지 않도록 scroll 영역 높이 분리 | ✅ |
| `MoveCategorySheet` — 카테고리 변경 옵션에 컬러/아이콘 표시. 아이콘 없는 카테고리는 텍스트만 표시 | ✅ |
| `Category Detail` — 제목 옆에 선택된 카테고리 아이콘 표시, 로딩 중 `Category` fallback 제거 | ✅ |
| `ActionSheet` 핸드오프 딜레이 — Category Detail의 "카테고리 수정"도 Content Detail과 동일하게 320ms 적용 | ✅ |
| Report progress bar — 기간 필터 변경 시 모든 카테고리 bar가 다시 애니메이션되도록 animation key 보강 | ✅ |
| 홈 섹션 간격 정리 + 폴더 카드 press scale 제거로 미세한 버벅임 완화 | ✅ |
| TypeScript 검증 통과 | ✅ |

## 완료 (24차 — 카테고리 순서 수동 편집)

| 항목 | 상태 |
|------|------|
| `supabase/migrations/005_add_category_sort_order.sql` — `categories.sort_order integer nullable` + user별 `created_at` 순 backfill + `(user_id, sort_order)` 인덱스 | ✅ |
| `types/Category.sort_order` nullable 필드 추가 | ✅ |
| `getCategories` / `getCategoriesWithCounts` 정렬 → `sort_order NULLS LAST, created_at` | ✅ |
| `createCategory` — 신규 카테고리에 `max(sort_order) + 1` 자동 부여 (맨 뒤 추가) | ✅ |
| `createInitialCategories` — 삽입 순서대로 sort_order 부여 | ✅ |
| `reorderCategories(orderedIds)` 신규 — 일괄 sort_order 업데이트 (병렬 UPDATE) | ✅ |
| `app/reorder-categories.tsx` 신규 — `react-native-draggable-flatlist` 세로 리스트 드래그 편집 화면 (→ 결정 071) | ✅ |
| 폴더 탭 헤더 우상단 "순서 편집" 텍스트 버튼 (카테고리 2개 이상일 때 노출) | ✅ |
| 자동 정렬은 배제, 수동 순서 편집만 도입 (개인 아카이브 앱 특성) (→ 결정 071) | ✅ |
| 취소는 확인 Alert 없이 즉시 뒤로가기 | ✅ |
| TypeScript 검증 통과 | ✅ |

## 완료 (25차 — 문서 로그 archive 정리)

| 항목 | 상태 |
|------|------|
| `docs/archive/decisions-phase-1.md` — 결정 001~054 보존 | ✅ |
| `docs/archive/ai-usage-log-2026-06.md` — 2026년 6월 AI 사용 로그 보존 | ✅ |
| `docs/archive/progress-phase-1.md` — Phase 1 완료 기록과 출시 전 회귀 기록 보존 | ✅ |
| 루트의 `decisions.md`, `ai-usage-log.md`, `progress.md`는 현재 Phase 기록용으로 경량화 | ✅ |
| `AGENTS.md` 문서 운영 규칙을 archive 구조에 맞게 업데이트 | ✅ |

## 완료 (26차 — 카테고리 콘텐츠 뷰 타입 토글)

| 항목 | 상태 |
|------|------|
| `lib/preferences.ts` 신규 — SecureStore 기반 `ContentViewType` (`'list' \| 'grid'`) get/set (→ 결정 073) | ✅ |
| `components/GridContentCard.tsx` 신규 — 2열 grid, aspect ratio 4:3 썸네일, 선택 모드 체크박스 | ✅ |
| `app/category/[id].tsx` — 헤더 우상단 `list-outline` / `grid-outline` 토글 아이콘 (선택 모드에서는 숨김) | ✅ |
| 마운트 시 프리퍼런스 로드 → 토글 시 즉시 반영 + 비동기 저장 | ✅ |
| 리스트 렌더링 `commonProps` 추출 + `viewType === 'grid'` 분기 | ✅ |
| TypeScript 검증 통과 | ✅ |

## 완료 (27차 — 재발견/잊고있던 전체 화면 + 더보기 진입점)

| 항목 | 상태 |
|------|------|
| `app/rediscover.tsx` 신규 — `getRediscoverContents(20)` 세로 리스트 전체 화면 (→ 결정 074) | ✅ |
| `app/forgotten.tsx` 신규 — `getForgottenContents(20)` 세로 리스트 전체 화면 | ✅ |
| `components/HorizontalMoreCard.tsx` 신규 — 원형 chevron 아이콘 + "더보기" 라벨 카드. 배경 투명, 폭 56, height 183 고정 | ✅ |
| `app/(tabs)/index.tsx` — 발견/잊고있던 FlatList에 `ListFooterComponent`로 더보기 카드 부착 | ✅ |
| `app/_layout.tsx` — `rediscover`, `forgotten` Stack Screen 등록 (`slide_from_right`) | ✅ |
| 큐레이션 로직(카테고리당 최대 2개 다양성) 유지 | ✅ |
| TypeScript 검증 통과 | ✅ |

## 완료 (28차 — 재발견/잊고있던 세션 안정성)

| 항목 | 상태 |
|------|------|
| `app/(tabs)/index.tsx` — `loadData`를 `loadFresh`(최근 + Insight) / `loadDiscovery`(발견 + 잊고있던)로 분리 (→ 결정 075) | ✅ |
| `useFocusEffect`는 `loadFresh`만 실행. discovery는 `discoveryLoadedRef` false일 때만 (세션 첫 마운트) | ✅ |
| `content-saved` / `content-classified` 이벤트: `loadFresh`만 (discovery는 `minAgeDays`/14일 조건상 재페치 무의미) | ✅ |
| `content-deleted` 이벤트: payload id들로 로컬 배열 filter (서버 왕복 없음) | ✅ |
| AppState 리스너 — 30분 이상 백그라운드 후 active 복귀 시 `loadDiscovery` 재실행 | ✅ |
| `RefreshControl` — pull-to-refresh로 fresh + discovery 병렬 재페치 | ✅ |
| `lib/events.ts` — `emit(event, payload?)` 시그니처 확장 (하위 호환) | ✅ |
| `lib/api.ts` — `deleteContent(id)` → `emit('content-deleted', [id])`, `deleteContents(ids)` → `emit('content-deleted', ids)` | ✅ |
| TypeScript 검증 통과 | ✅ |

## 완료 (29차 — UI 폴리시)

| 항목 | 상태 |
|------|------|
| `app/search.tsx` — 검색 박스에 `height: 40` 고정 + `TextInput`에 `padding: 0`. 값 입력 시 intrinsic height 변동으로 박스가 흔들리는 문제 해소 | ✅ |
| `app/(tabs)/report.tsx` — 리포트 기간 필터 라벨 `'14일'` → `'2주'`. 홈 Interest Insight의 "최근 2주" 표기와 통일, 리포트 내부 `일주일 / 2주 / 한달` 자연 단위로 일관 | ✅ |
