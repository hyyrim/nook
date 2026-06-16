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
