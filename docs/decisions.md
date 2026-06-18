# 의사결정 로그

> Nook 개발 과정에서 내린 주요 기술/디자인/UX 의사결정을 기록합니다.
> 포맷: **결정** → **배경** → **결과** (필요 시 **대안 검토**, **교훈** 추가)

---

## 001. Supabase Auth + Google OAuth (2026-06-13)

**결정**: expo-auth-session + Supabase signInWithIdToken 조합으로 Google 소셜 로그인 구현

**배경**: MVP에서 빠른 인증 플로우 필요. 카카오 로그인은 2차 범위.

**대안 검토**:
- Email/Password Auth → 사용자 이탈 우려, 소셜 로그인이 UX 우월
- @react-native-google-signin → Expo managed workflow와 호환성 이슈

**결과**: Google ID Token → Supabase Auth로 seamless 인증. SecureStore로 세션 영속화.

---

## 002. 데이터 접근 계층 설계 (2026-06-13)

**결정**: lib/api.ts에 모든 CRUD 함수를 단일 파일로 집약

**배경**: MVP 규모에서 파일 분리는 오버엔지니어링. 모든 Supabase 쿼리를 한 곳에서 관리.

**대안 검토**:
- 테이블별 파일 분리 (api/categories.ts, api/contents.ts) → MVP에서 불필요한 복잡도

**결과**: 19개 함수를 단일 파일로 관리. RLS 기반 보안으로 user_id 필터 자동 적용.

---

## 003. Rediscover 로직 — 카테고리 빈도 기반 (2026-06-13)

**결정**: 단순 "오래된 미열람 콘텐츠" → 카테고리 빈도 기반 우선순위

**배경**: 사용자가 자주 저장하는 카테고리의 콘텐츠가 더 관심도가 높음

**결과**:
1. 카테고리별 콘텐츠 수 집계
2. viewed_at IS NULL인 콘텐츠 조회
3. 빈도 높은 카테고리 → 미분류 → saved_at 오래된 순 정렬

**트레이드오프**: 쿼리 2회 (카테고리 빈도 + 미열람 목록). MVP 규모에서 성능 문제 없음.

> **참고**: 이후 017에서 관심도×망각도 알고리즘으로 고도화됨

---

## 004. AI 분류 아키텍처 (2026-06-13)

**결정**: 클라이언트에서 직접 Claude API 호출 (fetch), 저장과 분류 비동기 분리

**배경**: CLAUDE.md 핵심 원칙 — "저장 UX와 AI 분류는 반드시 분리 (비동기)"

**대안 검토**:
- Supabase Edge Function → 보안 우수하나 MVP에서 인프라 복잡도 증가
- Anthropic SDK → React Native 호환성 불확실 (Node.js 의존)

**결과**:
- fetch로 직접 Messages API 호출 (claude-haiku-4-5)
- 단일 프롬프트로 tags + category 반환
- API 키 없으면 분류 skip, 저장은 정상 동작
- 분류 실패해도 저장 유지 (catch → console.warn)

**향후**: 프로덕션에서는 Edge Function으로 API 키 서버사이드 이동 권장

---

## 005. Share Extension 구현 (2026-06-13)

**결정**: expo-share-intent v7 사용, _layout.tsx에서 자동 저장 처리

**배경**: 핵심 플로우 — "공유 버튼 → Share Extension → URL 전달 → 즉시 저장"

**대안 검토**:
- expo-share-extension (MaxAst) → iOS 커스텀 뷰 지원하나 복잡도 높음
- SaveBottomSheet에 URL 전달 → 불필요한 추가 탭, 즉시 저장이 더 좋은 UX

**결과**:
- useShareIntent 훅으로 URL + 메타데이터 수신
- 인증 상태 확인 후 saveContent 즉시 호출
- 중복 URL 에러 처리, savingRef로 중복 저장 방지

**제약**: Expo Go 불가, Development Build 필요

---

## 006. Instagram 메타데이터 추출 전략 (2026-06-13)

**결정**: Instagram URL은 oEmbed API로 캡션과 썸네일을 가져옴

**배경**: Instagram은 로그인 없이 HTML을 fetch하면 og:title이 제네릭 텍스트로 고정됨.

**대안 검토**:
- HTML og:description 파싱 → 로그인 없으면 캡션 미제공
- Graph API → access_token 필요, 인프라 복잡도 증가

**결과**: 공개 oEmbed 엔드포인트로 캡션(title) + 썸네일(thumbnail_url) 추출. 100자 초과 시 말줄임 처리. oEmbed 실패 시 기존 HTML 파싱 폴백.

---

## 007. 실시간 데이터 갱신 — 이벤트 시스템 (2026-06-13)

**결정**: 모듈 레벨 이벤트 시스템(`lib/events.ts`)으로 저장 후 Home/Library 즉시 새로고침

**배경**: `useFocusEffect`만으로는 같은 탭에서 Bottom Sheet로 저장 시 데이터가 갱신되지 않음.

**대안 검토**:
- React Context → Tab Layout과 자식 화면 간 props 전달 어려움
- Zustand 등 전역 상태 → MVP에서 과도한 의존성

**결과**: 12줄의 경량 이벤트 시스템. `emit('content-saved')` 호출 시 Home/Library가 구독하여 `loadData` 재실행.

---

## 008. Instagram 제목 개선 — 다단계 캡션 추출 + AI 제목 생성 (2026-06-13)

**결정**: Instagram 콘텐츠의 제네릭 제목 문제를 3단계 폴백으로 해결

**배경**: oEmbed API만으로는 릴스 등 일부 형식에서 캡션을 못 가져옴.

**결과 (3단계 폴백)**:
1. oEmbed 캡션 → 성공 시 제목으로 사용
2. HTML 파싱 강화 → og:description 패턴 추출 + 임베디드 JSON 캡션 추출
3. AI 제목 생성 → description이 있을 때만 `suggested_title` 반환

**핵심 결정**: AI는 description 없이 계정명만으로 제목을 추측하지 않음 (내용 불일치 방지)

---

## 009. Content Detail 카테고리 변경 기능 (2026-06-13)

**결정**: Content Detail `…` 메뉴에 "카테고리 변경" 추가, MoveCategorySheet로 카테고리 선택

**배경**: CLAUDE.md 핵심 원칙 — "사용자가 미분류 콘텐츠를 Content Detail에서 적절한 카테고리로 이동"

**결과**:
- MoveCategorySheet: 전체 카테고리 목록 + 미분류 옵션, 현재 카테고리 체크 표시
- 변경 후 `getContentById`로 재조회하여 카테고리명 실시간 반영

---

## 010. description 저장 및 Content Detail 내용 섹션 (2026-06-13)

**결정**: `contents` 테이블에 `description` 컬럼 추가, Content Detail에서 "내용" 섹션으로 표시

**배경**: Content Detail에서 제목만으로는 콘텐츠 파악이 어려움. og:description을 활용.

**결과**:
- `fetchLinkMetadata`에서 description 반환 → `saveContent`에서 DB 저장
- Content Detail: description 있을 때만 "내용" 섹션 표시, 긴 텍스트 더보기/접기 처리

---

## 011. 계정 삭제 위치 — 2depth 계정 설정 페이지 (2026-06-15)

**결정**: 계정 삭제를 Profile 1depth에서 직접 노출하지 않고, 계정 설정 2depth 라우트로 이동

**배경**:
- App Store 정책상 계정 삭제 필수이나, 일반 설정에서 빨간색으로 크게 보이면 위험 액션이 과도하게 강조됨
- 2depth 라우트로 계정 정보(이메일, 로그인 방식)와 함께 배치하면 자연스러운 맥락 제공

**결과**:
- Profile > 계정 설정 > 하단 낮은 위계 `계정 삭제하기`
- 삭제 확인은 Native Alert 유지
- Supabase RPC `delete_user_account()`로 안전 삭제 + 자동 로그아웃

---

## 012. 먼저 둘러보기 — 로그인 전 서비스 탐색 (2026-06-15)

**결정**: 로그인 화면 하단에 `먼저 둘러보기` 버튼을 추가하는 방향 검토

**배경**: 개인 아카이브 앱이라 로그인이 필수이지만, 서비스 가치를 먼저 보여주는 게 장벽을 낮춤

**결과**:
- 둘러보기 상태에서 MVP 화면 구조 확인 가능
- 개인 데이터 액션(저장, 카테고리 등) 시 `로그인이 필요해요` 안내
- Phase 1 안정화 범위에서 기존 라우팅에 최소 변경으로 구현 검토

---

## 013. MVP 한글화 + 카피라이팅 톤 (2026-06-15)

**결정**: MVP 안내 문구를 한국어로 통일, 짧고 친근한 `~해요` 톤 사용

**배경**: 1차 배포 대상이 한국 사용자. 한글/영어 혼용보다 일관된 경험이 우선.

**결과**: 화면 안내 문구, 빈 상태, CTA, 확인 메시지 한국어 정리. 다국어 전환은 Phase 2.

---

## 014. iOS 배포 준비 — Apple 로그인 + EAS Build (2026-06-15)

**결정**: Apple 로그인 구현, EAS Build 설정, 브랜드 에셋 교체

**배경**: App Store 정책상 소셜 로그인(Google) 제공 시 Apple 로그인 필수

**결과**:
- signInWithApple 구현 (expo-apple-authentication + nonce 기반 Supabase 연동)
- eas.json 생성 (development/preview/production)
- 앱 아이콘, 스플래시, 홈 로고 교체

**교훈**: 네이티브 Apple 로그인은 Secret Key 불필요. 승인 대기 중 코드 준비 가능.

---

## 015. Auth 라우팅 가드 — 카테고리 기반 3단 분기 (2026-06-15)

**결정**: 라우팅 가드를 session + 카테고리 존재 여부로 3단 분기

**배경**:
- 기존 유저 재로그인 시 온보딩 재진입, race condition, 카테고리 중복 생성 이슈
- onboarding에서 직접 navigate와 가드가 충돌

**결과**:
- no session → onboarding / session + 카테고리 없음 → choose-interests / session + 카테고리 있음 → tabs
- createInitialCategories 중복 방지, getSession 에러 핸들링 추가

**교훈**: 라우팅 가드는 session뿐 아니라 유저 상태까지 확인해야 올바른 분기가 가능하다.

---

## 016. 입력 검증 — URL 유효성 + 카테고리 중복 방지 (2026-06-15)

**결정**: SaveBottomSheet에 URL 검증, CategoryBottomSheet에 중복 이름 검사 추가

**배경**: 잘못된 URL 저장 시도 시 서버 에러만 발생, 같은 카테고리명 중복 생성 가능

**결과**:
- http/https 프로토콜 검사로 잘못된 URL 차단 + 인라인 에러 메시지
- 대소문자 무시 중복 검사로 카테고리 중복 방지
- errorText 스타일을 Typography 상수로 통합

**교훈**: 사용자 입력 검증은 서버 에러에 의존하기보다 클라이언트에서 선제적으로 처리하는 게 UX가 매끄럽다.

---

## 017. 화면 타이틀 위계 — 1depth / 2depth 분리 (2026-06-15)

**결정**: 1depth 탭 타이틀 26px/700, 2depth 하위 화면 타이틀 17px/600 센터 정렬

**배경**: 모든 화면 타이틀이 32px/800으로 동일하여 화면 깊이 구분 불가. iOS 네이티브 앱 패턴 참고.

**결과**:
- Typography에 `pageTitle`(26px), `navTitle`(17px) 상수 추가
- CLAUDE.md 디자인 시스템에 규격 명시
- 2depth(카테고리 상세, 계정 설정) 타이틀을 nav bar 센터로 이동

**교훈**: 디자인 토큰으로 관리해야 페이지가 늘어나도 일관성을 유지할 수 있다.

---

## 018. 발견된 콘텐츠 — 관심도 × 망각도 알고리즘 (2026-06-15)

**결정**: 카테고리 빈도 기반에서 관심도(조회율) × 망각도(경과일) 스코어링으로 변경

**배경**:
- 카테고리별 콘텐츠 수는 저장량을 반영할 뿐 실제 관심도가 아님
- "재발견"은 관심 있는 영역에서 놓친 콘텐츠를 꺼내주는 것
- 기간 제한 없으면 데이터 무한 축적

**결과**:
- 관심도 = 카테고리별 viewed/total 비율
- 망각도 = 저장 경과일 / 7
- score = 관심도 × 망각도, 카테고리당 최대 2개
- 14일 기간 제한 (테스트 단계, 출시 후 확장)

**교훈**: 테스트 단계에서는 짧은 기간으로 알고리즘 검증 후 출시 시 확장하는 전략이 효과적이다.

---

## 019. 관련 콘텐츠 — 복합 점수 알고리즘 (2026-06-15)

**결정**: 최근 10개 기반에서 전체 콘텐츠 대상 복합 점수로 변경, 최소 점수 임계값 적용

**배경**:
- 기존: 최근 저장 10개 중 같은 카테고리 우선 → 매칭 범위 좁고 무관한 콘텐츠 노출
- 무관한 추천(요리 글에 음악)은 없는 것보다 나쁨

**결과**:
- 같은 카테고리 +3, 태그 겹침 ×2, 같은 도메인 +1
- 최소 2점 이상만 표시 (도메인만 같은 경우 제외)
- 동점 시 최근 저장순

**교훈**: 도메인만 같은 경우(같은 블로그의 다른 주제)는 관련성이 낮으므로 임계값이 필요하다.

---

## 020. 원문 바로가기 — 네이티브 앱 연동 (2026-06-15)

**결정**: 설치된 앱(YouTube, Instagram, X, Naver 등)이 있으면 해당 앱으로 열리도록 URL scheme 연동

**배경**: 모든 링크가 Safari로만 열려서 앱 설치 여부와 무관하게 인앱 경험 활용 불가

**결과**:
- `lib/utils.ts`에 `openInAppOrBrowser` 유틸 (canOpenURL 체크 + Safari fallback)
- `app.json`에 `LSApplicationQueriesSchemes` 등록
- EAS Build 재빌드 필요

**교훈**: iOS에서 앱 URL scheme 사용 시 LSApplicationQueriesSchemes 등록 필수. Expo Go에서는 테스트 불가.

---

## 021. Expo SDK 56 실행 안정화 — 의존성 정렬 및 설정 검증 (2026-06-16)

**결정**: Expo Doctor 기준으로 SDK 56 호환 의존성을 정렬하고 누락된 `expo-font`를 추가

**배경**:
- Apple Developer 승인 이후 iOS 개발 빌드 준비 전 `npx expo start`와 TypeScript 안정성 확인 필요
- Android adaptive icon 설정이 존재하지 않는 asset 파일을 참조
- 일부 React Native 패키지가 SDK 56 권장 버전과 불일치

**결과**:
- `expo`, `expo-router`, `react-native-gesture-handler`, `react-native-reanimated`, `react-native-safe-area-context`, `react-native-worklets`를 SDK 56 권장 버전으로 정렬
- `@expo/vector-icons` peer dependency인 `expo-font` 추가
- Android adaptive icon foreground를 실제 존재하는 `assets/icon.png`로 수정
- `npx tsc --noEmit`, `npx expo-doctor`, Metro iOS bundle 생성 확인 완료

**교훈**: EAS/iOS 빌드로 넘어가기 전 Expo Doctor를 먼저 통과시키면 네이티브 빌드 단계의 설정 오류를 줄일 수 있다.

---

## 022. iOS 실기기 개발 빌드 준비 — expo-dev-client + EAS device profile (2026-06-16)

**결정**: Share Extension 테스트를 위해 Expo Go 대신 Nook 전용 iOS development build를 사용

**배경**:
- `expo-share-intent`와 iOS Share Extension은 Expo Go에서 충분히 검증하기 어려움
- Apple Developer 승인 이후 실제 iPhone ad hoc/internal distribution 빌드 준비 필요
- 기존 `development` profile은 iOS Simulator 전용으로 설정되어 있어 실기기 설치에 사용할 수 없음

**결과**:
- `expo-dev-client` 설치
- `eas.json`에 `development-device` profile 추가 (`developmentClient: true`, `distribution: internal`)
- `npm run start:dev-client` 스크립트 추가
- Expo 계정 로그인이 필요해 실제 EAS cloud build 실행은 로그인 이후 진행

**교훈**: simulator build와 device build는 설치 대상이 다르므로 EAS profile을 분리해야 실수 없이 테스트할 수 있다.

---

## 023. iOS Bundle Identifier 변경 — Apple Team 등록 가능 ID로 전환 (2026-06-16)

**결정**: iOS 앱 Bundle Identifier를 `com.nook.app`에서 `com.hyerimhan.nook`으로 변경

**배경**:
- EAS credential 생성 중 Apple Developer Team에서 `com.nook.app`을 사용할 수 없다는 오류 발생
- iOS 앱, Share Extension, App Group은 같은 identifier 체계를 공유해야 함

**결과**:
- 앱 Bundle Identifier: `com.hyerimhan.nook`
- Share Extension Bundle Identifier: `com.hyerimhan.nook.share-extension`
- App Group Identifier: `group.com.hyerimhan.nook`
- `app.json`의 중복 URL scheme 및 수동 appExtensions 설정 제거
- iOS native project의 bundle id, entitlements, Info.plist, ShareViewController 값 동기화

**교훈**: Apple Developer 등록 전에는 브랜드 일반명보다 개인/팀 고유 namespace를 포함한 bundle id를 사용하는 것이 안전하다.

---

## 024. iPhone16Pro 실기기 UI 안정화 — safe area와 검색 전환 조정 (2026-06-16)

**결정**: 실기기 테스트에서 어색했던 탭 safe area, 검색 화면 포커스 타이밍, 2depth nav 크기, 홈 헤더 여백을 최소 수정으로 조정

**배경**:
- iPhone16Pro 테스트에서 하단 탭이 홈 인디케이터와 가까워 보이고, 검색 화면 진입 시 키보드가 화면 전환과 한 레이어처럼 움직여 부자연스러움
- 카테고리 상세 상단의 `폴더`, 제목, 더보기 아이콘이 작아 보여 2depth nav 위계가 약함
- 홈 화면은 헤더와 최근 저장 영역 사이가 붙어 보여 구분감이 부족함

**결과**:
- 루트에 `SafeAreaProvider`를 적용하고 탭바 높이/하단 패딩을 safe area 기반으로 계산
- 검색 화면은 stack `transitionEnd` 이후 input focus를 실행해 화면 전환과 키보드 상승 타이밍을 분리
- 검색 input 스타일을 기존 카테고리 검색창과 맞춰 높이, padding, shadow, clear button touch area를 통일
- 카테고리 상세 nav의 back/menu touch area와 아이콘/타이틀 크기를 조정
- 홈 화면은 divider 없이 헤더 하단 여백과 content 상단 여백으로 자연스럽게 구분
- 바텀시트 keyboard 실험 코드는 제거하고 자동 focus만 제외해 안정 상태로 복귀

**대안 검토**: 헤더 아래 구분선을 넣는 안도 검토했지만, 현재 Nook의 부드러운 카드형 톤에는 선보다 여백 기반 구분이 더 자연스러워 채택하지 않음.

**교훈**: 모바일 전환과 키보드 애니메이션은 같은 컴포넌트 안에서 delay로 맞추기보다 navigation transition과 focus 시점을 분리하는 편이 더 예측 가능하다.

---

## 025. Instagram 제목 추출 견고화 — 패턴 완화 + fallback + 토큰 필터 (2026-06-16)

**결정**: Instagram 게시물 제목 추출에서 발생한 3가지 케이스를 동시에 해결

**배경**:
- 같은 계정의 게시물인데도 제목이 제각각: 캡션 첫 문장 / 계정명 단독 / "1" 같은 의미 없는 텍스트
- Instagram이 oEmbed/HTML 응답에서 캡션을 일관되지 않게 노출하기 때문
- 기존 generic 패턴이 너무 엄격해서 "Name (@username) • Instagram 사진" 같은 형태가 통과돼 그대로 저장됨

**결과**:
1. **Generic 패턴 강화** (`lib/metadata.ts`, `lib/ai.ts` 동기화):
   - 기존: `/instagram\s+사진\s+및\s+동영상/i` (풀 phrase 강제)
   - 변경: `/instagram\s+(사진|동영상|photos?|videos?|reels?|릴스)/i` (단어 단위 매치)
   - 신규: `/\(@[\w.]+\)\s*[·•]\s*Instagram/i` — 계정명 패턴 잡기
2. **Fallback 문구 명시**: 캡션/description 모두 추출 실패 시 계정명 단독 노출 대신 `"Instagram 게시물"` 또는 `"Instagram 릴스"` 사용 (URL path 기반 분기). HTML fetch 실패 케이스에도 동일 적용.
3. **번호 매김 첫 토큰 필터**: `"1. 우선 채널의..."` 같은 description에서 split 첫 토큰 `"1"`이 title로 들어가던 버그 — 3자 이상 + 숫자만 아닌 토큰만 채택하도록 변경.

**대안 검토**:
- 서버사이드 추출(Edge Function) → 안정성 우수하나 MVP 인프라 복잡도 증가, Phase 2 검토
- Instagram Graph API → access_token 필요, 인프라 복잡도 증가

**제약**: 이미 저장된 `title="1"`, `"Somewon (@somewon_co)..."` 같은 잘못된 제목은 자동 보정 안 함. Content Detail의 ContentTitleSheet로 사용자가 직접 수정. `refreshContentMetadata` 조건은 `!title || title === url`이라 매치 안 됨.

**교훈**: 외부 플랫폼의 메타데이터 추출은 응답이 일관되지 않으므로, generic 패턴은 단어 단위로 완화하고 최종 fallback을 명시하는 게 안전하다.

---

## 026. 비동기 AI 분류 UX — "분류 중" 뱃지 + 자동 갱신 (2026-06-16)

**결정**: 저장 직후 AI 분류가 진행 중인 콘텐츠에 "AI 분류 중" 뱃지 표시 + 분류 완료 시 화면 자동 갱신

**배경**:
- CLAUDE.md 원칙 — 저장 UX와 AI 분류는 비동기 분리
- 그 결과 저장 직후엔 카테고리/태그 없는 "미분류" 상태로 노출되고, 다른 탭 갔다 돌아와야 분류 결과 반영
- 사용자가 "분류가 동작하는지" 불확실하고, 새로고침 동작이 일관되지 않음

**결과**:
- `lib/events.ts`: 모듈 레벨 `classifyingIds: Set<string>` + `markClassifying`/`markClassified`/`isClassifying` 헬퍼 추가
- `lib/api.ts`: `saveContent`에서 분류 시작 시 `markClassifying(id)` (동기), `classifyAndUpdate` finally에서 `markClassified(id)` + `emit('content-classified')`
- `components/ContentCard.tsx`: `isClassifying` prop 추가 → 첫 태그 자리에 회색 점 + "AI 분류 중" 뱃지
- 5개 화면(Home, Library, Recent Saved, Search, Category Detail)에서 `content-classified` 이벤트 구독 → 분류 완료 시 자동 loadData

**대안 검토**:
- DB에 `classification_status` 컬럼 추가 → 정확하지만 마이그레이션 필요. MVP 단계에서 과도.
- 저장을 동기화 (분류 완료 후 반환) → CLAUDE.md 원칙(비동기 분리) 위반, 저장 UX 2-3초 지연

**트레이드오프**: 앱 재시작 시 `classifyingIds`는 휘발됨. 다만 분류는 보통 5초 내 완료되므로 재시작 시점엔 이미 DB에 반영되어 자연스러운 미분류 또는 정상 표시로 보임.

**교훈**: 비동기 작업의 진행 상태는 DB 컬럼 추가보다 클라이언트 모듈 레벨 상태 + 이벤트 emit이 MVP 단계에서 가벼우면서 충분한 UX를 제공한다.

---

## 027. 바텀시트 키보드 회피 — Reanimated 4 `useAnimatedKeyboard` (2026-06-17)

**결정**: 입력이 있는 3개 바텀시트(Save / Category / ContentTitle)의 키보드 회피를 Reanimated 4 `useAnimatedKeyboard` + UI 스레드 paddingBottom 동기 방식으로 통일

**배경**:
- iOS 실기기에서 input focus 시 키보드가 시트의 input/CTA 영역을 가려 입력 중인 텍스트가 안 보이는 문제
- 시도 1(수동 Animated.translateY + Keyboard listener) → 시트가 키보드 위로 떠오를 때 border-radius가 화면 중앙에 어색하게 위치, 원복
- 시도 2(@gorhom/bottom-sheet PoC) → `present()` 호출은 되나 mount/animate 안 됨, 원인 미확정으로 원복. babel.config.js worklets plugin 추가는 babel-preset-expo 56 내장 처리와 충돌
- 시도 3(`keyboardWillChangeFrame`으로 paddingBottom 늘리기) → 열 때는 OK였으나 닫을 때 시트가 먼저 닫히고 키보드가 뒤따라 내려가 어색

**결과**:
- 내부 sheet 컨테이너를 `Reanimated.View`로 교체, `useAnimatedStyle`로 `paddingBottom = SHEET_PADDING_BOTTOM + keyboard.height.value` 적용 (UI 스레드에서 키보드 높이 추적 → JS 브리지 지연 없이 프레임 단위 sync)
- 외부 backdrop/translateY는 기존 RN `Animated` 유지 (paddingBottom과 transform은 서로 다른 속성/뷰라 충돌 없음)
- `handleClose` 헬퍼에서 `Keyboard.dismiss()` → `onClose()` 순차 호출로 키보드↓ + 시트↓ 동시 시작
- 적용 범위: SaveBottomSheet, CategoryBottomSheet, ContentTitleSheet (3개 동일 패턴). MoveCategorySheet는 입력 없어 제외

**대안 검토**:
- `react-native-keyboard-controller` → `KeyboardAvoidingView` 한 줄로 해결 가능하지만 새 의존성 필요. 이미 reanimated 4가 설치되어 있어 우선순위 낮음
- `@gorhom/bottom-sheet` 전면 마이그레이션 → 시도 2 실패 원인 미확정, 4개 시트 모두 다시 짜야 해서 ROI 낮음

**트레이드오프 / 제약**:
- 추가 의존성 없음 (`react-native-reanimated 4.3.1` 활용, babel-preset-expo가 worklets 내장 처리)
- 시트 외 다른 화면의 키보드 회피는 영향 없음 (시트 내부에서만 동작)

**교훈**: 키보드와 UI를 동기화할 때 JS 브리지를 통한 이벤트 리스너 방식은 닫힐 때 미세한 시차를 피하기 어렵다. Reanimated 4의 `useAnimatedKeyboard`처럼 UI 스레드에서 직접 SharedValue로 추적하는 방식이 자연스러운 sync를 보장한다.

---

## 028. Content Detail 태그 수정 — chip + input 시트 (2026-06-17)

**결정**: Content Detail에서 태그를 편집할 수 있도록 chip + 인풋 형태의 별도 `TagsSheet`로 구현. ActionSheet의 "제목 수정"과 "카테고리 변경" 사이에 배치

**배경**:
- CLAUDE.md 원칙 — "태그: AI 자동 생성 후 사용자가 Content Detail에서 수정 가능"
- AI가 생성한 태그가 사용자 의도와 다를 수 있고, 미분류 콘텐츠에 직접 태그를 보강할 수도 있어야 함
- 기존 ActionSheet 패턴(제목 수정, 카테고리 변경, 삭제)이 정착되어 있어 동일한 진입 경로 유지

**결과**:
- 신규 `components/TagsSheet.tsx`: 현재 태그를 chip으로 표시(× 탭으로 삭제), 하단 인풋 + "+" 버튼(또는 키보드 done)으로 추가, 저장 CTA로 일괄 반영
- 키보드 회피는 결정 027의 `useAnimatedKeyboard` 패턴 그대로 재사용
- 검증: 트림 후 빈 값 무시, 중복 차단(case-insensitive), 태그당 20자, 총 10개 제한
- ActionSheet에 "태그 수정" 항목 추가 — `[제목 수정, 태그 수정, 카테고리 변경, 삭제]` 순서
- DB 업데이트: 기존 `updateContent(id, { tags })`가 이미 tags 필드를 지원

**대안 검토**:
- 콤마로 구분된 텍스트 영역 → 입력 모델이 명료하지 않고 모바일 키보드에서 콤마 입력이 번거로움
- Content Detail 본문에 인라인 편집(태그 칩 직접 탭) → 진입 경로가 숨겨져 있어 발견성 낮음
- AI 재분류 트리거 → 사용자가 직접 의도를 반영하는 게 우선, 재분류는 별도 기능으로 분리 가능

**제약**: 태그 검색/필터링은 여전히 MVP 제외(데이터 모델은 `text[]` 단순 컬럼 유지). 분류 결과 변경 후 관련 콘텐츠 알고리즘(결정 019)에 자동 반영됨

**교훈**: AI 자동 생성 결과는 사용자가 손쉽게 수정할 수 있어야 하고, 진입 경로는 기존 액션 시트 패턴과 일관되게 두는 것이 발견성과 학습 비용 측면에서 유리하다.

---

## 029. 폴더 상세 다중 편집 — 선택 모드 + Optimistic UI (2026-06-17)

> 참고: 다중 DB 요청의 원자성은 이후 030에서 고도화됨
> 참고: 카테고리 목록 로드 실패 UX는 이후 031에서 고도화됨

**결정**: 폴더 상세 화면에 선택 모드를 도입해 다수 콘텐츠를 한 번에 카테고리 이동/삭제. 액션은 Optimistic UI + LayoutAnimation으로 즉시 반영

**배경**:
- 사용자가 다수 콘텐츠를 한 번에 정리할 수단이 없어 카드 하나씩 들어가서 처리해야 함
- 단순히 await→reload 흐름은 잠깐 멈췄다가 항목이 뚝 사라지는 어색한 UX(사용자 표현: "뚱땅거리며 없어지는 느낌")

**결과**:
- `components/ContentCard.tsx`: `selectionMode`, `selected` props 추가 → 좌측에 체크 원형 인디케이터 표시 (선택 시 primary 색 fill)
- `app/category/[id].tsx`: 진입(일반 폴더는 ActionSheet에 "선택" 추가, 미분류는 우상단 텍스트 버튼) / 헤더(`[취소] n개 선택됨 [전체 선택/해제]`) / 하단 고정 액션 바(카테고리 이동, 삭제) / SearchBar는 선택 모드에서 숨김
- `MoveCategorySheet`는 `currentCategoryId` 안 넘기면 체크 없는 상태가 되어 다중 이동 모드로 그대로 재사용
- 액션 흐름: 선택 → `LayoutAnimation.configureNext` + 로컬 articles 즉시 필터 + 카운트 즉시 감소 → 선택 모드 해제 → 백그라운드 bulk 요청. 실패 시 snapshot 복원 + Alert
- 현재 폴더로 이동 같은 no-op은 시트만 닫음
- 선택 모드 진입 시 검색어를 초기화하고 SearchBar를 숨겨 전체 선택 범위가 항상 현재 폴더 전체와 일치

**대안 검토**:
- 카드 long-press로 진입 → iOS 표준이지만 발견성 낮음. 우상단 명시 진입이 모바일 메모/사진 앱 패턴에 더 맞음
- Reanimated FadeOut 적용 → 의존성 추가 필요. RN 내장 `LayoutAnimation`만으로 충분히 부드럽게 처리됨
- 동기 흐름(await → loadData) 유지 → "뚱땅" UX 그대로. Optimistic UI가 정답

**제약**: LayoutAnimation은 Android에서 `setLayoutAnimationEnabledExperimental(true)` 필요(방어적으로 추가). 동시 작업 도중 다른 이벤트로 articles가 갱신되면 snapshot 롤백이 충돌 가능 — MVP 규모에서는 발생 가능성 낮음

**교훈**: 다수 항목 조작 UX는 "API 완료 후 반영"이 아니라 "즉시 반영 + 백그라운드 동기 + 실패 시 롤백"이 자연스럽다. LayoutAnimation 한 줄로 RN 기본 컴포넌트도 충분히 부드러운 전환을 줄 수 있다.

---

## 030. 다중 콘텐츠 변경을 단일 DB 요청으로 원자화 (2026-06-17)

**결정**: 다중 카테고리 이동과 삭제를 콘텐츠별 `Promise.all` 요청 대신 `.in('id', ids)`를 사용하는 단일 Supabase update/delete 요청으로 처리

**배경**: 여러 요청 중 일부만 성공한 뒤 하나가 실패하면 UI는 전체 snapshot을 복원하지만 DB에는 일부 변경이 남을 수 있다. 특히 삭제된 레코드는 클라이언트 snapshot만으로 복구할 수 없다.

**결과**:
- `lib/api.ts`에 `moveContents`와 `deleteContents` 추가
- 모든 쿼리에 `user_id` 조건을 유지해 사용자 데이터 격리
- 이동 대상 카테고리가 현재 사용자 소유인지 bulk update 전에 한 번 검증
- 단일 SQL 문장 실패 시 전체 변경이 롤백되어 Optimistic UI의 snapshot 복원과 DB 상태가 일치

**대안 검토**: Supabase RPC 트랜잭션도 가능하지만, 현재 작업은 동일 값으로 여러 행을 update/delete하는 단일 SQL 문장으로 충분해 별도 DB 함수와 마이그레이션을 추가하지 않음

**교훈**: Optimistic UI의 롤백은 서버 변경도 원자적일 때만 신뢰할 수 있다.

---

## 031. 카테고리 이동 시트의 로드 실패 차단 UX (2026-06-17)

**결정**: 카테고리 목록 조회 실패 시 오류를 무시하지 않고, 옵션 목록 대신 오류 안내와 재시도 버튼을 표시

**배경**: 조회 실패를 빈 목록처럼 처리하면 시트에 가상 옵션인 "미분류"만 남아 사용자가 정상 목록으로 오인하고 다수 콘텐츠를 잘못 이동할 수 있다.

**결과**:
- `MoveCategorySheet`에 명시적인 `loadError` 상태 추가
- 실패 시 카테고리 옵션을 전혀 렌더링하지 않아 이동 선택 차단
- 오류 안내와 "다시 시도" 버튼 제공
- 개발 중 원인 확인을 위해 실제 오류는 console에 기록

**교훈**: 데이터 로드 실패와 정상적인 빈 목록은 서로 다른 UI 상태로 다뤄야 한다.

---

## 032. 카테고리 추가 UX + Category Detail 라벨 명확화 (2026-06-17)

**결정**: 카테고리 추가 흐름을 두 진입점에서 자연스럽게 만들고, Category Detail의 `…` 액션 라벨에 "카테고리" 접두어를 붙여 모호함 제거

**배경**:
- 카테고리가 많아지면 폴더 탭에서 추가 후 새 카드가 화면 아래쪽에 생성되어 보이지 않음 → 추가 성공 여부 불확실
- 콘텐츠 카테고리 변경(MoveCategorySheet) 도중 원하는 카테고리가 없으면 시트를 닫고 폴더 탭으로 가서 추가 후 다시 들어와야 하는 우회 경로
- Category Detail `…` 메뉴의 "수정 / 삭제"가 카테고리 자체인지 콘텐츠인지 모호 — 다중 편집 기능 추가 후 더 헷갈림

**결과**:
- 폴더 탭: `createCategory` 호출 후 `ScrollView.scrollToEnd({animated:true})`로 새 카드 위치까지 부드럽게 자동 스크롤. 별도 하이라이트는 1차 시안에서 "촌스럽다" 피드백으로 제거 — 자동 스크롤만으로 충분
- MoveCategorySheet 옵션 목록 마지막에 "+ 새 카테고리 만들기" 추가 → 클릭 시 nested `CategoryBottomSheet` (mode=add) 띄움 → 추가 성공 시 로컬 categories 즉시 갱신 + 새 id로 자동 `handleSelect` → 모든 시트 닫힘. existingNames도 자동 전달되어 중복 차단
- Category Detail ActionSheet: `수정`→`카테고리 수정`, `삭제`→`카테고리 삭제`. `선택`은 콘텐츠 리스트가 화면에 보이므로 맥락이 명확해 그대로 둠

**대안 검토**:
- 새 카테고리 추가 후 하이라이트 애니메이션(테두리/배경 강조) → 시안에서 색감이 강해 분위기와 안 맞음. 스크롤로 시각 위치 변경만으로 충분한 피드백
- 카테고리 정렬을 created_at desc로 변경해 새 카드를 항상 상단에 노출 → 기존 사용자의 정렬 경험이 일관성을 잃음. 보류 (정렬 옵션 기능은 별도 백로그)
- ActionSheet에 "콘텐츠 선택"으로 prefix 통일 → "선택"은 화면 콘텐츠 리스트와 시각적으로 직접 연결되어 모호함이 없음, 불필요한 중복

**제약**: nested Modal(MoveCategorySheet 안의 CategoryBottomSheet) 구조는 iOS에서 정상 동작 확인. 추후 시트 라이브러리 이관 시 호환성 재점검 필요

**교훈**: UX 피드백은 "원래 의도한 디자인" 고집보다 사용자 인지 부담 최소화가 우선. 같은 이름의 액션이 다른 대상(콘텐츠 vs 카테고리)을 가질 때는 prefix로 명확히 하고, 맥락이 명확한 곳은 짧게 둔다.

---

## 033. 빈 상태/에러 상태 통일 + 신규 유저 환영 카드 (2026-06-17)

**결정**: 모든 데이터 로드 화면에 공통 `EmptyState` / `ErrorState` 컴포넌트를 적용해 일관성을 확보하고, 신규 유저가 처음 로그인했을 때 빈 홈 대신 환영 카드 + 사용 팁을 노출

**배경**:
- Home / Recent Saved / Search / Category Detail의 빈 상태가 4가지 패턴(텍스트만 / paddingVertical 24~160 / dashed placeholder / 아이콘+텍스트)으로 혼재 → 같은 의미(빈 상태)인데 시각적 일관성 부족
- 모든 화면이 `loadData` 실패 시 `console.error`만 호출 → 네트워크 끊긴 상태에서 사용자에겐 "그냥 빈 화면"으로 보여 데이터 분실 오해 가능
- 신규 유저 첫 로그인 시 홈에 EmptyState 한 줄만 노출 → 서비스 가치를 전달하지 못하고 어색한 시작

**결과**:
- `components/EmptyState.tsx`: 아이콘 + 제목 + 부제목 통일. props `icon` / `title` / `subtitle?`
- `components/ErrorState.tsx`: cloud-offline 아이콘 + 안내 문구 + "다시 시도" 버튼. props `onRetry?`
- 적용 화면 5개: Home, Library, Recent Saved, Search, Category Detail. 각 화면 `loadError` state + 실패 시 재시도 UI
- 신규 유저 홈 환영 카드: `recentItems.length === 0 && rediscoverItems.length === 0` 조건에서 EmptyState 대신 카드 1장으로 대체. 큰 북마크 아이콘 + "Nook 시작하기" + 안내 + 3개 팁(공유하기/+ 버튼/AI 자동 분류). 첫 콘텐츠 저장 시 자연스럽게 사라지고 일반 레이아웃으로 전환
- Search 힌트("제목/출처/태그로 찾아보세요")는 빈 상태가 아니라 검색 시작 안내라 EmptyState 미적용 (디자인 의도 유지)

**대안 검토**:
- 글로벌 ErrorBoundary 한 곳에서 처리 → 화면별 컨텍스트(어떤 데이터인지)를 잃고 재시도 버튼이 화면 전체를 무너뜨림. 화면별 inline 처리가 적절
- 환영 카드에 "콘텐츠 저장하기" CTA로 SaveBottomSheet를 직접 띄우기 → Home 컴포넌트가 (tabs)/_layout.tsx의 showSave 상태를 알아야 해서 결합도 증가. 3개 팁만으로 충분히 안내, 사용자는 자연스럽게 공유/+ 버튼 사용
- 예시 콘텐츠 자동 삽입 → 사용자 데이터에 시스템이 끼어드는 형태라 부담. 가이드만 보여주는 게 깔끔

**제약**: 환영 카드는 `recentItems === 0 && rediscoverItems === 0` 조건에서만 나타남. 사용자가 콘텐츠를 모두 삭제하면 다시 노출됨(의도된 동작)

**교훈**: 빈 상태 / 에러 상태 / 로딩 상태는 "결국 같은 의미라면 같은 컴포넌트로" 통일하는 게 디자인 부채를 줄인다. 신규 유저 첫 화면은 단순히 비어있는 게 아니라 "다음에 뭘 해야 하는지" 안내하는 기회로 활용한다.

---

## 034. MVP 사용자 행동 측정 가설과 집계 기준 고정 (2026-06-17)

**결정**: 첫 저장, 7일 내 두 번째 저장, 자연 재방문 후 Rediscover 열람을 MVP의 핵심 검증 가설로 정하고, 이벤트 도구 도입 전에 계산식과 집계 규칙을 문서로 고정

**배경**: 포트폴리오에서 정확한 사용자 데이터 수치를 제시하려면 구현 전에 분모, 관찰 기간, 이벤트 발생 조건을 정해야 한다. 알림이 없는 MVP에서 Rediscover가 재방문 자체를 유도했다고 해석하면 인과관계를 과장할 수 있다.

**결과**: `docs/analytics-plan.md`에 세 가지 가설, 원본 데이터 우선순위, 최소 행동 이벤트, 개인정보 제외 항목, 테스트 계정 제외와 7일 관찰 기간 등의 집계 규칙을 정의했다. Rediscover는 재방문 유도가 아니라 재방문 이후 콘텐츠 열람 지표로 제한한다.

**대안 검토**: Mixpanel 등 외부 분석 도구를 먼저 도입하는 방식은 보류했다. 초기 베타에서는 Supabase 원본 데이터와 최소 이벤트만으로 기준선을 확보하고, 퍼널 분석 운영 부담이 커질 때 도구 도입을 재검토한다.

**교훈**: 분석 도구보다 먼저 검증할 주장과 계산식을 고정해야 작은 표본에서도 재현 가능하고 과장되지 않은 결과를 만들 수 있다.

---

## 035. 2depth 헤더 — NavHeader 공통 컴포넌트 추출 (2026-06-18)

**결정**: 2depth 화면 헤더(타이틀/뒤로가기/우측 액션)를 `components/NavHeader.tsx` 단일 컴포넌트로 추출하고 Category Detail / Recent Saved / Account Settings 3개 화면에 적용. Content Detail(floating)과 Search(input 헤더)는 의도된 다른 패턴이라 제외

**배경**:
- 결정 017에서 `Typography.navTitle`(17/600)을 정의했으나 실제 적용은 account-settings 한 곳뿐
- 화면별 헤더 폰트가 16/700(recent-saved), 18/600(category), 17/600(account-settings)으로 흩어져 위계 불일치
- back chevron 사이즈(18px vs 22px), backLabel 존재 여부, padding 값, border-bottom 유무까지 모두 제각각
- 향후 2depth 화면 추가될 때 일관성을 자동으로 보장할 패턴이 필요

**결과**:
- `components/NavHeader.tsx`: `title` + 선택적 `backLabel`/`onBack` + 선택적 `rightAction`(`type: 'icon' | 'text'`) 슬롯
- 공통 사양: `Typography.navTitle`, `paddingHorizontal: 12 / paddingVertical: 10`, `minHeight: 44`, side 컬럼 `minWidth: 70`(타이틀 센터 유지용)
- 좌측: chevron-back 22px + 선택적 라벨(17/500)
- 우측 슬롯: icon은 44x44 원형 터치 영역, text는 우측 정렬 라벨(15/500, danger/disabled 색 분기)
- 적용: `category/[id]`(일반 모드), `recent-saved`, `account-settings`
- 제외: `content/[id]`는 이미지 위 floating chip 패턴, `search`는 검색 input이 헤더 자체라 NavHeader 추상화 범위를 벗어남. `category/[id]`의 selectionMode 헤더도 `[취소] n개 선택됨 [전체 선택]` 3-슬롯 구조라 NavHeader와 의미가 달라 인라인 유지

**대안 검토**:
- 스타일 값만 Typography.navTitle로 정렬하고 인라인 유지 → 변경 최소화는 되지만 다음에 추가될 2depth 화면이 또 다른 값으로 표류할 위험
- Content Detail / Search까지 모두 한 컴포넌트로 통일 → floating/검색 input 패턴은 의도된 차이라 props가 비대해지고 통일의 의미가 약해짐. ROI 낮음

**제약**: NavHeader는 헤더 자체만 담당. border-bottom 같은 화면 컨텍스트(검색바·count·SectionLabel 등이 따라오는지)에 따라 다른 처리는 각 화면 wrapper에서 결정

**교훈**: 디자인 토큰을 상수로 정의(결정 017)했어도 화면마다 인라인 스타일을 작성하면 결국 표류한다. 같은 의미(2depth nav)를 가진 UI는 토큰 + 컴포넌트 양쪽으로 묶어야 강제력이 생긴다.
