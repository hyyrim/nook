# Nook 개발 진행 상태

최종 업데이트: 2026-06-29 (22차 — 온보딩 카테고리 직접 추가)

> v1.0.0 MVP 정식 출시 완료. 이후 작업은 Phase 2 범위 (현재 v1.1.0).

---

## 완료

| 항목 | 상태 |
|------|------|
| Phase 1: Expo Router + 프로젝트 구조 세팅 | ✅ |
| Phase 3: 모든 화면 UI 구현 (Home~Profile) | ✅ |
| app/onboarding.tsx — Google 로그인 화면 | ✅ |
| app/choose-interests.tsx — 카테고리 칩 선택 | ✅ |
| lib/supabase.ts — Supabase 클라이언트 (SecureStore) | ✅ |
| lib/auth.ts — Google Auth 훅 (expo-auth-session) | ✅ |
| lib/AuthProvider.tsx — 세션 Context + 라우팅 가드 | ✅ |
| supabase/migrations/001_initial_schema.sql | ✅ |
| lib/api.ts — 데이터 접근 함수 (CRUD 전체) | ✅ |
| lib/utils.ts — 시간 포맷, placeholder 색상 유틸 | ✅ |
| 화면 데이터 연동 (mock → Supabase) 전체 | ✅ |
| Phase 4: AI 분류 (lib/ai.ts + prompts/) | ✅ |
| Phase 4: Share Extension (expo-share-intent) | ✅ |

## 완료 (2차)

| 항목 | 상태 |
|------|------|
| AI 모델 ID 수정 (claude-haiku-4-5-20251001) | ✅ |
| 저장 후 홈/폴더 실시간 새로고침 (이벤트 시스템) | ✅ |
| Library 카테고리별 콘텐츠 수(n saved) 표시 | ✅ |
| 인스타그램 등 HTML 엔티티 제목 깨짐 수정 | ✅ |
| react-native-worklets 추가 + expo run 전환 | ✅ |

## 완료 (3차)

| 항목 | 상태 |
|------|------|
| Instagram 제목 개선 (다단계 캡션 추출 + AI 제목 생성) | ✅ |
| Unicode 이스케이프 디코딩 (\\uXXXX) | ✅ |
| 출처 친화적 표시 (formatSource: Instagram, YouTube 등) | ✅ |
| Share Extension Unmatched Route 수정 (+not-found.tsx) | ✅ |
| Share intent 저장 Alert → Toast 알림 교체 | ✅ |
| Share intent 썸네일 추출 개선 (fetchLinkMetadata 직접 사용) | ✅ |
| Rediscover 카드 썸네일 표시 | ✅ |
| Content Detail 카테고리 변경 기능 (MoveCategorySheet) | ✅ |
| Content Detail 카테고리 변경 실시간 반영 | ✅ |
| Library grid 2열 레이아웃 기기 검증 | ✅ |

## 완료 (4차 — Phase 1 마감 전 시뮬레이션 반영)

| 항목 | 상태 |
|------|------|
| Home Rediscover 빈 상태 보완 | ✅ |
| Content Detail 원문 바로가기 위치 조정 | ✅ |
| Content Detail description 줄바꿈 보존 | ✅ |
| 긴 description More/접기 처리 | ✅ |
| Content Detail 제목 수정 Bottom Sheet 추가 | ✅ |
| 카테고리 변경 Bottom Sheet 딜레이 제거 및 애니메이션 조정 | ✅ |
| 인증 세션 확인 전 데이터 로드 방지 | ✅ |

## 완료 (5차 — Auth hardening + iOS 배포 준비)

| 항목 | 상태 |
|------|------|
| 라우팅 가드 카테고리 기반 3단 분기 (session + 카테고리 유무) | ✅ |
| onboarding에서 직접 navigate 제거, 가드에 위임 | ✅ |
| createInitialCategories 중복 생성 방지 | ✅ |
| AuthProvider getSession 에러 핸들링 | ✅ |
| Apple 로그인 구현 (expo-apple-authentication + Supabase) | ✅ |
| onboarding에 Apple 로그인 버튼 추가 | ✅ |
| EAS Build 설정 (eas.json) | ✅ |
| 앱 아이콘, 스플래시, 홈 로고 브랜드 에셋 교체 | ✅ |
| 온보딩 화면 아이콘+슬로건 레이아웃 적용 | ✅ |
| 홈 화면 검색 기능 구현 (전체 콘텐츠 title/domain/tags 검색) | ✅ |
| 계정 삭제 기능 (Profile → Delete Account, Supabase RPC) | ✅ |
| Privacy Policy / Terms of Service 링크 연결 (Profile + Onboarding) | ✅ |
| Supabase Apple provider 설정 | ✅ |
| Smoke testing (신규/기존 유저, 로그아웃, 저장, 카테고리 CRUD) | ✅ |
| MVP 백로그 현행화 | ✅ |
| 태그 수정 기능 MVP에서 제외 → 추후 구현 | ✅ |

## 완료 (6차 — UI 한글화 + 홈 화면 개선)

| 항목 | 상태 |
|------|------|
| 전체 UI 한글화 (~해요 톤, 법적 문구는 ~합니다체) | ✅ |
| Library/라이브러리 → 폴더 명칭 통일 (탭, 화면, 문서) | ✅ |
| 탭 아이콘 library → folder 변경 | ✅ |
| Content Detail 카테고리 아이콘 grid → folder 변경 | ✅ |
| 홈 검색바 제거 → 상단 우측 검색 아이콘으로 변경 | ✅ |
| Rediscover → 다시 볼 콘텐츠 한글화 | ✅ |
| 다시 볼 콘텐츠 빈 상태 문구 + placeholder UI 개선 | ✅ |
| Profile 계정 삭제 → 계정 설정 2depth 라우트로 이동 | ✅ |
| 계정 설정 페이지 추가 (이메일, 로그인 방식, 로그아웃, 계정 삭제) | ✅ |

## 완료 (7차 — UX 개선 + 알고리즘 고도화)

| 항목 | 상태 |
|------|------|
| 저장 완료 successCircle 색상 Colors.success 통일 | ✅ |
| 링크 저장 시 URL 유효성 검사 + 에러 안내 문구 | ✅ |
| 카테고리 추가/수정 시 중복 이름 방지 | ✅ |
| errorText 스타일 Typography 상수로 통합 | ✅ |
| 2depth 페이지 타이틀 iOS 설정 스타일 (센터 17px) | ✅ |
| 1depth 탭 타이틀 26px로 조정 | ✅ |
| Typography에 pageTitle/navTitle 상수 추가 + CLAUDE.md 반영 | ✅ |
| 홈 로고 사이즈 조정 (110x42) + 검색 아이콘 수평 정렬 | ✅ |
| 발견된 콘텐츠 알고리즘 개선 (관심도×망각도+다양성) | ✅ |
| 발견된 콘텐츠 14일 기간 제한 | ✅ |
| 원문 바로가기 네이티브 앱 연동 (openInAppOrBrowser) | ✅ |
| 관련 콘텐츠 알고리즘 개선 (카테고리+태그+도메인 복합 점수) | ✅ |
| 관련 콘텐츠 최소 점수 2점 이상만 표시 | ✅ |

## 완료 (8차 — 바텀시트 키보드 회피)

| 항목 | 상태 |
|------|------|
| Reanimated 4 `useAnimatedKeyboard`로 SaveBottomSheet paddingBottom 동기 | ✅ |
| `handleClose`에서 `Keyboard.dismiss()` 호출 → 키보드↓ + 시트↓ 동시 동작 | ✅ |
| CategoryBottomSheet 동일 패턴 적용 | ✅ |
| ContentTitleSheet 동일 패턴 적용 (multiline input) | ✅ |

## 완료 (9차 — Content Detail 태그 수정)

| 항목 | 상태 |
|------|------|
| TagsSheet 컴포넌트 추가 (chip + input, useAnimatedKeyboard 패턴 재사용) | ✅ |
| 칩 × 탭으로 태그 삭제, 인풋 + "+" 또는 키보드 done으로 추가 | ✅ |
| 검증: 중복 차단(case-insensitive) / 20자 / 최대 10개 | ✅ |
| ActionSheet에 "태그 수정" 항목 추가 (제목 ↔ 카테고리 사이) | ✅ |

## 완료 (10차 — 폴더 상세 다중 편집)

| 항목 | 상태 |
|------|------|
| ContentCard에 selectionMode / selected props 추가 (체크 원형 표시) | ✅ |
| 우상단 진입: 일반 폴더는 `…` → "선택", 미분류는 텍스트 버튼 직접 | ✅ |
| 선택 모드 헤더: `[취소] n개 선택됨/항목 선택 [전체 선택/전체 해제]` | ✅ |
| 선택 모드 진입 시 검색어 초기화 → 전체 선택 범위를 폴더 전체로 보장 | ✅ |
| 하단 고정 액션 바: 카테고리 이동 / 삭제 (선택 0개면 비활성화) | ✅ |
| MoveCategorySheet 재사용 (currentCategoryId 안 넘김 → 다중 이동 모드) | ✅ |
| 카테고리 조회 실패 시 옵션 차단 + 오류 안내/재시도 | ✅ |
| Optimistic UI + LayoutAnimation으로 부드러운 사라짐 (260ms easeInOut) | ✅ |
| 단일 Supabase bulk 요청 + 실패 시 snapshot 복원/Alert | ✅ |
| 현재 폴더로 이동 시 no-op (시트만 닫음) | ✅ |

## 완료 (11차 — 카테고리 추가 UX + 라벨 명확화)

| 항목 | 상태 |
|------|------|
| 폴더 탭에서 카테고리 추가 시 새 카드로 자동 스크롤 (`scrollToEnd`) | ✅ |
| MoveCategorySheet 옵션 마지막에 "+ 새 카테고리 만들기" 추가 | ✅ |
| 인라인 추가 → `CategoryBottomSheet` (mode=add) → 추가 후 자동 선택 + 시트 닫힘 | ✅ |
| Category Detail ActionSheet 라벨 명확화 (`수정`→`카테고리 수정`, `삭제`→`카테고리 삭제`) | ✅ |

## 완료 (12차 — 빈 상태/에러 통일 + 신규 유저 환영 카드)

| 항목 | 상태 |
|------|------|
| `EmptyState` 공통 컴포넌트 추가 (아이콘 + 제목 + 부제목 통일 디자인) | ✅ |
| `ErrorState` 공통 컴포넌트 추가 (다시 시도 버튼 포함) | ✅ |
| Home / Library / Recent Saved / Search / Category Detail 5개 화면에 적용 | ✅ |
| 각 화면 `loadData`에 `loadError` state 추가 + 실패 시 재시도 UI | ✅ |
| 신규 유저 홈(콘텐츠 + 발견 둘 다 0) 환영 카드 + 3개 사용 팁 표시 | ✅ |

## 완료 (13차 — 2depth 헤더 NavHeader 컴포넌트로 통일)

| 항목 | 상태 |
|------|------|
| `NavHeader` 공통 컴포넌트 추가 (title + backLabel? + rightAction?) | ✅ |
| Typography.navTitle (17/600) 적용, height 44, paddingHorizontal 12 | ✅ |
| rightAction은 icon 버튼 또는 text 버튼 슬롯으로 분기 | ✅ |
| Category Detail 일반 모드 헤더에 적용 (selectionMode 헤더는 유지) | ✅ |
| Recent Saved / Account Settings 헤더에 적용 | ✅ |
| Content Detail (floating nav) / Search (input 헤더) 제외 — 의도된 패턴 | ✅ |

## 완료 (14차 — Instagram 릴스 메타데이터 + 원문 바로가기 처리)

| 항목 | 상태 |
|------|------|
| 죽은 Instagram oEmbed 호출 제거 (`fetchInstagramOEmbed`) — token 필수로 사실상 항상 실패 | ✅ |
| HTML 파싱 경로로 캡션 추출 일원화 (`extractInstagramCaption`은 유지) | ✅ |
| 캡션 추출 실패 시 `Instagram 릴스`/`Instagram 게시물` fallback은 그대로 — 추측 생성 금지 원칙 유지 | ✅ |
| 릴스 캡션 추출: Instagram fetch를 두 단계로 — 1차 facebookexternalhit(응답 HTML `"caption":{"text":"..."}` JSON 전문), 2차 Slackbot(og:description 짧은 인용 폴백) | ✅ |
| `extractInstagramCaptionFromHtml` — 현재 media 객체 marker(`__isXIGPolarisMedia`) + URL shortcode 우선 매칭. fallback으로 `caption → code` 1500자 매칭 유지. 추천 게시물 오염 방지 (→ 결정 038) | ✅ |
| 통계/깨진 캡션 fallback 차단 — `isBadInstagramMetadataText`로 `조회/views/좋아요/likes/댓글/comments` 통계 문구나 `�` 깨진 문자 포함 시 title/description 승격하지 않음 (→ 결정 037) | ✅ |
| 닫는 따옴표 없이 잘린 Slackbot caption도 추출하되 깨진 문자 포함 시 버림 | ✅ |
| 기존 저장 레코드 자동 정리: Content Detail 진입 시 placeholder(`Instagram 릴스`) 또는 오염된 metadata면 `refreshContentMetadata`로 새 caption 교체 | ✅ |
| `GENERIC_TITLE_PATTERNS`에 한국어 패턴(`^Instagram(의|에서)`) 추가 — link-preview bot 응답이 `"Instagram의 ..."` 형식일 때도 generic 판정되어 caption 추출 분기로 진입 | ✅ |
| 원문 바로가기 Instagram 경로 하이브리드: 앱 설치 시 Universal Link (`Linking.openURL(https)`) → 미설치 시 SFSafariViewController fallback | ✅ |
| 다른 사이트(YouTube/X/Naver/TikTok 등)의 앱 scheme 동작은 결정 020 그대로 유지 | ✅ |

## 완료 (15차 — 다른 플랫폼 메타데이터 추출 일반화)

| 항목 | 상태 |
|------|------|
| 데스크 리서치 — X/Threads/TikTok/LinkedIn/Medium/Velog/Naver Blog/YouTube/Brunch 9개 플랫폼에 대해 4개 UA(default/fb/slack/twitterbot)로 og 응답 비교 | ✅ |
| 발견: YouTube/Brunch만 정상 추출, 나머지는 봇 차단(X)·로그인 게이트(Threads/LinkedIn)·Cloudflare(Medium)·CSR(Velog)·iframe(Naver Blog) 등으로 빈 값/generic 응답 | ✅ |
| `isBadInstagramMetadataText` → `isBadMetadataText`로 일반화 + 플랫폼별 generic title 패턴 21종 추가 (`Threads • Log in`, `Just a moment...`, `X / ?`, `TikTok - Make Your Day`, `Visit TikTok…`, `Join Threads…`, `Top Career Content from LinkedIn`, `네이버 블로그`, 단독 플랫폼명 등) | ✅ |
| `instagramFallbackTitle` → `platformFallbackTitle(url)`로 일반화. 호스트별 한국어 fallback 매핑 (X 게시물 / Threads 게시물 / TikTok 영상 / LinkedIn 게시물 / Medium 글 / Velog 글 / 네이버 블로그 글 / 브런치 글) | ✅ |
| `parseMetadata`의 description as title 분기를 모든 플랫폼으로 확장 (이전엔 Instagram 전용). title이 generic/오염이면 caption → description → platformFallbackTitle 순으로 강등 | ✅ |
| `parseMetadata`의 description 오염 차단도 모든 플랫폼으로 확장 (이전엔 Instagram 전용) | ✅ |
| `lib/api.ts`의 `isInstagramMetadataPolluted` → `isMetadataPolluted`, `isInstagramPlaceholderTitle` → `isPlaceholderTitle` (도메인 무관, `platformFallbackTitle` 일치 검사). 모든 플랫폼의 오염된 기존 레코드 자동 정리 | ✅ |
| `app/content/[id].tsx`의 `isPollutedInstagramMetadata` → `isPollutedMetadata`. Content Detail 진입 시 모든 플랫폼 오염 레코드를 `refreshContentMetadata`로 재시도 | ✅ |
| 시뮬레이션 검증 — 9개 플랫폼 e2e fetch에서 YouTube/Brunch는 그대로 정상, Threads/X/TikTok/LinkedIn/Medium/Velog는 "X 게시물" 같은 깔끔한 fallback으로 강등됨을 확인 | ✅ |
| **실기기 1차 검증 후 보강**: Threads "Threads의 …(@handle)님" / X "X에서 …(@handle) 님" 형식 계정명 generic이 통과 → `GENERIC_TITLE_PATTERNS`에 Threads/X/TikTok 패턴 + 공통 꼬리 `(@handle) 님` 추가. TikTok `vt.tiktok.com`/`vm.tiktok.com` 단축 도메인은 fallback 매칭에 누락 → `endsWith('.tiktok.com')`로 확장 | ✅ |
| **실기기 2차 검증 후 보강 (Phase 1.2)**: Threads/X가 og:title과 og:description에 동일한 generic 텍스트를 함께 내려보내 description-as-title 폴백이 같은 쓰레기 텍스트를 흘려보냄 → `parseMetadata`에 `isGenericDesc` 분기 추가해 generic description도 차단. `lib/ai.ts`의 inline `isGenericTitle` 중복 제거하고 `isGenericPlatformTitle`로 단일화 | ✅ |
| **실기기 3차 검증 후 보강**: Threads 한글 로그인 게이트 `Threads • 로그인` 패턴이 영문(`Log in`)만 매칭되어 누락 → `BAD_METADATA_GENERIC_PATTERNS`에 한글 패턴 추가. `threads.com` 도메인이 `PLATFORM_FALLBACK_TITLES`에 누락(`threads.net`만 등록)되어 폴백 미적용 → `threads.com` 추가 | ✅ |
| Phase 2(본문 복구 — Naver iframe / X syndication / Velog API / Threads 봇 UA 시도)는 노력 대비 효용 별건으로 분리 — 백로그 유지 | ✅ |

## 완료 (16차 — Analytics 측정 명세 + 이벤트 수집)

| 항목 | 상태 |
|------|------|
| `docs/analytics-plan.md` 측정 명세서 — 가설(H1/H2/H3), 운영 지표, 이벤트 사전, 데이터 확인 방법(§11), 구현 결정 사항(§12) | ✅ |
| `supabase/migrations/003_analytics_events.sql` — analytics_events 테이블 + RLS + 인덱스 | ✅ |
| `lib/analytics.ts` — 트래커 모듈. user_id/occurred_at/app_version/event_version/session_id 자동 주입, silent fail, 세션 30초 룰, rediscover_impression 세션당 사용자당 dedup | ✅ |
| `app/choose-interests.tsx` — `onboarding_completed` 카테고리 생성 직후 발화 (§12.1) | ✅ |
| `app/_layout.tsx` — `app_opened` AppState 리스너 + share intent 감지 기반 entry_source 분기 (§12.2) | ✅ |
| `lib/api.ts` `saveContent` — `save_attempted`/`save_failed` 발화, 에러 → failure_reason 분류 헬퍼 추가 | ✅ |
| `app/(tabs)/index.tsx` — Rediscover 가로 ScrollView → FlatList horizontal + onViewableItemsChanged로 viewport 진입 감지 (§12.4) | ✅ |
| `app/content/[id].tsx` — `content_opened` 마운트 시 발화, source 파라미터 type-safe 정규화 + 'direct' 폴백 (§12.5) | ✅ |
| Content Detail 진입부 6곳 source 명시: Home recent='recent', Home Rediscover='rediscover', recent-saved='recent', Category Detail='category', Search='search', Related='related' (검색과 관련 콘텐츠는 행동 의미가 달라 `library` 단일 묶음에서 분리) | ✅ |
| `docs/analytics-queries/` — H1/H2/H3 + 운영 지표 4종(저장 성공률/중복/재방문/진입 경로) SQL 7개 + README | ✅ |
| 실기기 검증 — 6개 이벤트 발화 확인, RLS 검증 | 미완료 (실기기 테스트 필요) |

## 완료 (17차 — 플랫폼 링크 저장 실기기 검증 + X/Notion 보강)

| 항목 | 상태 |
|------|------|
| 실기기 링크 저장 검증: Instagram / YouTube / X / Threads / Notion / Naver Blog / Medium / Velog | ✅ |
| X 게시물 본문 추출 — `<title>`의 `작성자 on X: "본문" / X` 래퍼 제거 | ✅ |
| X 앱 공유 generic meta가 서버 fetch를 막는 문제 수정 — meta가 generic/fallback뿐이면 fetch 계속 진행 | ✅ |
| X iOS/RN fetch 실패 대비 `publish.twitter.com/oembed` fallback 추가 | ✅ |
| X 원문 바로가기 — `twitter://open...` 제거, HTTPS Universal Link 우선 | ✅ |
| Notion 공유 링크 저장 — page ID 기반 `loadPageChunk`로 title/description 추출 | ✅ |
| Notion generic OG metadata 차단 + URL slug fallback (`Notion 페이지` / `My Project Plan` 등) | ✅ |
| Notion cover/thumbnail 없을 때 UI 문서 placeholder 표시 (리스트, Rediscover, Content Detail) | ✅ |
| Notion 원문 바로가기 — `*.notion.site`는 앱 scheme 강제 없이 인앱 브라우저로 열어 Safari bounce 방지 | ✅ |
| `docs/decisions.md` 결정 042~045 기록 + `docs/ai-usage-log.md` 2026-06-22 작업 로그 반영 | ✅ |

## 완료 (18차 — URL 정규화 + Toast 단일 채널 통일)

| 항목 | 상태 |
|------|------|
| `normalizeUrl` 추적 파라미터(si/utm_*/fbclid/gclid/igshid/s) 블랙리스트 제거 (→ 결정 048) | ✅ |
| YouTube URL 캐논 정규화 — youtu.be / shorts / m.youtube.com → `youtube.com/watch?v=` 통합 (→ 결정 053) | ✅ |
| Notion 호스트 정규식 일괄 매칭 (`app.notion.com` 등 서브도메인 포함) (→ 결정 049) | ✅ |
| Instagram 원문 바로가기 cold-start 대응 — `instagram://media?id=` deep-link 1순위 (→ 결정 050) | ✅ |
| 썸네일 placeholder 단일 색상(`#DDD7CE`)으로 통일 (→ 결정 051) | ✅ |
| 저장 결과 Toast 단일 채널로 통일 — Save Bottom Sheet의 Alert/시트 내부 success UI 제거 (→ 결정 052) | ✅ |
| Share Intent 저장 중 `저장 중...` 로딩 Toast 표시 (→ 결정 054) | ✅ |

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

## 완료 (출시 전 회귀 — 2026-06-25 이전)

| 항목 | 상태 |
|------|------|
| Analytics 실기기 검증 — 6개 이벤트(`app_opened`, `save_attempted`, `save_failed`, `rediscover_impression`, `content_opened`, `onboarding_completed`) Supabase 적재 확인 | ✅ |
| Auth / Onboarding 회귀 테스트 — 신규 유저, 기존 유저, 로그아웃 후 재진입, 카테고리 0개 유저, 계정 삭제 후 재가입 | ✅ |
| 저장 품질 회귀 — 저장 → AI 분류 → 폴더 반영 → Content Detail → 원문 바로가기 | ✅ |
| App ID에 Sign In with Apple capability 활성화 | ✅ |
| Apple 로그인 실기기 테스트 | ✅ |
| Share Intent 배포 회귀 테스트 (TestFlight 빌드) | ✅ |
| eas.json submit 정보 (appleId, ascAppId, appleTeamId) | ✅ |
| EAS Build → TestFlight → App Store 제출 | ✅ |

## Phase 2 범위

### A. Phase 1 검토 발견 이슈 (우선순위 후보)

| 항목 | 상태 / 비고 |
|------|------|
| 온보딩 화면에서 카테고리 직접 추가 | 미완료. 온보딩에서 preset 12개 외 사용자 정의 카테고리 추가 허용 |
| 카테고리 순서 변경 | 미완료. 사용자가 폴더 순서를 직접 정렬. UX는 미정 (드래그 vs 정렬 옵션 필터). DB 스키마 `categories.sort_order` 컬럼 필요 |
| Rediscover 알고리즘 재고민 | ✅ 21차 완료 (결정 067). 정의를 "안 본 콘텐츠"에서 "관심사 기반 + 한동안 안 들여다본 콘텐츠"로 변경 |
| 리스트 viewType 설정 (콘텐츠) | 미완료. Category Detail / Recent Saved / Search 등 콘텐츠 리스트에서 그리드 ↔ 리스트 전환 옵션 |
| 폴더 목록 뷰 토글 (카테고리) | 미완료. 폴더 탭 자체를 그리드(현재) ↔ 리스트로 전환. 컬러/아이콘 시스템 도입 후 리스트에서도 시각 구분 유지 가능. v1.1.0 스코프에서는 제외 |
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
| 카테고리 폴더 컬러칩 | 각 카테고리에 컬러 지정해 폴더 카드/Content Detail에서 시각 구분. DB 스키마 `categories.color` 컬럼 필요 |
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

## 보류 / 시도 기록

### 바텀시트 키보드 회피 (2026-06-16 시작 → 2026-06-17 해결)

**증상**: iOS 실기기에서 SaveBottomSheet, CategoryBottomSheet, ContentTitleSheet의 TextInput에 focus 시 키보드가 올라와 input과 CTA 버튼을 가림. 입력 중인 텍스트가 안 보임.

**시도 1 — 수동 Animated translateY + Keyboard listener (codex, 이전 작업)**
- 결과: 키보드 등장과 시트 위치 동기가 안 맞아 버벅임. 시트가 키보드 위로 떠오를 때 top border-radius가 화면 중앙에 어색하게 위치. 원복함.

**시도 2 — @gorhom/bottom-sheet v5.2.14로 SaveBottomSheet PoC (원복)**
- `BottomSheetModalProvider` + `BottomSheetModal` + `BottomSheetTextInput` + `keyboardBehavior="interactive"` 구성
- 증상: + 버튼 탭 시 `present()`는 호출되나(`visible= true ref= true` 로그 OK) 모달이 mount/animate 안 됨(`onChange` 미발생, 화면 변화 없음)
- 시도한 디버그: `enableDynamicSizing` off + 명시 `snapPoints=['50%']`, `FullWindowOverlay` containerComponent, babel.config.js에 `react-native-worklets/plugin` 추가 — 모두 효과 없거나 (babel은 오히려 번들 깨짐: babel-preset-expo 56 내장 처리와 충돌)
- 원인 미확정. 깔끔히 원복함. 브랜치/패키지 모두 제거 완료.

**시도 3 — 수동 Animated + `keyboardWillChangeFrame`으로 paddingBottom 늘리기 (2026-06-17, 부분 개선)**
- SaveBottomSheet에 `sheetPaddingBottom` Animated.Value 추가, `keyboardWillChangeFrame` 이벤트의 `duration`/`easing`을 그대로 받아 `Animated.timing`에 전달
- sheet 자체는 화면 하단 고정, paddingBottom만 키워서 입력 영역을 키보드 위로 띄움
- 정리: `keyboardWillHide`는 `keyboardWillChangeFrame`이 hide도 커버해서 제거. `SHEET_PADDING_BOTTOM=44` 상수화
- 결과: 키보드 열릴 때는 동기 어느 정도 맞음. 단, **닫힐 때 sheet가 먼저 닫히고 키보드가 뒤따라 내려가 어색함**. 전반적으로 "자연스럽다"고 하기엔 부족.

**시도 4 — Reanimated 4 `useAnimatedKeyboard` (2026-06-17, ✅ 해결)**
- `react-native-reanimated 4.3.1` 이미 설치되어 있어 추가 의존성 없음. babel-preset-expo가 worklets 내장 처리
- 내부 sheet 컨테이너를 `Reanimated.View`로 교체, `useAnimatedStyle`로 `paddingBottom = SHEET_PADDING_BOTTOM + keyboard.height.value` 적용 (UI 스레드에서 키보드 높이 추적 → 프레임 단위 sync)
- 외부 backdrop/translateY는 기존 RN `Animated` 그대로 유지 (충돌 없음)
- `handleClose` 헬퍼에서 `Keyboard.dismiss()` → `onClose()` 순차 호출로 키보드↓ + 시트↓ 동시 시작
- 적용 범위: SaveBottomSheet → CategoryBottomSheet → ContentTitleSheet (3개 시트, 동일 패턴). MoveCategorySheet는 입력 없어 제외
- 결과: 시도 3의 "닫을 때 시트가 먼저 닫히고 키보드가 뒤따라 내려가는 어색함" 해결. 키보드와 시트가 자연스럽게 동기

## 기술 메모

- expo CLI 경로: `node node_modules/expo/bin/cli` (npx expo 안 됨)
- npm install 시 `--legacy-peer-deps` 필요
- Share Extension은 Expo Go 불가, Development Build 필요
- .env 변수: EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY, EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID, EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID, EXPO_PUBLIC_ANTHROPIC_API_KEY
- Supabase DB 스키마 이미 적용됨 (재실행 금지)
- Auth: Google + Apple 소셜 로그인 (Supabase signInWithIdToken)
- Apple 로그인: 네이티브 방식 (expo-apple-authentication + nonce), Secret Key 불필요
