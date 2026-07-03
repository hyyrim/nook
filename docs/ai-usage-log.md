# AI Usage Log

> 현재 기간의 AI 도구 사용 내역을 한 줄로 기록합니다. 완료된 기간의 로그는 `docs/archive/`를 참고하세요.
> 상세 의사결정은 `docs/decisions.md`를 참고하세요.

Archived records:
- 2026-06: `docs/archive/ai-usage-log-2026-06.md`

## 2026-07-01

| AI 도구 | 작업 내용 |
|---------|----------|
| Codex | 카테고리 폴더 색상/아이콘 시스템 1차 구현 + 시뮬레이터 피드백 기반 폴더 카드, 바텀시트, 리포트/홈 UI 조정 (→ 결정 070) |
| Codex | 카테고리 순서 수동 편집 — 수동 정렬 화면 + sort_order 데이터 흐름 문서화 (→ 결정 071) |
| Codex | 문서 로그 archive 구조 정리 — 현재 파일은 유지하고 완료 기록만 archive로 이동 (→ 결정 072) |

## 2026-07-03

| AI 도구 | 작업 내용 |
|---------|----------|
| Claude Code | Anthropic API 키 서버 이전 — Supabase Edge Function classify로 AI 분류 호출 마이그레이션 (→ 결정 077) |
| Claude Code | Content Detail 뒤로가기 복귀 시 관련 콘텐츠 깜빡거림 회귀 수정 (→ 결정 078) |
| Codex | 리포트 미분류 카운트를 기간과 무관한 전체 기준으로 표시 (→ 결정 079) |
| Codex | MoveCategorySheet fetch를 등장 애니메이션 이후로 지연해 시트 진입 프레임 안정화 (→ 결정 080) |
| Codex | Radius 시맨틱 스케일 도입 + Colors.pressOverlay 추가 (→ 결정 081) |
| Codex | PrimaryButton 공통 CTA 컴포넌트 추출 + 주요 시트/화면 CTA 마이그레이션 (→ 결정 082) |
| Codex | App Store 출시 전 개인정보처리방침/서비스 이용약관 문구를 실제 앱 데이터 처리 범위에 맞게 정리 (→ 결정 083) |
| Codex | Category Detail 헤더 검색 영역 재배치 + 선택 모드 보조 헤더 미노출 처리 (→ 결정 084) |
| Codex | 카테고리 순서 편집 저장/드래그 안정화 + 카테고리 바텀시트 input 높이 고정 (→ 결정 085) |
| Codex | 프로필 카드 계정 설정 진입 + 로그아웃/계정 삭제 액션 위치 정리 (→ 결정 086) |
| Codex | 카테고리 아이콘을 lucide-react-native 기반 렌더링으로 전환하고 기존 Ionicons 저장값 호환 유지 (→ 결정 087) |
| Claude | lucide-react-native 1.23.0 배포 손상(존재 안 하는 exports 대상 + Metro packageExports 강제) 분석 후 0.577.0 다운그레이드 + 아이콘 세트를 12그룹 41개로 재구성 (→ 결정 088) |
| Claude | 카테고리 컬러 팔레트에서 이름·톤이 어긋난 red / gray와 근접한 slate를 coral / sage로 교체 (→ 결정 089) |
