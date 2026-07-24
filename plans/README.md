# Animation Plans

| 번호 | 계획 | 심각도 | 상태 |
|---|---|---|---|
| 001 | 리마인더 스와이프 정착 폭 일치 | HIGH | REVERTED |
| 002 | 카테고리 Modal 전환 직렬화 | HIGH | DONE |
| 003 | 리포트 막대 반복 모션 제한 | HIGH | REVERTED |

## 실행 순서

1. `001-fix-reminder-swipe-settle.md` — 현재 실기기에서 확인된 튐 현상
2. `002-sequence-category-modals.md` — 터치 먹통으로 이어질 수 있는 native Modal 경합
3. `003-limit-report-bar-motion.md` — 반복 탭 전환에서 불필요한 장시간 모션

세 계획은 파일 수정 범위가 서로 달라 순서 의존성은 없다. 사용자 체감과 장애 위험을
기준으로 위 순서를 권장한다.
