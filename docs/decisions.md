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
