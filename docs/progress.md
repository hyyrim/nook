# Nook 개발 진행 상태

최종 업데이트: 2026-06-20 (15차 — 다른 플랫폼 메타데이터 추출 일반화)

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

## 미완료 (Apple Developer 승인 후)

| 항목 | 비고 |
|------|------|
| App ID에 Sign In with Apple capability 활성화 | Apple Developer 승인 대기 중 |
| Apple 로그인 실기기 테스트 | Development Build 필요 |
| Share Intent 실기기 테스트 | Development Build 필요 |
| eas.json submit 정보 채우기 (appleId, ascAppId, appleTeamId) | App Store Connect 앱 생성 후 |
| EAS Build → TestFlight → App Store 제출 | 최종 배포 |

## 미완료 (추후)

| 항목 | 비고 |
|------|------|
| 카테고리 정렬 순서 변경 | 사용자가 카테고리 순서를 변경 가능. UX는 미정 (드래그 vs 정렬 옵션 필터). DB 스키마 `categories.sort_order` 컬럼 필요 |
| 카테고리 폴더 컬러칩 | 각 카테고리에 컬러 지정해 폴더 카드/Content Detail에서 시각 구분. DB 스키마 `categories.color` 컬럼 필요 |
| 다른 플랫폼 본문 복구 (Phase 2) | 15차에서 generic title fallback은 완료. 본문 복구는 별건 — Threads 봇 UA 패치(facebookexternalhit → Slackbot 폴백)부터 가장 가볍게 시작 가능. 이어서 Naver Blog iframe(PostFrame) 재fetch, X syndication.twitter.com, Velog 공개 API 등 플랫폼별 개별 작업 필요. 노력 대비 효용 평가 후 진행 |

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
