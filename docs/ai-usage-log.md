# AI Usage Log

> AI 도구 사용 내역을 한 줄로 기록합니다. 상세 의사결정은 `docs/decisions.md`를 참고하세요.

## 2026-06-13

| AI 도구 | 작업 내용 |
|---------|----------|
| Claude Code | Supabase Auth + Google OAuth 아키텍처 설계 (→ 결정 001) |
| Claude Code | 데이터 접근 계층 설계 — lib/api.ts 단일 파일 구조 (→ 결정 002) |
| Claude Code | Rediscover 로직 설계 — 카테고리 빈도 기반 정렬 (→ 결정 003) |
| Claude Code | AI 분류 아키텍처 — 클라이언트 직접 호출 + 비동기 분리 (→ 결정 004) |
| Claude Code | Share Extension 구현 — expo-share-intent v7 (→ 결정 005) |
| Claude Code | Instagram 메타데이터 추출 — oEmbed API (→ 결정 006) |
| Claude Code | 실시간 데이터 갱신 — 경량 이벤트 시스템 (→ 결정 007) |
| Claude Code | Instagram 제목 개선 — 다단계 캡션 추출 + AI 제목 생성 (→ 결정 008) |
| Claude Code | Content Detail 카테고리 변경 기능 (→ 결정 009) |
| Claude Code | description 저장 + Content Detail 내용 섹션 (→ 결정 010) |

## 2026-06-15

| AI 도구 | 작업 내용 |
|---------|----------|
| Codex | 중복 링크 저장 에러 메시지 사용자 친화적으로 개선 |
| Codex | 카테고리 추가 카드 폴더 형태로 디자인 통일 |
| Codex | 다시 볼 콘텐츠 서브타이틀 제거 + 카테고리 표기 간소화 |
| Codex | 검색창 placeholder Nook 톤에 맞게 조정 |
| Codex | Category Detail 헤더 간격 조정 |
| Codex | FAB 버튼 크기/위치 강조 |
| Codex | Content Detail 관련 콘텐츠 영역 간격 정리 |
| Codex | 저장 시점 한글 표시 (방금 전, n분 전 등) |
| Codex | 계정 삭제 UX 리서치 문서 작성 |
| Codex | Profile 계정 삭제 → 계정 관리 ActionSheet로 이동 |
| Codex | 먼저 둘러보기 진입 흐름 검토 (→ 결정 012) |
| Codex | MVP 한글화 + 카피라이팅 톤 결정 (→ 결정 013) |
| Claude Code + Codex | Apple 로그인 + EAS Build + 에셋 교체 (→ 결정 014) |
| Claude Code | Auth 라우팅 가드 3단 분기 수정 (→ 결정 015) |
| Codex | MVP scope freeze + 백로그 현행화 |
| Codex | MVP 완성도 검증 리뷰 |
| Claude Code | URL 유효성 검사 + 카테고리 중복 방지 (→ 결정 016) |
| Claude Code | 1depth/2depth 타이틀 위계 분리 + Typography 상수 (→ 결정 017) |
| Claude Code | 발견된 콘텐츠 알고리즘 — 관심도 × 망각도 (→ 결정 018) |
| Claude Code | 관련 콘텐츠 알고리즘 — 복합 점수 스코어링 (→ 결정 019) |
| Claude Code | 원문 바로가기 네이티브 앱 연동 (→ 결정 020) |

## 2026-06-16

| AI 도구 | 작업 내용 |
|---------|----------|
| Codex | Expo SDK 56 실행 안정화 — 의존성 정렬, 설정 검증, Metro 번들 확인 (→ 결정 021) |
| Codex | iOS 실기기 개발 빌드 준비 — expo-dev-client 설치 + EAS device profile 추가 (→ 결정 022) |
| Codex | Apple Team 등록 오류 해결 — iOS Bundle Identifier 고유 namespace로 변경 (→ 결정 023) |
| Codex | iPhone16Pro 실기기 피드백 기반 safe area, 검색 전환, 2depth nav, 홈 헤더 여백 조정 (→ 결정 024) |
| Claude Code | Instagram 제목 추출 견고화 — generic 패턴 완화 + fallback + 토큰 필터 (→ 결정 025) |
| Claude Code | AI 분류 진행 중 뱃지 + 분류 완료 자동 갱신 (→ 결정 026) |

## 2026-06-17

| AI 도구 | 작업 내용 |
|---------|----------|
| Claude Code | 바텀시트 키보드 회피 — Reanimated 4 `useAnimatedKeyboard` (→ 결정 027) |
| Claude Code | Content Detail 태그 수정 — chip + input 시트 (→ 결정 028) |
| Claude Code | 폴더 상세 다중 편집 — 선택 모드 + Optimistic UI + LayoutAnimation (→ 결정 029) |
| Codex | 다중 콘텐츠 이동/삭제를 단일 Supabase bulk 요청으로 원자화 (→ 결정 030) |
| Codex | 선택 모드 진입 시 숨겨진 검색 조건 초기화 (→ 결정 029) |
| Codex | 카테고리 이동 시트 조회 실패 상태 + 재시도 UX 추가 (→ 결정 031) |
| Codex | 미사용 import·prop·스타일과 Playwright 생성 로그 정리 |
| Claude Code | 카테고리 추가 UX (자동 스크롤 + 인라인 추가) + Category Detail 라벨 명확화 (→ 결정 032) |
| Codex | MVP 사용자 행동 가설·계산식·이벤트 측정 명세 작성 (→ 결정 034) |
| Claude Code | 빈 상태/에러 상태 통일 (EmptyState/ErrorState) + 신규 유저 환영 카드 (→ 결정 033) |
| Codex | 링크 저장·카테고리 추가/수정·제목/태그 수정 바텀시트 하단 여백 통일 (→ 결정 027) |

## 2026-06-18

| AI 도구 | 작업 내용 |
|---------|----------|
| Claude Code | 2depth 헤더 NavHeader 공통 컴포넌트 추출 + 3개 화면 적용 (→ 결정 035) |
| Claude Code | Instagram 릴스: 죽은 oEmbed 호출 제거 + 원문 바로가기 SFSafariViewController 라우팅 (→ 결정 036) |
| Codex | Instagram 릴스 통계/깨진 캡션 fallback 차단 (→ 결정 037) |
| Codex | Instagram 릴스 현재 media 객체 caption 매칭 보강 (→ 결정 038) |

## 2026-06-20

| AI 도구 | 작업 내용 |
|---------|----------|
| Claude Code | 9개 플랫폼 × 4개 UA 응답 desk research 후 Instagram 패턴을 모든 플랫폼으로 일반화 (`isBadMetadataText`, `platformFallbackTitle`, 오염 레코드 자동 정리). 본문 복구는 Phase 2 백로그로 분리 (→ 결정 039) |

## 2026-06-22

| AI 도구 | 작업 내용 |
|---------|----------|
| Claude Code | Threads 본문 추출 검증 — fb/Slackbot UA 분기 폐기 + share intent meta 경로 조사 (→ 결정 040) |
| Claude Code | Threads 본문 추출 구현 — `<title>` 태그 활용 + share intent meta 우선 (→ 결정 041) |
| Codex | X 게시물 `<title>` 래퍼 제거로 fallback 저장 문제 수정 (→ 결정 042) |
| Codex | X 앱 공유 generic meta / iOS fetch 실패 대비 oEmbed fallback 수정 (→ 결정 043) |
| Codex | X 원문 바로가기 Universal Link 방식으로 수정 (→ 결정 044) |
| Codex | Notion 링크 public API 추출 + 썸네일 placeholder + 앱 열기 보강 (→ 결정 045) |
| Codex | 플랫폼 링크 저장 검증 결과와 다음 안정화 우선순위를 `progress.md`에 현행화 |
| Codex | Analytics 실기기 검증 순서를 `analytics-queries/README.md`에 문서화 |
| Codex | 수요일까지 TestFlight 준비를 목표로 release readiness 체크리스트와 backlog를 현행화 (→ 결정 046) |
| Codex | 배포 전 TypeScript 검사와 Expo Doctor 21개 항목 통과 여부 확인 |
