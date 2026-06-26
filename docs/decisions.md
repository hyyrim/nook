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

---

## 036. Instagram 릴스 메타데이터 + 원문 바로가기 처리 (2026-06-18)

**결정**:
1. Instagram 메타데이터 추출에서 공개 oEmbed 호출을 제거하고 HTML 파싱(`og:description` + embedded JSON) 단일 경로로 일원화
2. 원문 바로가기 Instagram 라우팅은 하이브리드: 앱 설치되어 있으면 https URL을 `Linking.openURL`로 던져 iOS **Universal Link**가 잡게 하고, 미설치면 `WebBrowser.openBrowserAsync`(SFSafariViewController) 인앱 브라우저로 fallback

**배경**:
- 결정 006/008에서 Instagram oEmbed를 1차 캡션 소스로 사용했지만, 공개 `https://api.instagram.com/oembed/`는 2020년부터 `access_token` 필수 — 토큰 없는 호출은 사실상 100% 실패한다. 모든 Instagram 저장 경로에서 의미 없는 네트워크 왕복이 추가되고, 결과는 항상 HTML fallback으로 떨어진다
- 결정 020에서 `instagram://app{pathname}` 형태로 deep-link를 시도했으나, Instagram iOS 앱은 `instagram://app` 단독 외에 path 부분을 인식하지 않고 무시한다. 결과: 어떤 게시물·릴스를 눌러도 Instagram 앱 홈으로 빠짐 (`docs/progress.md`에 기록된 실 사용자 재현 증상과 일치)
- 캡션 추출 실패 시 `Instagram 릴스`/`Instagram 게시물` generic fallback은 이미 정착(`instagramFallbackTitle`) — 사용자 제약("추측 생성 금지")과 맞아 그대로 유지

**결과**:
- `lib/metadata.ts`:
  - `fetchInstagramOEmbed` 함수와 `fetchLinkMetadata`의 oEmbed 분기 삭제
  - 모든 Instagram URL은 HTML(브라우저 UA) → `parseMetadata` → `extractInstagramCaption`(og:description 인용 패턴 + embedded JSON `caption.text` / `edge_media_to_caption`) 경로로 통일
  - 캡션도 description도 못 얻으면 `instagramFallbackTitle(url)`로 종결, `description`은 `undefined`
- `lib/utils.ts`:
  - `APP_SCHEMES`에서 Instagram 엔트리 제거
  - `openInAppOrBrowser`가 Instagram 호스트면: `Linking.canOpenURL('instagram://app')` → 설치 시 `Linking.openURL(httpsUrl)` (Universal Link로 Instagram 앱이 해당 게시물 표시) → 미설치 시 `WebBrowser.openBrowserAsync(httpsUrl)` → 모두 실패 시 일반 `Linking.openURL` fallback
  - `instagram://app{path}` 커스텀 스키마는 path를 무시하고 앱 홈으로만 빠지므로 사용 안 함. Universal Link 시스템을 우회하지 않는 것이 핵심
  - YouTube / X / Naver / TikTok / Threads / LinkedIn 의 앱 deep-link는 결정 020 그대로 유지

**대안 검토**:
- Edge Function에 access token 보관하고 oEmbed 정식 호출 → 캡션 정확도 가장 높으나 MVP 인프라 부담. 결정 004의 비동기 분류처럼 다음 단계로 분리
- 항상 SFSafariViewController(WebBrowser)만 사용 → 외부 이탈은 없지만 Instagram 앱이 있는 사용자가 앱에서 게시물 보는 자연스러운 UX를 잃음
- 항상 `Linking.openURL(https)`만 사용 → 앱 있으면 좋지만 미설치 사용자는 외부 Safari로 이탈
- shortcode → numeric media id 변환 후 `instagram://media?id=` 사용 → 변환에 비공식 API 필요, MVP 범위 밖

**제약**:
- 비공개·로그인 필수 게시물은 SFSafariViewController에서 Instagram 로그인 페이지가 노출됨 (앱 deep-link로도 어차피 동일하게 막힘)
- 기존에 `title="Instagram 릴스"`로 저장된 레코드는 자동 보정 안 함. Content Detail의 `ContentTitleSheet`로 사용자가 직접 수정 가능
- `app.json`의 `LSApplicationQueriesSchemes`의 `instagram` 항목은 `canOpenURL('instagram://app')` 호출에 필요해 그대로 유지 (앱 설치 여부 감지용)

**교훈**: 외부 플랫폼 API/스키마는 한 번 정착한 뒤에도 정책 변화로 죽을 수 있다. 매번 시도해서 실패시키는 것보다 실패가 예측 가능해진 시점에 분기 자체를 제거하는 게 코드/네트워크 모두 깔끔하다. iOS 앱 deep-link도 "scheme이 있다 = path를 인식한다"가 아니므로, 커스텀 스키마를 강제하면 오히려 OS의 Universal Link 시스템을 우회시켜 결과를 망친다. https URL을 그대로 던지는 게 가장 강력한 라우팅이다.

**후속 진단 (2026-06-18, 같은 작업 세션)**:
- 게시물(`/p/`)은 캡션 추출이 정상인데 릴스(`/reel/`)만 항상 `Instagram 릴스` fallback으로 떨어지는 증상 관찰
- 1차 가설(폐기): shortcode를 공유하는 `/p/`로 fetch URL을 변환하면 캡션을 담은 응답을 받을 것 → 실측 결과 `/reel/`과 `/p/` 응답이 거의 동일(둘 다 `og:title`/`og:description` 비어 있음, `caption.text` JSON 0건). 변환 코드는 같은 커밋에서 롤백
- 2차 진단(폐기): Instagram이 일반 브라우저 UA에는 빈 메타를, Slackbot UA에는 og:description 짧은 캡션 인용(`"N views, M likes: \"캡션\""`)을 반환한다는 발견으로 fetch UA를 Slackbot으로 교체. 사용자 검증 결과 og:description의 캡션이 ~100자에서 잘려서 description이 매우 짧고, og:title이 한국어(`"Instagram의 <계정명>"`) 형식이라 기존 generic 패턴이 매치를 못해 title도 잘못 들어옴
- 3차 진단(실측 발견·채택): `facebookexternalhit/1.1` UA로 fetch하면 응답 HTML 내에 `"caption":{"text":"<JSON 이스케이프된 캡션 전문>"}` 패턴이 다수 포함됨. 다만 페이지에 **추천 게시물 caption도 함께 들어오므로** 첫 매치를 사용하면 다른 콘텐츠 캡션이 우리 콘텐츠로 들어가는 오염 발생. 실측: 우리 콘텐츠는 항상 `"text":"..."}, "code":"<shortcode>"` 형태로 인접(50자 이내), 추천 콘텐츠 caption은 같은 shortcode 주변 4000자 안에서도 다른 위치에 있음
- 해결:
  - `lib/metadata.ts`의 Instagram fetch UA를 `'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)'`로 변경
  - `extractInstagramCaptionFromHtml(html, baseUrl)` 신설: URL에서 shortcode 추출 → `"caption":{...,"text":"<x>"}` 뒤 200자 이내에 `"code"|"shortcode":"<해당 shortcode>"`가 오는 경우만 매치 (BWD 방향만). FWD 방향(shortcode → caption)은 timeline 추천 첫 노드를 잘못 잡는 케이스가 확인되어 사용하지 않음
  - `parseMetadata`에서 caption 추출 순서를 (1) `extractInstagramCaptionFromHtml`(전문) → (2) 기존 `extractInstagramCaption`(og:description 인용 fallback)로 변경
  - `GENERIC_TITLE_PATTERNS`에 `/^Instagram(의|에서)/i` 추가 (`metadata.ts` + `ai.ts` 동기화). 한국어 link-preview 응답에서도 generic 판정되어 caption-우선 분기로 진입
- 트레이드오프: facebookexternalhit UA 흉내내기는 외부 서비스 UA를 사칭하는 회색 영역. Instagram이 차후 응답 구조(shortcode-caption 인접성)를 바꾸면 다시 fallback으로 떨어진다(자동으로 안전). 첫 베타까지는 캡션을 얻는 사용자 가치가 회색 영역 비용보다 크다는 판단. 장기적으로는 Edge Function + Graph API access_token 방식으로 이전
- 검증: 실 URL `instagram.com/reel/DZXAMZRq3aa/`의 fb 응답에서 BWD 거리 50/100/200/400/800 모두 정확한 캡션(`"캡컷으로 모자이크 쉽게 하는 법 .. ★ 🎩 ..."`)을 추출. 200자로 고정하여 같은 객체 sibling 거리만 허용
> 참고: 이후 038에서 일부 릴스의 실제 콘텐츠 caption은 `code` 뒤에 위치하는 구조도 확인되어, 현재 media 객체 안 `code → caption` 매칭을 추가함

---

## 037. Instagram 릴스 통계/깨진 캡션 fallback 차단 (2026-06-18)

**결정**: Instagram link-preview fallback에서 `조회/좋아요/댓글` 통계 문구와 깨진 캡션 문자열을 콘텐츠 제목/내용으로 저장하지 않는다. 캡션이 정상적으로 추출되지 않으면 `Instagram 릴스`/`Instagram 게시물` fallback 제목만 사용한다.

**배경**: 일부 릴스는 facebookexternalhit 응답에서 shortcode 인접 caption JSON이 누락되고 Slackbot `og:description`만 제공된다. 이 값은 `조회 346K회, 좋아요 ...: "캡션"`처럼 통계 prefix가 붙거나 닫는 따옴표 없이 잘리며, Unicode replacement character(`�`)가 포함될 수 있다. 기존 로직은 캡션 추출 실패 시 description 전체를 title/description으로 승격해 화면에 통계 문구와 깨진 글자가 노출됐다.

**결과**:
- 닫는 따옴표 없이 잘린 Slackbot caption은 콜론 뒤 인용부만 후보로 추출
- 후보에 `�`가 포함되면 깨진 문자열로 보고 버림
- Instagram description이 조회수/좋아요/댓글 통계 문구일 때는 title/description fallback 소스로 사용하지 않음
- 정상 caption JSON 또는 정상 Slackbot caption이 없으면 안전한 generic fallback만 저장
- 기존 저장 항목은 Content Detail 진입 시 오염된 Instagram metadata면 refresh를 실행하고, title/description을 새 metadata로 교체하거나 비움

**교훈**: 외부 플랫폼 메타데이터는 “있는 값”보다 “사용자에게 보여도 되는 값”인지가 더 중요하다. 특히 link-preview bot 응답은 통계/잘림/인코딩 실패가 섞일 수 있어, 캡션 추출 실패 시 원문 description 전체를 그대로 승격하면 화면 품질이 급격히 떨어진다.

---

## 038. Instagram 릴스 현재 media 객체 caption 매칭 보강 (2026-06-18)

**결정**: Instagram HTML의 `caption.text` 추출에서 기존 `caption → code` 근접 매칭에 더해, 현재 media 객체 안의 `__isXIGPolarisMedia → code(shortcode) → caption.text` 구조도 우선 매칭한다.

**배경**: `DYxDOPISH7H`, `DZPwcggPDM4` 릴스는 facebookexternalhit 응답에 캡션 전문이 존재하지만, 실제 콘텐츠 caption이 `code` 뒤 약 1,200자 부근에 위치했다. 기존 파서는 `caption.text` 뒤 200자 안에 shortcode가 있는 구조만 허용해 두 URL 모두 캡션을 놓치고 `Instagram 릴스` fallback으로 저장됐다.

**결과**:
- `extractInstagramCaptionFromHtml`이 현재 media 객체 marker(`__isXIGPolarisMedia`)와 URL shortcode를 먼저 확인한 뒤 같은 객체의 caption을 추출
- 기존 `caption → code` fallback은 유지하되 허용 거리를 1,500자로 확대
- 기존 저장 항목의 title이 `Instagram 릴스`/`Instagram 게시물` placeholder면 Content Detail refresh에서 새 caption title로 교체
- 검증 URL:
  - `DYxDOPISH7H` → 제목 `📍저희는 결혼 얘기 나오자마자 이것 부터 했어요`
  - `DZPwcggPDM4` → 제목 `매번 녹음하다가 현타온 적 나만 있냐`

**교훈**: Instagram logged-out HTML은 같은 계정의 추천 timeline과 현재 media payload가 한 응답에 섞인다. 캡션 위치보다 “현재 URL shortcode가 붙은 media 객체인지”를 먼저 확인해야 안전하다.

---

## 039. 다른 플랫폼 메타데이터 추출 일반화 — Phase 1 (2026-06-20)

**결정**: Instagram에만 적용되어 있던 "오염 메타 차단 + platform fallback title" 패턴을 모든 플랫폼으로 일반화한다. 본문 복구(UA 분기/플랫폼 API)는 Phase 2 별건 백로그로 분리한다.

**배경**: 9개 플랫폼(X, Threads, TikTok, LinkedIn, Medium, Velog, Naver Blog, YouTube, Brunch)에 대해 4개 UA(default, facebookexternalhit, Slackbot, Twitterbot)로 og 응답을 비교한 결과:
- **YouTube, Brunch**: 모든 UA에서 정상 추출 (변경 불필요)
- **X**: 모든 UA에서 3,651 bytes `<title>X / ?</title>` 차단 응답. Twitterbot UA는 0 bytes
- **Threads**: 모든 UA에서 `"Threads • Log in"` + `"Join Threads to share ideas..."` generic 응답
- **TikTok**: default/slack에서 빈 og + `<title>TikTok - Make Your Day</title>`, fb/twitterbot에서 `"Visit TikTok to discover videos!"` generic
- **LinkedIn**: 모든 UA에서 빈 og + `<title>LinkedIn</title>` (또는 오래된 URL의 generic)
- **Medium**: default/fb/twitterbot에서 Cloudflare `"Just a moment..."` challenge
- **Velog**: 모든 UA에서 CSR React 번들만 — og:title/description 비어있음
- **Naver Blog**: 실제 콘텐츠가 iframe(PostFrame.naver) 안에 위치, 외부에서는 블로거 계정 title만 노출

Instagram처럼 UA 분기로 해결되는 케이스는 없고, 대부분이 차단/게이트/CSR로 같은 패턴을 보였다. 본문 복구는 플랫폼별 개별 작업이 필요한 반면, "오염된 메타가 콘텐츠 제목/본문으로 승격되는 사고"는 일반화된 가드 하나로 막을 수 있었다.

**결과**:
- `lib/metadata.ts`:
  - `isBadInstagramMetadataText` → `isBadMetadataText`로 일반화. 기존 통계 텍스트(`조회/views/좋아요/likes/댓글/comments`)와 `�` 검사에 더해, 21종의 플랫폼별 generic title 패턴 추가 (`Threads • Log in`, `Just a moment...`, `X / ?`, `TikTok - Make Your Day`, `Visit TikTok…`, `Watch, follow, and discover`, `Join Threads…`, `Top Career Content from LinkedIn`, `네이버 블로그`, `블로그 :: 네이버`, 단독 플랫폼명 등)
  - `instagramFallbackTitle` → `platformFallbackTitle(url)`로 일반화. 호스트별 한국어 fallback: X 게시물 / Threads 게시물 / TikTok 영상 / LinkedIn 게시물 / Medium 글 / Velog 글 / 네이버 블로그 글 / 브런치 글 / Instagram 릴스/게시물
  - `parseMetadata`의 description-as-title 강등과 description 오염 차단 분기를 모든 플랫폼으로 확장 (이전엔 `isInstagramUrl(baseUrl) && isBadInstagram...` 조건이었음)
- `lib/api.ts`:
  - `isInstagramMetadataPolluted` → `isMetadataPolluted` (도메인 가드 제거 — 어떤 플랫폼이든 title/description이 bad면 오염)
  - `isInstagramPlaceholderTitle` → `isPlaceholderTitle` — title === `platformFallbackTitle(url)` 일치 검사로 모든 플랫폼 placeholder 감지
  - `refreshContentMetadata`의 자동 정리가 모든 플랫폼의 오염 레코드에 동작
- `app/content/[id].tsx`:
  - `isPollutedInstagramMetadata` → `isPollutedMetadata` (도메인 가드 제거). Content Detail 진입 시 모든 플랫폼 오염 레코드 자동 refresh
- 시뮬레이션 검증: 9개 플랫폼 e2e fetch에서 YouTube/Brunch는 그대로 정상 추출되고, Threads/X/TikTok/LinkedIn/Medium/Velog는 generic 응답이 `"X 게시물"` 같은 깔끔한 한국어 fallback으로 강등됨

**Phase 2 (백로그)**: 본문 복구는 플랫폼별 개별 작업이라 노력 대비 효용이 다르다 — 별건으로 분리.
- Naver Blog: PostView 응답의 iframe(`PostFrame.naver`) 재fetch → 본문 추출 가능성 높음
- X: `syndication.twitter.com` 또는 nitter 미러 (정책 위험)
- Velog: `velog.io/api/v3` GraphQL 호출 (공개 가능 여부 확인 필요)
- Medium: Cloudflare 우회 (실효성 낮음)
- Threads: facebookexternalhit / Slackbot UA로 본문 캡션 노출 시도 (Instagram처럼 응답 분기 가능성 있음 — 가장 가벼운 첫 단계)
- TikTok/LinkedIn: 우회 경로 없음 — placeholder 유지

**실기기 보강 (2026-06-20 ~ 2026-06-21)**: 시뮬레이션은 통과했지만 실기기 테스트에서 세 차례 추가 보완이 필요했다.

- **Phase 1.1 — 계정명 generic + TikTok 단축 도메인**: Threads `"Threads의 …(@handle)님"` / X `"X에서 …(@handle) 님"` 패턴이 정규식에 없어 통과 → `GENERIC_TITLE_PATTERNS`에 Threads/X/TikTok 형태와 공통 꼬리 `\(@handle\)\s*님$` 추가. TikTok `vt.tiktok.com` / `vm.tiktok.com` 단축 도메인이 fallback 매칭에서 누락 → `endsWith('.tiktok.com')`로 확장.
- **Phase 1.2 — generic description-as-title 누수**: Threads/X가 `og:title`과 `og:description`에 동일한 generic 텍스트를 함께 내려보내는 케이스 발견. description-as-title 폴백이 같은 쓰레기 텍스트를 그대로 흘려보냄 → `parseMetadata`에 `isGenericDesc` 분기 추가. description이 `isGenericTitle` 패턴과 일치하면 title 폴백 후보에서도 제외하고, 저장 description에도 사용하지 않음. `lib/ai.ts`에 중복된 `isGenericTitle` 인라인 로직 제거하고 `isGenericPlatformTitle` import로 단일 진실 소스화.
- **Phase 1.3 — 한글 로그인 게이트 + `threads.com` 도메인**: 실기기에서 Threads URL 저장 시 `"Threads • 로그인"`(한글) 게이트 텍스트가 그대로 통과. 기존 패턴은 영문 `Log in`만 매칭 → `/^Threads\s*[•·]\s*로그인$/i` / `/^로그인\s*[•·]\s*Threads$/i` 추가. 동시에 `threads.com` 도메인이 `PLATFORM_FALLBACK_TITLES`에 누락(`threads.net`만 등록)되어 폴백 자체가 작동 안 함 → `threads.com` 추가.

**교훈**: 플랫폼 메타데이터 문제는 "본문을 가져오기"보다 "쓰레기를 안 보여주기"가 훨씬 가치 대비 효율이 높다. 12개 플랫폼 각각의 본문 복구는 1주일도 걸릴 수 있지만, 일반화된 차단 가드 하나는 모든 플랫폼에 즉시 효과가 있다. 또한 Instagram 작업으로 만든 패턴(`isBadXxxMetadataText` + `xxxFallbackTitle` + `refreshContentMetadata` 자동 정리)이 거의 그대로 일반화에 재사용된 점도 의미 있다 — 도메인 가드만 제거하면 됐다.

---

## 040. Threads 본문 추출 — fb/Slackbot UA 분기 폐기 + share intent meta 경로 조사 (2026-06-22)

**결정**: Threads 게시물 본문(캡션) 추출을 위해 `facebookexternalhit` / `Slackbot-LinkExpanding` UA로 분기 fetch하는 패치를 폐기한다. 대신 `expo-share-intent`의 `ShareIntent.meta` 페이로드 활용 가능성을 조사한다.

**배경**: 039의 Phase 2 백로그 중 "Threads — facebookexternalhit / Slackbot UA로 본문 캡션 노출 시도"를 진행하면서, Instagram에서 효과를 본 동일 패턴(fb UA → Slackbot UA 폴백)을 Threads로 가져온 패치를 `lib/metadata.ts`에 작성하고 실제 5개 게시물 URL로 검증했다.

검증 URL 5종:
- `@binx_lab/post/DZ2PXW-GOM_` (이미지)
- `@choi.openai/post/DZ1JOkvD96u` (이미지/스크린샷)
- `@kargnas/post/DZ1gAuVEWNB` (이미지)
- `@earlthink/post/DZ2qg53D_cU` (이미지)
- `@phenyl1219/post/DZ2TOexH76P` (텍스트 본문)

서버 사이드 9종 UA 비교 (default / facebookexternalhit / Slackbot-LinkExpanding / Mobile Safari / TelegramBot / Twitterbot / LinkedInBot / WhatsApp / Bytespider / Discordbot):

| 게시물 유형 | 결과 |
|---|---|
| 텍스트 본문 게시물 (1/5) | **모든 UA**(default 포함)에서 `<meta name="description">` 정상 노출 → caption 추출 성공 |
| 이미지/스크린샷 게시물 (4/5) | 모든 UA에서 description meta **부재**. og:title은 작성자 프로필 정보(`"CHOI (@choi.openai) on Threads"`)만 노출 |

추가 우회 시도:
- `/embed` URL: 57KB JS-rendered HTML, og 메타 없음, 본문 없음
- `/oembed` 엔드포인트: 인증 필요(빈 응답)
- default UA 530KB HTML inline JSON: `body_text` / `caption` / `post_text` / `text` 키 매칭 0개, 한글 escape 0개 → SSR에 본문 텍스트 자체가 미포함 (client-side render)

→ Threads는 image-only 게시물의 본문 캡션을 봇 UA 어디에도 노출하지 않으며, fb/Slackbot UA 분기는 실제 케이스를 살리지 못한다. 텍스트 본문 게시물은 default UA로도 이미 추출되므로 분기 자체가 무용.

**레퍼런스 앱은 같은 게시물에서 본문을 추출함** — `@choi.openai/post/DZ1JOkvD96u`가 레퍼런스 앱에서는 "GPT-5.6 Pro가 슬슬 모습을 드러내고 있습니다."로 저장됐음. 서버 사이드 fetch로 본문이 안 잡힌 사실과 종합하면, 레퍼런스 앱은 iOS Share Extension이 받는 추가 컨텍스트를 활용하는 것으로 추정.

**`expo-share-intent` 타입 확인 (v7)**:
```ts
interface BaseShareIntent {
  meta?: ShareIntentMeta | null;
  text?: string | null;
}
export type ShareIntentMeta = Record<string, string | undefined> & {
  title?: string;
};
```

iOS `parseShareIntent`는 `NSExtensionItem.weburls[].meta`(JSON)를 `meta` 필드로 전달. Safari/Threads가 페이지 title(또는 게시물 본문)을 여기 넣어 보낸다면 fetch 우회 없이 본문을 받을 수 있다.

**결과**:
- `lib/metadata.ts`의 fb/Slackbot UA 분기 + `THREADS_HOST_RE` + `isThreadsUrl` + `hasUsefulSocialBotResponse` 등 미커밋 패치 폐기 (`git restore`)
- `test-threads.mjs` 검증 스크립트 삭제
- `app/_layout.tsx`에 `shareIntent` 페이로드 dev 전용 로그 추가 — 실기기에서 Threads / X / TikTok 등 게시물 공유 시 `meta` / `text` / `webUrl` 실제 값 확인용
- 후속 단계: 실기기 로그에서 `meta.title`이 본문(또는 활용 가능한 텍스트)으로 들어오면 `saveContent` 경로에 그 값을 우선 사용. 들어오지 않으면 Threads 본문은 "Threads 게시물" 폴백 유지(정직한 폴백, 039 패턴 그대로)

**교훈**: "다른 앱이 잘 하니까 같은 우회가 통할 것"이라는 가정은 검증 전엔 비싸다. Instagram에서 효과 본 fb/Slackbot UA 패턴을 같은 모회사(Meta) 제품인 Threads로 가져왔지만, image-only 게시물에서 봇 메타 노출 정책은 다르다. 서버 사이드 fetch 우회가 통하지 않으면 클라이언트(Share Extension) 페이로드에 다른 신호가 있을 가능성을 살펴야 했다 — 한 채널을 끝까지 시도한 다음에야 채널 자체를 바꾸는 게 효율적이다.

---

## 041. Threads 본문 추출 구현 — `<title>` 태그 활용 + share intent meta 우선 (2026-06-22)

**결정**: Threads 게시물 본문 추출을 위해 두 경로를 동시에 활용한다.
1. **`<title>` 태그를 description 폴백 후보**로 사용 — Threads 페이지의 `<title>` 태그가 게시물 본문 전체를 담는다.
2. **`shareIntent.meta` 우선 사용** — Safari 공유 시 share extension이 클라이언트 렌더 후 head meta를 전달, fetch 생략하고 그 정보로 LinkMetadata 구성.

**배경**: §040 후속 검증에서 레퍼런스 앱이 우리 fetch로는 못 가져오는 게시물(gptaku_ai 텍스트, choi.openai 이미지 등)의 본문을 추출하는 것을 확인. 같은 URL을 우리가 default UA로 fetch했을 때 HTML 안에 본문 키워드("AI로 유튜브")가 분명히 존재함을 발견 → 우리 `parseMetadata`가 `<title>` 태그를 활용하지 않는 게 원인.

4개 실 URL HTML 정밀 분석:

| URL | `<title>` 내용 | og:title | og:description |
|---|---|---|---|
| `@aovrine/post/DZ2g4rNEuqs` | "더워도 좋은 여름..☀️ (출근할 때 빼고)" 24자 | "서린집 (@aovrine) on Threads" (generic) | 본문 |
| `@gptaku_ai/post/DZzXhjmkw-t` | **본문 전체 212자** | generic | 일부만 |
| `@choi.openai/post/DZ1JOkvD96u` | **본문 전체 151자** | generic | (없음) |
| `@phenyl1219/post/DZ2TOexH76P` | **본문 전체 366자** | generic | 본문 |

→ **모든 Threads 페이지의 `<title>` 태그에 게시물 본문이 통째로 들어있다**. og:title은 항상 작성자 generic. 우리 `parseMetadata`는 og:title을 우선해서 `<title>`을 무시했고, og:title이 generic이면 og:description으로 폴백했지만 description이 없는 케이스(choi.openai)는 결국 `"Threads 게시물"` placeholder로 떨어졌다.

**Share intent payload 측정 (실기기)**: §040의 dev 진단 로그로 두 경로 확인.
- **Safari → 공유**: `shareIntent.meta`에 페이지 head meta 풍부(og:title/og:description/title/twitter:* 등). Safari의 JavaScript preprocessing이 클라이언트 렌더 후 head를 추출해 NSExtensionItem에 전달.
- **Threads 네이티브 앱 → 공유**: `shareIntent.meta = {}` 빈 객체. 앱이 URL attachment만 보내고 추가 컨텍스트 없음(iOS 사양).

**결과**:

- `lib/metadata.ts`:
  - `parseMetadata`에 `<title>` description 폴백 분기 추가. `<title> !== og:title`이고 generic/bad가 아니면 description 후보로 사용, og:description보다 길면 우선. 기존 description-as-title 폴백이 첫 줄을 title로, 전체를 description으로 처리.
  - 일반 사이트는 `<title> === og:title`이라 가드 통과 못 함 → 영향 없음. Threads/Instagram 등 generic og:title 플랫폼에만 효과.
  - `shareIntentMetaToHtml(meta)` 헬퍼: share intent meta를 가짜 HTML로 변환(`meta.title` → `<title>`, 나머지 → `<meta>` 태그). 기존 generic/bad 가드, description-as-title 폴백 등 전체 파이프라인을 그대로 재사용.
  - `fetchLinkMetadata(url, { shareIntentMeta })` 시그니처 확장. `meta`가 풍부하면 fetch 생략.
- `lib/api.ts`: `saveContent`에 `shareIntentMeta` 옵션 추가, `fetchLinkMetadata`에 위임.
- `app/_layout.tsx`: share intent useEffect에서 `shareIntent?.meta`를 `saveContent`에 전달.
- 검증 결과(서버 사이드 fetch 시뮬레이션, 4개 URL):
  - aovrine: title `"더워도 좋은 여름"`, description `"더워도 좋은 여름..☀️ (출근할 때 빼고)"` ✅
  - gptaku_ai: title `"AI로 유튜브 딸깍 강의는"`, description 본문 전체 ✅ (이전: 폴백)
  - choi.openai: title `"상위 1%만 보고 있는 이번 주 스레드에 올라왔던 중요한 정보들만 모았습니다"`, description 본문 전체 ✅ (이전: 폴백)
  - phenyl1219: title `"예술성, 창조성은 감각적 예민함을 기반으로 한다"`, description 본문 전체 ✅

**기대 동작**:
- **Threads 앱 공유**: URL fetch → SSR HTML에서 `<title>` 추출 → 본문 정상 저장
- **Safari 공유**: share intent meta 활용 → fetch 생략 → SSR에 누락된 dynamic meta까지 살림(보너스)
- **그 외 플랫폼**: `<title> === og:title` 가드로 기존 동작 유지

**교훈**: 외부 플랫폼의 본문 노출 방식은 자주 비대칭적이다 — Threads는 `<title>` 태그에 모든 정보를 우겨 넣는 반면 OG에는 작성자 정보만 넣는다. 봇 메타 표준(og:title/og:description)만 보고 폴백 결정하지 말고, SSR HTML 전체에서 본문 키워드가 어디 들어있는지 raw search로 확인하는 패스를 먼저 두는 게 효율적이다. 또한 share extension payload는 fetch와 보완적 — Safari 공유는 클라이언트 렌더 결과를 함께 받기 때문에 SSR 한계 우회를 그대로 가져다 쓸 수 있다.

---

## 042. X 게시물 본문 추출 — `<title>` 래퍼 제거 (2026-06-22)

**결정**: X/Twitter 게시물은 `<title>`의 `작성자 on X: "본문" / X` 래퍼를 제거해 본문만 title/description 후보로 사용한다.

**배경**: 실기기 저장에서 X 게시물이 `"X 게시물"` fallback으로 저장되는 케이스가 발견됐다. 서버 응답을 확인하니 `og:title`은 `"작성자 (@handle) on X"` 형태의 generic 값이고, `og:description`은 비어 있었지만 `<title>`에는 게시물 본문이 들어 있었다. 기존 041의 `<title>` 활용은 Threads에는 맞았지만 X의 author wrapper를 제거하지 못했다.

**결과**:
- `lib/metadata.ts`에 X/Twitter URL 판정과 `extractXPostTextFromTitle` 추가
- X `<title>`에서 본문만 추출해 description 후보로 우선 사용
- HTML entity가 중첩된 `Q&amp;A` 같은 값을 `Q&A`로 정리하도록 `decodeHtml`을 최대 3회 반복 decode
- 검증 URL 2개:
  - `https://x.com/lalala13580351/status/2068862254624514281` → title `"미래적금 Q&A 담당자에게 직접 물어보고 왔습니다"`
  - `https://x.com/krongggggg/status/2068854464669528067` → title `"이건 계속 리마인드 해줘야함"`

**교훈**: 같은 `<title>` 활용이라도 플랫폼마다 wrapper 문법이 다르다. `og:*`가 generic일 때는 `<title>` 전체를 그대로 쓰기보다 플랫폼별 최소 wrapper 제거를 거쳐야 사용자에게 의미 있는 제목이 된다.

---

## 043. Share Intent generic metadata는 fetch 생략 금지 (2026-06-22)

**결정**: `shareIntent.meta`가 존재하더라도 파싱 결과가 generic/fallback뿐이면 서버 fetch를 계속 진행한다.

**배경**: X 앱 공유에서 `shareIntent.meta`에 `og:title: "LE_ (@dhcs01) on X"`처럼 작성자 generic 값만 들어오는 케이스가 있었다. 기존 로직은 meta가 있으면 fetch를 생략했기 때문에, 042의 X `<title>` 본문 추출 로직까지 도달하지 못하고 `"X 게시물"` fallback으로 저장됐다.

**결과**:
- `fetchLinkMetadata`에서 share intent meta를 먼저 파싱하되, `description`이 있거나 title이 fallback/generic/bad가 아닐 때만 즉시 사용
- generic meta뿐이면 기존 서버 fetch 경로로 넘어가 `<title>` 본문 추출을 수행
- X `<title>`에서 추출한 본문은 실제 게시물 본문이므로, 본문 안에 `조회수`/`좋아요` 같은 단어가 있어도 Instagram 통계 오염 필터로 description을 버리지 않음
- iOS/React Native 런타임에서 `x.com` HTML fetch가 실패하거나 placeholder/generic 응답만 받는 경우를 대비해 `publish.twitter.com/oembed` fallback 추가. oEmbed의 `<blockquote><p>...</p></blockquote>`에서 본문을 추출해 title/description 구성
- 검증 URL `https://x.com/dhcs01/status/2068688859677028618?s=46`:
  - share meta 없음 → `"생각보다 Ai가 많이 안쓰는 단어들"`
  - generic X app share meta 있음 → `"생각보다 Ai가 많이 안쓰는 단어들"`
- 추가 검증 URL `https://x.com/hyeok8911/status/2068860921192341841?s=12`:
  - title → `"유튜브 쇼츠 성장기 8일차"`
  - description → 조회수/좋아요가 포함된 게시물 본문 전체 보존
- 강제 실패 검증: `x.com` HTML fetch를 503으로 mock해도 oEmbed fallback으로 `"유튜브 쇼츠 성장기 8일차"` 복구

**교훈**: Share Extension payload는 fetch보다 우선할 수 있지만, 항상 더 신뢰할 수 있는 것은 아니다. 특히 네이티브 앱 공유는 URL attachment와 작성자 generic meta만 넘기는 경우가 있어, “meta 존재 여부”가 아니라 “콘텐츠로 쓸 수 있는지”를 기준으로 fetch 생략을 결정해야 한다.

---

## 044. X 원문 바로가기 — 커스텀 scheme 대신 Universal Link 사용 (2026-06-22)

**결정**: X/Twitter 원문 바로가기는 `twitter://open...` 커스텀 scheme을 사용하지 않고 원본 HTTPS URL을 그대로 연다.

**배경**: Content Detail의 원문 바로가기에서 X 게시물로 정확히 이동하지 않는 문제가 있었다. 기존 구현은 `twitter://open${pathname}`으로 앱 scheme을 직접 만들었는데, 이 방식은 앱을 열 수는 있어도 특정 게시물 path 보존을 보장하지 않는다.

**결과**:
- `lib/utils.ts`에서 X/Twitter host를 별도 처리
- `x.com`, `twitter.com` 링크는 `Linking.openURL(https URL)`로 iOS Universal Link에 위임
- 실패 시 `WebBrowser.openBrowserAsync`로 fallback
- 기존 `twitter://open...` APP_SCHEMES 항목 제거

**교훈**: 앱 scheme은 설치 여부 확인에는 편하지만 deep link path 보존이 플랫폼마다 불안정하다. 게시물처럼 정확한 URL 이동이 중요한 경우에는 Universal Link가 더 안전한 기본값이다.

---

## 045. Notion 링크 저장 — public page API + URL slug fallback (2026-06-22)

**결정**: Notion 링크는 페이지 ID가 있으면 Notion public page data(`loadPageChunk`)에서 제목과 본문을 먼저 추출한다. API 추출이 불가능하거나 generic/마케팅 metadata만 내려오면 URL slug에서 페이지 제목을 복구한다.

**배경**: Notion 공유 링크는 공개 페이지, 비공개 페이지, `notion.so`, `notion.site`, `notion.com` 형태가 섞인다. 테스트 링크 `https://bubble-occupation-f87.notion.site/AI-ETF-3771adde24fa80d7a58dda42462c9024?pvs=149`의 초기 HTML은 `<title>Notion</title>`과 `"Notion | Where teams and agents work together"` 같은 generic OG만 내려줬지만, dashed page ID로 `loadPageChunk`를 호출하면 실제 페이지 title/content를 받을 수 있었다.

**결과**:
- `lib/metadata.ts`에 Notion host 판정 추가
- Notion URL에서 32자리 UUID / dashed UUID page ID 추출 후 `loadPageChunk` 호출
- page block title과 child block text를 모아 title/description 구성
- Notion URL 마지막 slug에서 UUID suffix 제거 후 제목 fallback 복구
- Notion generic title/description 패턴 차단
- 테스트 링크는 title `"AI 시대 씹어먹는 ETF 총정리"`, description은 실제 본문 상위 블록으로 저장
- API 실패 시 slug가 있는 비공개/404 링크는 `My Project Plan`, `Portfolio Archive`처럼 URL 기반 제목으로 저장
- slug가 없는 UUID-only 링크는 `"Notion 페이지"` fallback
- `lib/utils.ts`에서 `notion.so`, `notion.com`, `*.notion.site` 출처 표시를 `Notion`으로 통일
- 썸네일/cover가 없는 Notion 링크는 저장 thumbnail을 비워두고, UI에서 Notion 문서 placeholder(문서 아이콘)를 표시
- Notion 원문 바로가기는 `notion.so`/`notion.com` 링크에서만 `notion://www.notion.so...` scheme을 먼저 시도
- `*.notion.site` 공개 공유 링크는 Notion 앱이 다시 Safari로 튕기는 경우가 있어, 앱 scheme을 강제하지 않고 인앱 브라우저로 연다
- `app.json`의 `LSApplicationQueriesSchemes`에 `notion` 추가

**교훈**: Notion은 접근 권한에 따라 OG metadata 신뢰도가 크게 달라진다. 공유 HTML의 generic metadata보다 page ID 기반 데이터가 훨씬 정확하며, API가 실패할 때만 URL 구조를 fallback으로 쓰는 것이 가장 안정적이다.

---

## 046. 이번 주 배포 준비는 TestFlight 우선으로 고정 (2026-06-22)

**결정**: 이번 주 배포 준비 목표를 App Store 정식 승인보다 TestFlight 제출 가능 상태로 고정한다.

**배경**: 핵심 저장 플랫폼 검증은 통과했지만, Analytics 실기기 검증과 Auth/Onboarding 회귀 테스트, Apple Developer/App Store Connect 계정 정보 확인이 아직 남아 있다. 수요일까지 배포 가능성을 높이려면 신규 기능이 아니라 release blocker 확인과 iOS 빌드 준비에 집중해야 한다.

**결과**:
- `docs/release-readiness.md`에 수요일까지 작업 순서, release blocker, 실기기 smoke test, EAS/TestFlight 준비값을 정리
- `docs/mvp-backlog.md`를 현재 구현/검증 상태 기준으로 현행화
- `docs/progress.md`에 2026-06-24(수)까지의 배포 준비 계획 추가

**대안 검토**: App Store 정식 제출까지 한 번에 목표로 잡는 방식도 가능하지만, Apple Developer capability와 App Store Connect 앱 정보가 확정되지 않은 상태에서는 일정 리스크가 크다. 먼저 TestFlight 업로드 가능 상태를 만드는 것이 이번 주 목표에 더 안전하다.

---

## 047. Analytics 실기기 검증 전 invalid URL과 Share Sheet 진입 보강 (2026-06-22)

**결정**: Analytics 검증 기준과 실제 코드가 어긋나지 않도록 직접 입력 invalid URL 경로와 Share Sheet app_opened 발화를 보강한다.

**배경**: Save Bottom Sheet에서 잘못된 URL을 입력하면 UI 에러만 표시되고 `save_attempted` / `save_failed.invalid_url` 이벤트가 남지 않았다. 또한 Share Intent payload가 AppState active보다 늦게 도착하면 첫 `app_opened`가 `direct`로 기록되고, 같은 세션이라 `share_sheet` 진입 이벤트가 누락될 수 있었다.

**결과**:
- 직접 입력 invalid URL에서 `save_attempted.entry_source='direct'`와 `save_failed.failure_reason='invalid_url'` 기록
- 같은 세션에서 Share Sheet 진입이 늦게 감지되면 `app_opened.entry_source='share_sheet'`를 1회 보정 기록
- `saveContent` 내부 실패 처리와 중복 URL 이벤트 구조는 그대로 유지

**교훈**: Analytics는 “기능이 동작한다”와 별개로 실패 전 조기 return 경로와 네이티브 payload 감지 타이밍을 따로 점검해야 한다.

## 048. URL 정규화 — 추적 파라미터 제거로 중복 저장 방지 (2026-06-23)

**결정**: `normalizeUrl`에서 콘텐츠 식별과 무관한 추적/공유 파라미터를 제거한 뒤 저장한다. 화이트리스트가 아니라 명시적 블랙리스트를 쓴다.

**배경**: 같은 YouTube 영상을 두 번 저장했을 때 `unique(user_id, url)` 제약이 막지 못하고 두 row가 모두 생성됐다. 원인은 YouTube 공유 시마다 새로 생성되는 `si=` 파라미터로 URL이 매번 달랐기 때문이다 (`?v=GVjeXuCjJgo&si=pieJ0w7d1UVURIP1` vs `?v=GVjeXuCjJgo&si=ixhvTBZ7uLo2YMGW`). 동일하게 X의 `?s=46`, UTM 묶음, `fbclid`, `gclid`, Instagram `igshid` 같은 추적 전용 파라미터들이 중복 저장을 유발할 수 있다.

**결과**:
- `lib/metadata.ts` `normalizeUrl`이 `si`, `feature`, `utm_source`, `utm_medium`, `utm_campaign`, `utm_content`, `utm_term`, `fbclid`, `gclid`, `igshid`, `s` 파라미터를 제거 후 반환
- 콘텐츠 식별자(`v`, `t`, `list`, `id` 등)는 보존
- 정규화된 URL이 그대로 `contents.url`로 저장되어 unique 제약이 정상 작동
- 이미 저장된 중복 row는 코드 변경 영향 없음 — Supabase에서 수동 정리

**고려한 대안**:
- (a) **화이트리스트 방식 (콘텐츠 식별자만 보존)** — 더 강력하지만 알 수 없는 도메인의 파라미터를 일괄 제거해 서로 다른 콘텐츠를 같은 URL로 오인할 위험이 있어 채택하지 않음
- (b) **DB 마이그레이션으로 전수 정규화** — 단일 사용자 시점이라 오버킬. 신규 저장만 정규화

**교훈**: unique 제약은 “정규화된 키”를 전제로 동작한다. 외부 공유 URL은 추적 파라미터로 인해 동일 콘텐츠라도 매번 달라지므로, 비교 키로 쓸 컬럼은 저장 직전에 반드시 한 차례 정규화한다.

## 049. Notion 호스트 인식 — 서브도메인 일괄 매칭으로 통일 (2026-06-23)

**결정**: Notion 본진 호스트(`notion.so`, `notion.com`)와 그 서브도메인을 정규식 한 줄로 일괄 매칭하도록 `lib/utils.ts`를 정리한다. 출처 표시와 원문 바로가기 라우팅 모두 동일 규칙을 쓴다.

**배경**: Notion 공유 링크가 `https://app.notion.com/p/<id>?source=copy_link` 형태로도 발급되는데, 기존 `NOTION_APP_HOSTS` Set은 `notion.so`/`www.notion.so`/`notion.com`/`www.notion.com`만 들고 있어서 `app.notion.com`을 흡수하지 못했다. 그 결과:
- 출처가 "Notion"이 아닌 `app.notion.com`으로 표시됨
- `openInAppOrBrowser`의 `notion://` 스킴 경로를 못 타고 기본 `Linking.openURL(https URL)`로 빠짐 (iOS Universal Link로 결과는 동일하지만 폴백 동작이 달라짐)

**결과**:
- `NOTION_APP_HOSTS` Set → `NOTION_APP_RE = /(^|\.)notion\.(so|com)$/i`로 교체 — `app.notion.com`, `team.notion.com` 등 모든 서브도메인 흡수
- `formatSource`가 `NOTION_APP_RE.test(host) || NOTION_SITE_RE.test(host)`로 Notion을 통합 판정, 중복된 DOMAIN_LABELS 항목 4개 제거
- 메타데이터 경로(`lib/metadata.ts`의 `NOTION_HOST_RE`, `extractNotionPageId`)는 이미 `endsWith('.notion.com')` 패턴이라 무손상 — 별도 수정 불필요

**고려한 대안**:
- (a) **`app.notion.com`만 명시 추가** — 다음에 또 다른 서브도메인이 나오면 같은 누락이 반복될 위험
- (b) **저장 시점에 `app.notion.com` → `notion.com` 도메인 정규화** — 도메인이 콘텐츠 표시에만 쓰이는 게 아니고 향후 디버깅에 원본이 도움 될 수 있어 보존

**교훈**: 외부 서비스가 도메인을 늘릴 가능성이 큰 영역(공유 링크 도메인 등)은 처음부터 정규식으로 잡는 게 안전하다. `Set`은 명시적이지만 누락이 보이지 않게 묻힌다.

## 050. Instagram 원문 바로가기 — 비공식 `instagram://media?id=` 우선 (2026-06-23)

**결정**: Instagram 게시물/Reels/IGTV 원문 이동 시 shortcode를 64진수 디코딩한 numeric media ID로 `instagram://media?id=<id>` 스킴을 먼저 시도한다. 실패하면 기존 Universal Link → SFSafariViewController 순으로 폴백한다.

**배경**: 인스타 앱이 강제 종료된 cold start 상태에서 Universal Link로 HTTPS URL을 던지면 인스타 앱이 URL을 잃어버리고 홈 피드로 빠지는 알려진 동작이 있다. 사용자 보고: "인스타 스와이프 업 → 종료 상태에서 원문 바로가기 누르면 제대로 안 됨". 인스타 앱이 warm일 때는 Universal Link가 정상 동작해 간헐적으로 보였다.

**결과**:
- `lib/utils.ts`에 `instagramMediaIdFromUrl` 헬퍼 추가 — shortcode (`/p|reel|tv|reels/<sc>`)를 인스타 알파벳 `A-Za-z0-9_-`로 64진수 디코딩
- `openInAppOrBrowser`의 Instagram 분기가 deep-link → Universal Link → 인앱 브라우저 3단 폴백 구조로 변경
- shortcode↔ID roundtrip 6/6 검증 (`A=0`, `B=1`, `_=63`, `BA=64`, 11자리 shortcode 등)
- `LSApplicationQueriesSchemes`에 `instagram`이 이미 있어 `canOpenURL`/`openURL` 권한 OK

**고려한 대안**:
- (a) **항상 SFSafariViewController로 열기** — 가장 안정적이지만 인스타 앱이 있을 때도 브라우저로 떨어져 UX 다운그레이드. "정확한 원문 이동" 원칙과 어긋남
- (b) **`canOpenURL` 결과만 신뢰하고 Universal Link 그대로** — 현재 버그 그대로
- (c) **OpenAuthSession이나 비공식 사설 라이브러리 사용** — 의존성 추가 비용이 큼

**리스크**: `instagram://media?id=<id>`는 비공식 API다. 인스타가 스킴 동작을 변경하면 1순위가 깨지지만, 2순위 Universal Link / 3순위 SFSafariViewController로 자동 폴백되므로 사용자 영향은 "warm일 때와 같은 동작으로 복귀"에 그친다.

**교훈**: iOS Universal Link는 대상 앱의 cold start 핸들링에 종속된다. 앱별 동작 차이를 무시하지 말고, 신뢰할 수 있는 deep-link 경로가 있으면 그쪽을 1순위로 두는 게 정확성에 유리하다.

## 051. 썸네일 placeholder 단일 색상으로 통일 (2026-06-23)

**결정**: 콘텐츠 ID 해시 기반 무작위 색상(`placeholderColor`, `rediscoverColor`) 두 시스템을 폐기하고 `THUMBNAIL_PLACEHOLDER = '#DDD7CE'` 단일 상수로 통일한다.

**배경**: 썸네일이 없는 카드의 placeholder가 화면별로 다른 인상을 줬다. Recent / Category / Search / Content Detail은 연한 파스텔 12색 중 하나(ContentCard), Rediscover는 어두운 무드 5색 중 하나(RediscoverCard)를 ID 해시로 골랐다. 한 콘텐츠가 화면을 옮겨 다닐 때 색은 같지만 톤 체계가 갈라져 시각적 일관성이 부족했다.

**결과**:
- `lib/utils.ts`에서 `placeholderColor()`, `rediscoverColor()`, `PLACEHOLDER_COLORS`, `DARK_COLORS` 제거 → `THUMBNAIL_PLACEHOLDER` 단일 상수 export
- 5개 화면(`app/category/[id].tsx`, `app/search.tsx`, `app/(tabs)/index.tsx`, `app/recent-saved.tsx`, `app/content/[id].tsx`) 모두 같은 상수 import
- `RediscoverCard`의 `gradientDark` prop → `placeholderColor`로 이름 변경 (연한 톤이 들어오므로 의미 정정)
- 연한 placeholder 위에서 흰 글자가 안 보이는 문제 → source pill을 흰 배경 + secondary 글자로, Notion 아이콘은 secondary 색으로 — 썸네일 이미지/플레이스홀더 둘 다 가독성 확보

**고려한 대안**:
- (a) **모든 화면에 어두운 톤 단일 색** — Rediscover의 흰 글자는 유지되지만 ContentCard의 작은 56×56 thumbnail이 어두워져 전체 분위기 무거워짐
- (b) **썸네일 없을 때 아이콘 표시로 대체** — 의미 전달은 강해지지만 콘텐츠 카드의 시각 리듬이 깨짐
- (c) **ID 해시 색상은 유지하고 톤만 한 시스템으로 통일** — "통일"이 약함. 사용자 요청 의도는 "한 색"

**교훈**: 같은 함수를 쓰더라도 호출하는 컴포넌트의 디자인 컨텍스트가 다르면 사용자에겐 다른 시스템으로 보인다. UI 일관성은 함수 단위가 아니라 *사용자가 본 화면* 단위로 점검한다.

## 052. 저장 결과 알림 — Toast 단일 채널로 통일 (2026-06-23)

**결정**: Share Sheet 저장과 Save Bottom Sheet(URL 직접 입력) 저장이 같은 글로벌 Toast 시스템으로 결과를 보여주도록 통일한다. 결과 표시 방식과 메시지 문구를 두 경로에서 동일하게 가져간다.

**배경**: 저장 결과 알림이 진입 경로에 따라 달랐다.
- Share Sheet: 글로벌 Toast (성공/중복/실패)
- Save Bottom Sheet: 성공은 시트 내부 체크 UI(1.6초 후 닫힘), 중복/실패는 모달 Alert

같은 행위(콘텐츠 저장)인데 결과 표현이 달라 사용자가 두 패턴을 따로 학습해야 했다. 특히 Alert는 모달이 깔리는 무게감이 있어 가벼운 토스트와 인지 부담이 크게 차이 났다.

**결과**:
- `lib/toast.tsx`에 ToastProvider/useToast 글로벌 컨텍스트 도입 — `show(message, type)` 한 함수로 어디서든 호출
- `app/_layout.tsx`의 setState 기반 Toast → `useToast()` 호출로 마이그레이션, ToastProvider로 RootNavigator 감쌈
- `components/SaveBottomSheet.tsx`:
  - Alert(중복/실패) 제거 → `toast.show(message, 'error')`
  - 시트 내부 success UI + 1.6초 지연 제거 → 즉시 `onClose()` + `toast.show('저장 완료!', 'success')`
  - `saved` state와 관련 스타일(`successContainer`, `successCircle`, `successTitle`) 삭제
- 결과: Save 경로 어디서 들어와도 동일한 Toast UX

**고려한 대안**:
- (a) **Toast를 SaveBottomSheet 내부에서 직접 렌더링** — 시트가 닫히면 Toast도 사라져 결과 메시지가 함께 사라짐. UX 단절
- (b) **SaveBottomSheet onSaved 콜백을 결과(`'saved' | 'duplicate' | 'error'`)와 함께 호출 → 부모가 Toast 표시** — 호출처가 1곳뿐이라 가능했지만, 미래에 호출처가 늘어나면 각자 토스트를 띄워야 해 응집도 떨어짐. 글로벌 컨텍스트가 더 깨끗
- (c) **Alert는 유지하고 Share Sheet도 Alert로 통일** — 방향 반대. 사용자가 Toast 방향을 명시

**교훈**: 같은 도메인 행위(저장)는 결과 표현도 같은 채널로 일관되게 가야 한다. UI 채널이 진입 경로별로 갈리면 사용자는 같은 사실을 두 형식으로 학습해야 한다.

## 053. YouTube URL 캐논 정규화 — youtu.be / shorts / m 호스트 통합 (2026-06-23)

**결정**: 같은 영상이 여러 호스트/경로 형태로 들어와도 동일 row로 묶이도록 `normalizeUrl`이 YouTube 영상 URL을 `https://www.youtube.com/watch?v=<id>` 캐논 폼으로 정규화한다.

**배경**: §048(추적 파라미터 제거)에도 불구하고 YouTube 영상의 중복 저장이 다시 발견됐다. 실기기 회귀에서 확인된 케이스:
- `https://youtu.be/pdLEHfkwgV8` (share extension에서 들어옴 — 단축 URL)
- `https://youtube.com/watch?v=pdLEHfkwgV8` (클립보드 붙여넣기 — full URL)

§048은 같은 호스트의 추적 파라미터만 정규화했고, 호스트/경로 형태 차이는 별도 row로 인정하고 있었다. YouTube는 공식적으로 4가지 이상의 표현(`youtu.be`, `youtube.com`, `www.youtube.com`, `m.youtube.com`)과 `/watch?v=`/`/shorts/` 두 경로를 같은 영상에 사용한다.

**결과**:
- `lib/metadata.ts`에 `canonicalizeYoutube` 추가
- 매칭 호스트: `youtu.be`, `youtube.com`, `www.youtube.com`, `m.youtube.com`
- 매칭 경로: `youtu.be/<id>`, `/watch?v=<id>`, `/shorts/<id>`
- 11자 `[A-Za-z0-9_-]` 영상 ID 정규식으로 안전성 검증 → 비-영상 URL(`/channel`, `/playlist`, `/@handle` 등)은 변형 없이 통과
- v 외 파라미터(`t`, `list`, `index` 등)는 캐논으로 이전될 때 보존
- 추적 파라미터 제거 → 캐논화 순서로 적용
- 검증: 16/16 (4가지 호스트, shorts, 타임스탬프 보존, playlist 보존, 비-영상 URL 변형 없음, music.youtube.com 보존 등)

**고려한 대안**:
- (a) **`music.youtube.com`도 캐논화 대상에 포함** — 같은 영상이지만 YouTube Music 앱은 별도 플레이어 경험이라 사용자가 의도적으로 구분하고 싶을 수 있어 보존. 중복 빈도 보고 추후 결정
- (b) **DB 마이그레이션으로 기존 중복 row 병합** — 단일 사용자 단계이므로 수동 정리. 코드 변경은 신규 저장만 캐논화
- (c) **`v=` 값이 11자가 아니어도 캐논화** — 비표준 ID의 URL이 들어오면 오작동 위험 있어 11자 정규식으로 안전 가드

**교훈**: 정규화는 "같은 콘텐츠를 같은 키로" 보장하는 작업이다. 추적 파라미터 제거(§048)는 같은 호스트 내 변형을 잡았지만, 같은 콘텐츠가 여러 호스트/경로 형태로 표현되는 사이트(YouTube가 대표적)는 추가로 캐논 폼 매핑이 필요하다. 단일 사이트 단위로 캐논 규칙을 정의하는 게 안전 — 모든 사이트에 적용하는 일반 규칙은 비-영상 URL을 망가뜨리기 쉽다.

## 054. Share Intent 저장 중 로딩 Toast 표시 (2026-06-23)

**결정**: Share Sheet로 들어온 링크를 저장할 때 저장 시작 즉시 `저장 중...` Toast를 표시하고, 저장 결과에 따라 기존 성공/실패 Toast로 교체한다.

**배경**: Share Sheet 진입은 앱이 열린 직후 `saveContent`가 비동기로 실행되므로, 메타데이터 추출과 저장이 끝나기 전까지 사용자가 진행 상태를 알 수 없었다. Save Bottom Sheet의 저장 버튼은 로딩 상태를 보여주는데 Share Intent 경로만 무응답처럼 보이는 UX 차이가 있었다.

**결과**:
- Toast 타입에 `loading` 추가
- `duration: null` 옵션으로 자동 종료되지 않는 진행 중 Toast 지원
- `app/_layout.tsx`의 Share Intent 저장 시작 시 `저장 중...` Toast 표시
- 저장 완료/중복/실패 시 기존 결과 Toast가 새 key로 렌더링되며 로딩 Toast를 자연스럽게 대체

**고려한 대안**:
- (a) **화면 중앙 오버레이 로딩** — Share Sheet 저장은 앱 첫 화면 위에서 가볍게 일어나는 작업이라 지나치게 무겁다.
- (b) **저장 완료 Toast만 유지** — 사용자가 요청한 "저장 중 인지" 문제를 해결하지 못한다.
- (c) **Share Intent 전용 로딩 컴포넌트 추가** — Toast 단일 채널 결정(§052)과 어긋나며 새 UI 경로가 생긴다.

## 055. 홈에 Forgotten Content 섹션 추가 (2026-06-25)

**결정**: 홈 화면에 "잊고 있던 콘텐츠" 섹션을 추가한다. 한 번이라도 열어봤지만 14일 이상 다시 보지 않은 콘텐츠를 viewed_at ASC 순으로 최대 10개 노출. (기본값 30일 → 14일로 조정, 정식 출시 직후 데이터 양 고려)

**배경**: 정식 출시 후 2차 범위로 명시되어 있던 Forgotten Content를 1차 후속 업데이트 핵심 기능으로 채택. 기존 Rediscover(한 번도 안 본 콘텐츠)와 명확히 구분되는 별개 섹션이 필요했다.

**결과**:
- `lib/api.ts`에 `getForgottenContents(limit = 10, days = 30)` 추가 — `viewed_at IS NOT NULL AND viewed_at < now() - 30 days` 조건, viewed_at 오름차순 (가장 오래 잊혀진 순)
- `lib/analytics.ts` `ContentOpenedSource`에 `'forgotten'` 추가
- `app/content/[id].tsx` `CONTENT_OPENED_SOURCES` 화이트리스트에도 추가
- 홈 섹션 렌더링: `app/(tabs)/index.tsx`에서 `최근 저장 → 발견된 콘텐츠(Rediscover) → 잊고 있던 콘텐츠(Forgotten)` 순. 데이터 없으면 섹션 숨김
- 시각 디자인은 `RediscoverCard` 재사용 — 가로 스크롤 카드 통일, 디자인 시스템 일관성 유지. 구분은 SectionHeader 라벨/아이콘(`hourglass-outline`)으로

**구분 정의**:
- **Rediscover**: `viewed_at IS NULL` + 최근 14일 이내 저장. 한 번도 안 본 콘텐츠
- **Forgotten**: `viewed_at IS NOT NULL` + `viewed_at < 14일 전`. 봤지만 오래 안 본 콘텐츠 (사용 데이터 쌓이면 30일로 재조정 검토)

**고려한 대안**:
- (a) **ForgottenCard 별도 컴포넌트** — 시각적으로 더 강하게 구분 가능하지만 단일 PR 범위 초과, 디자인 시스템 분기 위험
- (b) **Rediscover와 통합한 단일 '재발견' 섹션** — 정의가 모호해져 사용자 인지 부담 ↑
- (c) **Forgotten 클릭 시 별도 source 안 잡고 'rediscover' 재사용** — 분석상 두 경로의 사용자 행동을 구분 못 함. content_opened source는 따로 잡음

**교훈**: 새 데이터 섹션 추가 시 `ContentOpenedSource` 타입 + `CONTENT_OPENED_SOURCES` 화이트리스트 둘 다 갱신해야 한다. 화이트리스트가 누락되면 클릭은 동작하지만 analytics가 `direct`로 잘못 기록된다.

## 056. Phase 2 리포트 1차 — 관심사 회고 화면 (2026-06-25)

**결정**: 리포트 탭을 "저장량 대시보드"가 아니라 "요즘 무엇에 관심 두는지" 회고 화면으로 채운다. 1차는 AI 호출 없이 단순 집계만으로 카테고리/분포/관련 주제를 보여준다. 기간은 최근 7일 우선, 데이터 부족 시 30일로 자동 fallback.

**배경**: CLAUDE.md에 2차로 명시된 Report. codex가 작성한 `docs/report-phase-2-proposal.md` 제안서를 Claude Code가 검토하고 1차/2차 범위를 좁힌 결과 — 데이터가 부족한 출시 직후에는 "관심사 흐름"이나 AI 코멘트가 오히려 신뢰도를 깎을 수 있어, 단순 집계만으로 안전하게 시작.

**결과**:
- `lib/api.ts`에 `getRecentContentsForReport(days)` + `ReportItem` 타입 추가 — 단일 fetch 30일치 가져오기
- `lib/report.ts` 신규 — 순수 함수 모듈:
  - `aggregateByCategory` (분류된 콘텐츠만, count desc)
  - `computeDistribution` (% 합산 100 보장, 마지막 항목 잔여 보정)
  - `topTagsPerCategory` (카테고리당 Top 3, category 이름과 같은 tag는 제외)
  - `countCategorized` / `countUncategorized`
  - `filterWithinDays` (7일/30일 in-memory 분기용)
- `app/(tabs)/report.tsx` 전면 개편:
  - 마운트 시 30일 단일 fetch → 7일/30일 in-memory derive
  - 7일 분류된 ≥ 3 → 7일 기준 + subtitle "최근 7일 기준"
  - 부족 → 30일 fallback + subtitle "최근 한 달 기준" + 작은 배너
  - 30일도 부족 → 부족 상태 안내
  - 미분류 콘텐츠 있으면 별도 안내 (Top 카테고리에는 미포함)

**고려한 대안**:
- (a) **AI 코멘트 1차 포함** — 비용/캐싱/재생성 정책 검토 필요. 1차에선 제외하고 별도 PR로
- (b) **관심사 흐름 (week-over-week)** — 출시 1주차에는 비교 기준 데이터 부족, "늘었다/줄었다"가 오히려 신뢰 깎을 위험. 2차로 분리
- (c) **Supabase RPC/Edge Function 집계** — 단일 사용자 수십~수백 row 집계는 클라이언트가 더 빠르고 단순. 캐싱 도입 시 재고
- (d) **`reports` 테이블 캐싱** — 1차엔 매 진입 시 30일 fetch (ms 단위). AI 코멘트 도입 시 입력 hash 기반 캐싱 도입 예정
- (e) **미분류를 Top 카테고리에 포함** — "미분류"는 카테고리가 아니라 상태. 별도 안내로 분리해 제품 원칙 유지

**기술 결정**:
- KST 고정 (analytics-queries 패턴 일관)
- 단일 fetch + 클라이언트 derive (중복 쿼리 0)
- 외부 전송 데이터 0 (AI 호출 없음)
- 모든 쿼리 `user_id` 스코프, `categories(name)` join

**교훈**: 제품 원칙에서 흔히 미끄러지는 지점은 "있는 모든 데이터를 다 보여주는" 유혹이다. "관심사 회고"라는 화면 정의를 정한 뒤로는 미분류/저장량/AI 자유 코멘트 등 모두 "정의에 맞지 않음" 한 마디로 1차 범위에서 빠질 수 있었다. 화면 정의가 곧 가장 강한 우선순위 필터.

## 057. 리포트 카테고리 집계 중복 제거 (2026-06-26)

**결정**: 리포트 화면에서 "많이 저장한 카테고리" 섹션을 제거하고, "관심 분포"와 "관련 주제" 2단 구조로 단순화한다.

**배경**: "많이 저장한 카테고리"는 카테고리별 저장 개수 랭킹이고, "관심 분포"는 같은 데이터를 퍼센트 bar로 보여준다. 특히 초기 데이터가 적을 때 두 섹션이 거의 같은 정보를 반복해 리포트 화면의 밀도와 명확성을 떨어뜨렸다.

**결과**:
- `app/(tabs)/report.tsx`에서 "많이 저장한 카테고리" 섹션 제거
- `topCategories` 파생 데이터와 `CategoryListCard` 제거
- 리포트 흐름을 `관심 분포 → 관련 주제 → 미분류 안내`로 정리

**대안 검토**:
- (a) **두 섹션 유지 + 설명으로 차이 보강** — 데이터 의미가 여전히 같아 중복 문제를 해결하지 못함.
- (b) **많이 저장한 카테고리 유지, 관심 분포 제거** — progress bar 애니메이션과 "관심사 회고" 화면 정의가 약해짐.

**교훈**: 리포트 화면에서는 같은 데이터를 다른 시각화로 반복하는 것보다, 한 시각화가 다음 섹션의 해석으로 자연스럽게 이어지는 구조가 더 명확하다.

## 058. 리포트 개발 모드 더미 케이스 선택기 검증 후 제거 (2026-06-26)

**결정**: 리포트 화면 검증에 사용한 `__DEV__` 전용 더미 데이터 선택기를 제거하고, 리포트 화면은 실제 사용자 데이터만 사용하게 한다.

**배경**: 출시 초기에는 사용자별 저장 데이터가 적어 리포트의 7일 기준, 30일 fallback, 부족 상태, 미분류 안내, progress bar 애니메이션을 실제 데이터만으로 반복 검증하기 어렵다. Supabase에 테스트 레코드를 직접 넣는 방식은 사용자 데이터 격리와 테스트 후 정리 부담이 있다.

**결과**:
- 리포트 주요 상태 검증 후 `app/(tabs)/report.tsx`에서 개발 모드 더미 선택기 제거
- `ReportDemoCase`, `REPORT_DEMO_CASES`, `makeReportDemoItems`, `demoCase`, `isUsingDemoData`, `ReportDemoSelector` 제거
- 리포트 데이터 흐름을 `getRecentContentsForReport(MAX_WINDOW_DAYS)` 단일 실제 fetch로 단순화

**대안 검토**:
- (a) **Supabase seed 데이터 생성** — 실제 DB에 테스트 데이터가 남고 사용자별 RLS/정리 부담이 큼.
- (b) **별도 mock screen 추가** — MVP 화면 범위와 라우팅 구조를 늘림.
- (c) **고정 더미 데이터만 표시** — 여러 상태 검증이 어려워 선택형 케이스가 더 적합.

**교훈**: 데이터가 적은 초기 제품에서는 UI 검증용 더미 케이스도 제품 안정화 도구다. 단, 검증이 끝나면 실제 데이터 흐름만 남겨 코드 복잡도와 UX 판단 혼선을 줄이는 편이 좋다.

## 059. 리포트 기간 라벨과 섹션 헤더 정렬 개선 (2026-06-26)

**결정**: 리포트의 기간 기준 라벨을 페이지 제목 옆 badge로 배치하고, 섹션 헤더 아이콘을 고정 크기 박스에 넣어 제목/설명 라인을 정렬한다.

**배경**: 기존 "최근 7일 기준/최근 한 달 기준" 라벨은 제목 아래에 작고 옅게 표시되어 가독성이 낮았다. 또한 Ionicons glyph마다 실제 시각 폭이 달라 "관심 분포"와 "관련 주제" 아이콘이 같은 세로 라인에서 벗어나 보였다.

**결과**:
- 7일 기준 라벨을 제목 옆 `surface` badge로 변경
- 30일 fallback 상태는 제목 옆 badge를 숨기고 안내 배너에 "최근 한 달 기준" 설명을 통합
- header 하단 여백과 scroll 시작 여백 조정
- 섹션 아이콘을 16x22 고정 박스로 감싸 시각적 기준선을 통일

**교훈**: outline icon은 같은 size 값을 써도 glyph별 내부 여백이 달라 보일 수 있다. 텍스트 기준선과 맞춰야 하는 헤더에서는 아이콘 자체보다 아이콘 컨테이너를 정렬 기준으로 삼는 편이 안정적이다.

## 060. 리포트 기간 선택 직접 제어 (2026-06-26)

**결정**: 리포트 기간 기준을 자동 fallback 방식에서 사용자 선택 방식으로 변경한다. 화면에는 `최근`을 고정 텍스트로 두고, 사용자는 뒤의 `일주일`, `14일`, `한달` 드롭다운만 변경해 해당 기간 기준의 관심 분포와 관련 주제를 본다.

**배경**: 기존 구조는 7일 데이터가 부족하면 30일로 자동 전환해 빈 화면을 피했다. 하지만 리포트가 "요즘 관심사 회고" 화면이라면 사용자가 직접 기간을 바꿔 비교하는 것이 더 자연스럽고, 제목 badge와 fallback 안내 배너가 겹쳐 보이는 문제도 있었다.

**결과**:
- `app/(tabs)/report.tsx`에 `최근` 고정 텍스트 + 기간 텍스트형 드롭다운 추가
- 기간 옵션은 `일주일`, `14일`, `한달`로 정리
- `deriveReportView(items, selectedWindow)`로 선택 기간 기준 집계
- 네트워크 fetch는 최대 기간인 30일 1회 유지, 선택 기간 필터링은 클라이언트에서 수행
- 자동 fallback 배너와 기간 badge 제거
- 부족 상태 문구를 선택 기간 기준으로 변경
- 개발 모드 더미 케이스의 `30일` 라벨을 `긴 기록`으로 변경해 기간 선택 UI와 혼동을 줄임

**대안 검토**:
- (a) **기존 자동 fallback 유지** — 초기 데이터에는 친절하지만 사용자가 기간을 탐색할 수 없고 기간 정보 UI가 중복됨.
- (b) **기간 선택 + 부족 시 자동 확장** — 사용자가 고른 기준을 앱이 몰래 바꾸는 셈이라 리포트 신뢰도가 낮아짐.
- (c) **3일/7일/14일/30일 segmented control** — 선택지는 명확하지만 `3일`은 리포트 회고 기준으로 너무 짧고, 화면 상단에서 버튼이 차지하는 밀도가 높음.
- (d) **이번 주/지난 2주/이번 달** — 자연어 느낌은 좋지만 `이번`과 `지난`이 섞여 기준 표현의 결이 달라짐.
- (e) **최근 + 1주/2주/1달** — 짧지만 숫자 단위가 다소 도구적으로 보여 최종 표기는 `일주일/14일/한달`로 조정.

**교훈**: 리포트의 기간 기준은 앱이 자동으로 보정하기보다 사용자가 명시적으로 선택하게 하는 편이 화면의 의미와 데이터 신뢰를 더 잘 드러낸다.

## 061. 리포트 관심 분포 Top 카테고리 강조 테스트 원복 (2026-06-26)

**결정**: 관심 분포 리스트의 첫 번째 항목 강조 테스트를 원복하고, 모든 row를 같은 스타일로 유지한다.

**배경**: 리포트 화면이 단조로워 보여 최상위 카테고리를 강조하는 방식을 테스트했다. 별도 요약 row는 중복으로 보였고, 첫 번째 row만 크기와 bar 높이를 키우는 방식은 오류처럼 보여 리스트의 일관성을 해쳤다.

**결과**:
- `app/(tabs)/report.tsx`의 `DistributionCard`에서 첫 번째 row 전용 스타일 제거
- 모든 관심 분포 row의 텍스트 크기, 굵기, progress bar 높이를 동일하게 유지
- Top 강조는 추후 별도 방식이 필요할 때 재검토

**교훈**: 리스트 안에서 한 항목만 크기를 바꾸면 강조보다 시각적 불일치로 인식될 수 있다. 강조가 필요하면 리스트 바깥의 요약, 작은 badge, 또는 별도 섹션처럼 구조적으로 분리된 방법을 다시 검토해야 한다.

## 062. 홈 Forgotten Content 일관성 점검 + 14일 기준 확정 (2026-06-26)

**결정**: Codex handoff(`docs/claude-handoff.md`) 첫 작업 요청에 따라 홈 Forgotten Content의 코드/주석/문서 일관성을 점검한다. `lib/api.ts`의 `getForgottenContents` default(30일)는 그대로 두되, 홈 호출부 주석을 14일 기준으로 통일해 동작/문서 불일치를 해소한다.

**배경**: PR #24에서 정식 출시 직후 데이터 양을 고려해 호출부 인자를 14일로 명시했고(§055), 함수 default는 30일을 유지했다. 그러나 `app/(tabs)/index.tsx`의 섹션 주석은 여전히 "30일 이상 다시 보지 않은 콘텐츠"라 적혀 있어 호출부 실제 동작과 어긋났다.

**결과**:
- `app/(tabs)/index.tsx` Forgotten 섹션 주석을 "14일 이상 ... (lib/api default 30, 호출부 14 명시; §055)"로 갱신
- `lib/api.ts` `getForgottenContents` default 30일은 유지 — §055의 "사용 데이터가 쌓이면 30일로 재조정 검토" 의도 보존
- 다른 우려 사항은 코드 검토로 정상 확인:
  - 쿼리: `requireUserId()` + `.eq('user_id', userId)` (RLS 일관)
  - Rediscover vs Forgotten 명확 구분 (`viewed_at IS NULL` vs `viewed_at < 14일`)
  - analytics `source='forgotten'`: 홈 → router params → Content Detail 화이트리스트까지 정상 전달

**고려한 대안**:
- (a) **default를 14로 변경** — 일관성은 강화되지만 §055에 명시된 "30으로 재조정 검토" 의도가 흐려짐. 기간 정책 변경은 별도 결정으로 다루는 게 깔끔
- (b) **주석 위치를 함수 정의 본문으로 이동** — 호출부 의도가 보이지 않아 다음 작업자가 14가 어디서 왔는지 추적 어려움

**교훈**: handoff 문서가 코드/주석/문서 불일치 같은 누적 부담을 짚어주는 가치가 크다. 다음 세션 인수인계 시 검토 체크리스트를 명시하면 사소한 불일치를 정기적으로 청산할 수 있다.
