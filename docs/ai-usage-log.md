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
