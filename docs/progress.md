# Nook 개발 진행 상태

최종 업데이트: 2026-07-01 (25차 — 문서 로그 archive 정리)

> v1.0.0 MVP 정식 출시 완료. 이후 작업은 Phase 2 범위 (현재 v1.1.0).
> Phase 1 완료 기록은 `docs/archive/progress-phase-1.md`에 보관합니다.

## 현재 상태

| 항목 | 상태 |
|------|------|
| 현재 Phase | Phase 2 / v1.1.0 |
| 최근 앱 작업 | 24차 — 카테고리 순서 수동 편집 |
| 최근 문서 작업 | 25차 — 문서 로그 archive 정리 |
| 현재 기록 파일 | `docs/decisions.md`, `docs/ai-usage-log.md`, `docs/progress.md` |
| Archive 위치 | `docs/archive/` |

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

## Phase 2 범위

### A. Phase 1 검토 발견 이슈 (우선순위 후보)

| 항목 | 상태 / 비고 |
|------|------|
| 온보딩 화면에서 카테고리 직접 추가 | ✅ 22차 완료 (결정 069). "+ 직접 추가" 칩 + CategoryBottomSheet 재사용 |
| 카테고리 순서 변경 | ✅ 24차 완료 (결정 071). 수동 정렬만 도입. 편집 전용 2depth 화면 + `react-native-draggable-flatlist` 세로 리스트 드래그. 자동 정렬 옵션(이름순/저장순/최근순)은 백로그 유지 |
| Rediscover 알고리즘 재고민 | ✅ 21차 완료 (결정 067). 정의를 "안 본 콘텐츠"에서 "관심사 기반 + 한동안 안 들여다본 콘텐츠"로 변경 |
| 리스트 viewType 설정 (콘텐츠) | 미완료. Category Detail / Recent Saved / Search 등 콘텐츠 리스트에서 그리드 ↔ 리스트 전환 옵션 |
| 폴더 목록 뷰 토글 (카테고리) | 미완료. 폴더 탭 자체를 그리드(현재) ↔ 리스트로 전환. 컬러/아이콘 시스템 도입 후 리스트에서도 시각 구분 유지 가능. v1.1.0 스코프에서는 제외 |
| 카테고리 아이콘 세트 교체 검토 | 미완료. 현재 Ionicons `-outline` 28개. 웹 배포까지 통일된 톤을 위해 Lucide(웹 호환) 또는 Feather로 교체 검토. SF Symbols는 iOS 전용이라 배제 |
| 오래된 링크 정리 제안 | 검토 필요. 링크 앱 특성상 저장된 링크의 수명 관리가 중요함. 자동 삭제보다는 "오래 안 본 링크 정리 후보"를 제안하고 사용자가 삭제/유지/보관을 선택하는 방향이 안전 |

### B. CLAUDE.md 2차 범위 (1차 완료 + 남은 항목)

| 항목 | 상태 / 비고 |
|------|------|
| Forgotten Content | ✅ 1차 완료 (§055) |
| Report | ✅ 1차 완료 (§056~061). 2차 — 주차별 흐름, AI 코멘트는 별도 |
| Interest Insight | ✅ 홈 카드로 1차 완료 (§068). Report 2차에서 정적 분석 형태 추가 검토 가능 |
| 푸시 알림 | 미정. Forgotten/Rediscover와 연결 가능 |
| 소셜 공유 | 미정 |
| 태그 필터링 | 미정. 현재 tags는 `text[]`로 저장만 됨 (CLAUDE.md 데이터 모델 참조) |
| 카카오 로그인 | 미정 |
| AI 요약 | 미정. AI 단일 호출 원칙(태그+카테고리)과 별도 호출로 분리 필요 |
| 미분류 관리 장치 | 미정. 미분류 방치 방지 UX 검토 |

### C. 기존 백로그

| 항목 | 비고 |
|------|------|
| 카테고리 폴더 컬러칩 | ✅ 23차 1차 완료. `categories.color/icon` 컬럼 + 폴더 카드/이동 시트/수정 시트 반영. 향후 필요 시 정렬/리스트 뷰와 함께 고도화 |
| 다른 플랫폼 본문 복구 | X는 oEmbed fallback, Notion은 public page API로 보강 완료. Naver Blog / Medium / Velog 본문 복구는 필요 시 별도 평가 |
| 링크 수명 관리 | 1차는 수동 삭제 UX 유지/강화. 2차는 `viewed_at`/`saved_at` 기준 정리 후보 섹션, 일괄 선택, 보관 또는 삭제 검토. 완전 자동 삭제는 opt-in + 복구 기간이 있을 때만 Phase 3로 검토 |

### D. 플랫폼 확장 — 웹 + Chrome 확장 (Phase 2~3)

플랫폼 로드맵상 iOS 앱 다음 우선순위. 사용자 핵심 니즈: **모바일에서 저장 + 데스크탑에서 조회**.

**역할 분리 (사용자 페르소나 기반)**

| 플랫폼 | 역할 | 저장 방식 |
|------|------|------|
| iOS 앱 | 저장(주) + 조회 | Share Extension (현재 운영 중) |
| 데스크탑 웹 | 조회(주) + URL 직접 입력 저장 | iOS와 동일한 Save UI 1개 (URL만 입력, AI 분류 맡김) |
| Chrome 확장 | 현재 페이지 1-클릭 저장 | popup의 "이 페이지 저장" 버튼 |

→ 저장 진입은 3가지: **iOS 공유 / 웹 URL 입력 / Chrome 확장 1-클릭**

**접근 방식 권장: RN Web (Expo Web) + Chrome 확장 별 빌드**

- 웹은 RN Web으로 현재 컴포넌트 재사용 (홈/폴더/Report/Search/Content Detail + Save Bottom Sheet)
- 데스크탑 반응형 우선 (≥1024px). 모바일 웹은 보조 (iOS 앱 있으니까)
- Chrome 확장은 manifest v3, 가벼운 popup UI + Edge Function 호출
- 웹 Save Bottom Sheet는 iOS 컴포넌트 그대로 재사용 — 데스크탑은 화면 중앙 모달, 모바일 웹은 바텀시트로만 분기

**아키텍처 영향 — 백엔드 재구조화 (선결 작업)**

웹/확장 착수 전 Supabase Edge Function으로 이전해야 할 것:

1. **메타데이터 추출 Edge Function** — 현재 `lib/metadata.ts`의 fetch + parsing 로직 이전. iOS도 함께 사용 → 보안 ↑, CORS 회피
2. **AI 분류 Edge Function** — 현재 `lib/ai.ts`의 Anthropic 직접 호출을 Edge Function 경유로. API 키 서버 보관 (브라우저 노출 차단)
3. (선택) **AI 분류 트리거 자동화** — 콘텐츠 INSERT 시 Supabase webhook/trigger로 Edge Function 자동 호출 → iOS/Web/확장 모두 단순히 raw insert만 하면 됨

이 작업은 웹 안 가도 iOS 보안 개선으로 가치 있음 (결정 004에서 이미 "프로덕션에서는 Edge Function 권장" 언급).

**검토할 의존성 / 대체 필요 영역 (웹)**

| 영역 | iOS 현 동작 | 웹 대응 |
|------|-----------|-----------|
| Google 로그인 | expo-auth-session | Supabase OAuth 리다이렉트 |
| Apple 로그인 | expo-apple-authentication (네이티브) | Sign in with Apple JS |
| 세션 저장 | expo-secure-store | localStorage / cookie session |
| 메타데이터 fetch | 클라이언트 fetch | Edge Function (선결 작업으로 해결) |
| AI 분류 | 클라이언트 Anthropic 호출 | Edge Function (선결 작업으로 해결) |
| 원문 바로가기 (앱 scheme) | Linking.openURL + LSApplicationQueriesSchemes | `window.open` 새 탭 |
| 바텀시트 키보드 회피 | Reanimated 4 useAnimatedKeyboard | 데스크탑은 모달 패턴 (저장 UI 없으니 사용 빈도 ↓) |
| 푸시 알림 (향후) | expo-notifications | Web Push API |
| 디자인 토큰 / 컴포넌트 | 그대로 | 그대로 사용, 데스크탑 레이아웃만 추가 |

**Chrome 확장 범위**

- manifest v3, popup UI (작은 카드)
- 현재 탭 URL 자동 캡처 → 옵션으로 카테고리/태그 미리 지정 가능
- Supabase Auth 토큰을 chrome.storage에 저장 (확장 첫 진입 시 웹 로그인 페이지로 보내 토큰 받아옴)
- 저장 = Edge Function `/save-content` POST → DB insert → AI 분류 트리거 (자동)
- "저장 완료" Toast 후 popup 자동 닫힘

**단계 분할 (확정 범위)**

| 단계 | 작업 | 예상 |
|------|------|------|
| **A. 백엔드 재구조화** | 메타 추출 + AI 분류 Edge Function 이전. iOS 클라이언트도 Edge Function 호출하도록 마이그레이션. 분류 자동 트리거 검토 | 1~2주 |
| **B. RN Web** | 로그인(OAuth 리다이렉트) + 홈/폴더/Report/Search/Content Detail + Save Bottom Sheet(URL 직접 입력) + 데스크탑 반응형 디자인 | 3~4주 |
| **C. Chrome 확장** | manifest v3, popup, URL 캡처, 인증 토큰 공유, 저장 API 호출, 결과 Toast | 2주 |

**총 예상**: 6~8주 (디자이너/QA 비용 별도)

**핵심 결정 포인트 (착수 전)**

1. 백엔드 재구조화 시점 — 웹 착수 전 선결 (안전) vs 웹과 병렬 (빠름)
2. 모바일 웹 지원 수준 — 데스크탑만 우선? 아니면 반응형으로 모바일 웹도?
3. Chrome 확장 인증 — 웹 로그인 후 토큰 공유 vs 확장 내 독립 로그인
4. 디자인 — 데스크탑 레이아웃 시안을 새로 디자인할지, iOS 화면 그대로 stretch할지

**리스크 / 트레이드오프**

- 백엔드 재구조화는 iOS 회귀 테스트 부담이 있음 (저장 → 메타 → AI 흐름 전체 재검증)
- RN Web의 데스크탑 UX 한계 — 컴포넌트는 동작하지만 "데스크탑답지 않은" 느낌 가능. 데스크탑 전용 디자인 시안이 결과 품질을 좌우
- Chrome 확장 인증 토큰 공유는 보안/UX 균형이 까다로움 — Supabase Auth의 magic link 또는 web 로그인 → 토큰 deep link 패턴 검토 필요

## 기술 메모

- expo CLI 경로: `node node_modules/expo/bin/cli` (npx expo 안 됨)
- npm install 시 `--legacy-peer-deps` 필요
- Share Extension은 Expo Go 불가, Development Build 필요
- .env 변수: EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY, EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID, EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID, EXPO_PUBLIC_ANTHROPIC_API_KEY
- Supabase DB 스키마 이미 적용됨 (재실행 금지)
- Auth: Google + Apple 소셜 로그인 (Supabase signInWithIdToken)
- Apple 로그인: 네이티브 방식 (expo-apple-authentication + nonce), Secret Key 불필요
