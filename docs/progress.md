# Nook 개발 진행 상태

최종 업데이트: 2026-06-15

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
| 태그 수정 기능 | Content Detail에서 태그 편집 |
| Library 상세 다중 편집 | 체크박스 선택 후 카테고리 변경/삭제 |

## 기술 메모

- expo CLI 경로: `node node_modules/expo/bin/cli` (npx expo 안 됨)
- npm install 시 `--legacy-peer-deps` 필요
- Share Extension은 Expo Go 불가, Development Build 필요
- .env 변수: EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY, EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID, EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID, EXPO_PUBLIC_ANTHROPIC_API_KEY
- Supabase DB 스키마 이미 적용됨 (재실행 금지)
- Auth: Google + Apple 소셜 로그인 (Supabase signInWithIdToken)
- Apple 로그인: 네이티브 방식 (expo-apple-authentication + nonce), Secret Key 불필요
