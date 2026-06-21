# Analytics Queries

베타 측정용 SQL 쿼리. 측정 명세는 `docs/analytics-plan.md` 참고.

## 사용 방법

1. Supabase Dashboard → SQL Editor 진입
2. 아래 쿼리 중 하나를 붙여넣기
3. 파라미터 입력:
   - `:start_date` — 측정 시작일 (KST 자정 기준), 예: `'2026-06-20'`
   - `:end_date`   — 측정 종료일 (KST 자정 기준, exclusive), 예: `'2026-07-04'`
4. 결과는 `docs/analytics-results/<YYYY-WW>.md`에 명세 §9 양식 그대로 기록

## 쿼리 목록

| 파일 | 측정 |
|------|------|
| `h1_first_save.sql` | H1. 24시간 이내 첫 저장 전환율 |
| `h2_repeat_save.sql` | H2. 7일 내 두 번째 저장률 |
| `h3_rediscover.sql` | H3. Rediscover 클릭률 + 보조 노출/열람 비율 |
| `ops_save_success.sql` | 저장 성공률 + 저장 미상 손실률 (§12.3) |
| `ops_duplicate.sql` | 중복 저장 시도율 |
| `ops_revisit.sql` | 자연 재방문율 |
| `ops_entry_source.sql` | 진입 경로 비율 (direct vs share_sheet) |

## 테스트 계정 제외

각 쿼리 상단의 `test_users` CTE는 현재 빈 결과를 반환한다. 베타 시작 전에 실제 테스트 계정 UUID를 채워 넣을 것:

```sql
with test_users as (
  select id from auth.users where id in (
    '00000000-0000-0000-0000-000000000001',  -- 본인 개발 계정
    '00000000-0000-0000-0000-000000000002'   -- QA 계정
  )
)
```

## 결과 기록

`docs/analytics-results/2026-WW.md` 양식 (명세 §9 그대로):

```text
측정 기간:
분석 대상 사용자 수:
온보딩 완료 사용자 수:
24시간 내 첫 저장 사용자 수 / 전환율:
7일 내 두 번째 저장 사용자 수 / 반복 저장률:
Rediscover 노출 사용자 수:
Rediscover 클릭 사용자 수 / 클릭률:
테스트 제외 사용자 수:
주요 사용자 인터뷰 내용:
해석:
표본 및 측정의 한계:
다음 제품 결정:
```
