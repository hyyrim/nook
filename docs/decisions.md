# 의사결정 로그

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

## 003. Rediscover 로직 변경 (2026-06-13)

**결정**: 단순 "오래된 미열람 콘텐츠" → 카테고리 빈도 기반 우선순위

**배경**: 사용자가 자주 저장하는 카테고리의 콘텐츠가 더 관심도가 높음

**로직**:
1. 카테고리별 콘텐츠 수 집계
2. viewed_at IS NULL인 콘텐츠 조회
3. 빈도 높은 카테고리 → 미분류 → saved_at 오래된 순 정렬

**트레이드오프**: 쿼리 2회 (카테고리 빈도 + 미열람 목록). MVP 규모에서 성능 문제 없음.

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

**구현**:
- useShareIntent 훅으로 URL + 메타데이터 수신
- 인증 상태 확인 후 saveContent 즉시 호출
- 중복 URL 에러 처리
- savingRef로 중복 저장 방지

**제약**: Expo Go 불가, Development Build 필요

---

## 006. Instagram 메타데이터 추출 전략 (2026-06-13)

**결정**: Instagram URL은 oEmbed API(`api.instagram.com/oembed`)로 캡션과 썸네일을 가져옴

**배경**: Instagram은 로그인 없이 HTML을 fetch하면 og:title이 "[계정] Instagram 사진 및 동영상"으로 고정. og:description에도 캡션이 포함되지 않아 실제 본문 내용을 제목으로 사용할 수 없었음.

**대안 검토**:
- HTML og:description 파싱 → 로그인 없으면 캡션 미제공
- 브라우저 User-Agent 변경 → Instagram이 여전히 제한
- Graph API → access_token 필요, 인프라 복잡도 증가

**결과**: 공개 oEmbed 엔드포인트로 캡션(title) + 썸네일(thumbnail_url) 추출. 100자 초과 시 말줄임 처리. oEmbed 실패 시 기존 HTML 파싱 폴백.

---

## 007. 실시간 데이터 갱신 — 이벤트 시스템 (2026-06-13)

**결정**: 모듈 레벨 이벤트 시스템(`lib/events.ts`)으로 저장 후 Home/Library 즉시 새로고침

**배경**: `useFocusEffect`만으로는 같은 탭에서 Bottom Sheet로 저장 시 데이터가 갱신되지 않음. 탭 전환 없이도 새로고침이 필요.

**대안 검토**:
- React Context로 공유 상태 → Tab Layout과 자식 화면 간 props 전달 어려움
- DeviceEventEmitter → React Native 내장이나 deprecated 방향
- 전역 상태 (Zustand 등) → MVP에서 과도한 의존성

**결과**: 12줄의 경량 이벤트 시스템. `emit('content-saved')` 호출 시 Home/Library가 구독하여 `loadData` 재실행. SaveBottomSheet + Share Intent 양쪽에서 emit.

---

## 008. Instagram 제목 개선 — 다단계 캡션 추출 + AI 제목 생성 (2026-06-13)

**결정**: Instagram 콘텐츠의 제네릭 제목 문제를 3단계 폴백으로 해결

**배경**: oEmbed API만으로는 릴스 등 일부 형식에서 캡션을 못 가져옴. "계정명 · Instagram 사진 및 동영상/릴스" 같은 제네릭 제목이 그대로 노출되어 무슨 콘텐츠인지 알 수 없었음.

**구현 (3단계 폴백)**:
1. **oEmbed 캡션** → 성공 시 제목으로 사용
2. **HTML 파싱 강화** → `og:description`에서 "on Instagram: 캡션" 패턴 추출 + 임베디드 JSON(`"caption":{"text":"..."}`, `"edge_media_to_caption"`)에서 캡션 추출. Unicode 이스케이프(`\uXXXX`) → `JSON.parse`로 디코딩
3. **AI 제목 생성** → description이 있을 때만 AI가 `suggested_title` 반환. description 없으면 추측하지 않음 (계정 프로필 기반 추측 방지)
4. **제네릭 접미사 제거** → 위 모두 실패 시 "· Instagram 사진 및 동영상/릴스" 접미사만 제거하여 계정명 깔끔하게 표시

**제네릭 제목 감지 패턴**: `Instagram 사진 및 동영상`, `Instagram 릴스`, `Instagram Reels`, `on Instagram` 등

**핵심 결정 — AI 제목 생성 제한**:
- description 없이 계정명만으로 제목을 추측하면 내용과 불일치 발생 (예: 인테리어 계정의 월급관리 릴스 → "인테리어 아이디어"로 잘못 생성)
- AI는 실제 콘텐츠 description이 있을 때만 제목 생성, 없으면 null 반환

**변경 파일**: `lib/metadata.ts` (캡션 추출, Unicode 디코딩), `lib/ai.ts` (suggested_title + 제네릭 감지), `lib/api.ts` (description 전달 + 제목 업데이트)

---

## 009. Content Detail 카테고리 변경 기능 (2026-06-13)

**결정**: Content Detail `…` 메뉴에 "카테고리 변경" 추가, MoveCategorySheet로 카테고리 선택

**배경**: CLAUDE.md 핵심 원칙 — "사용자가 미분류 콘텐츠를 Content Detail에서 적절한 카테고리로 이동"

**구현**:
- `…` ActionSheet에 "카테고리 변경" 항목 추가
- MoveCategorySheet: 전체 카테고리 목록 + 미분류 옵션, 현재 카테고리 체크 표시
- SaveBottomSheet와 동일 spring 애니메이션 (ActionSheet 닫힘 후 300ms 딜레이로 전환)
- 변경 후 `getContentById`로 재조회하여 카테고리명 실시간 반영

---

## 010. description 저장 및 Content Detail 내용 섹션 (2026-06-13)

**결정**: `contents` 테이블에 `description` 컬럼 추가, Content Detail에서 "내용" 섹션으로 표시

**배경**: Content Detail에서 제목이 두 번 표시되는 문제. 상단 헤더의 제목은 유지하고, 하단 섹션은 콘텐츠의 og:description을 "내용"으로 표시해야 함.

**구현**:
- DB: `ALTER TABLE contents ADD COLUMN description text`
- `fetchLinkMetadata`에서 description 반환 → `saveContent`에서 DB 저장
- `refreshContentMetadata`에서도 description 보충
- Content Detail: description 있을 때만 "내용" 섹션 표시
