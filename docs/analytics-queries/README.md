# Analytics Queries

베타 측정용 SQL 쿼리. 측정 명세는 `docs/analytics-plan.md` 참고.

## 사용 방법

1. Supabase Dashboard → SQL Editor 진입
2. 아래 쿼리 중 하나를 붙여넣기
3. 파라미터 입력:
   - `:start_date` — 측정 시작일 (KST 자정 기준), 예: `'2026-06-20'`
   - `:end_date`   — 측정 종료일 (KST 자정 기준, exclusive), 예: `'2026-07-04'`
4. 결과는 `docs/analytics-results/<YYYY-WW>.md`에 명세 §9 양식 그대로 기록

## 실기기 검증 순서

베타 집계 전에 테스트 계정으로 raw event가 제대로 쌓이는지 먼저 확인한다.

1. Supabase SQL Editor에서 테스트 계정 UUID 확인
   ```sql
   select id, email from auth.users order by created_at desc limit 20;
   ```
2. `local-monitor.sql`의 `user_id`를 테스트 계정 UUID로 바꿔 최신 이벤트 50개를 모니터링한다.
3. 앱을 완전히 종료한 뒤 아이콘으로 실행한다.
   - 기대 이벤트: `app_opened`
   - 기대 속성: `properties.entry_source = 'direct'`
4. iOS Share Sheet에서 Nook으로 URL을 저장한다.
   - 기대 이벤트: `app_opened` with `entry_source='share_sheet'`
   - 기대 이벤트: `save_attempted` with `entry_source='share_sheet'`
   - 성공 기준: `contents` row 생성. 별도 `save_succeeded` 이벤트는 없음
5. 같은 URL을 다시 저장한다.
   - 기대 이벤트: `save_attempted`
   - 기대 이벤트: `save_failed` with `failure_reason='duplicate_url'`
6. 잘못된 URL을 Save Bottom Sheet에서 입력한다.
   - 기대 이벤트: `save_attempted`
   - 기대 이벤트: `save_failed` with `failure_reason='invalid_url'`
7. Content Detail을 각 진입 경로에서 연다.
   - Home 최근 저장: `content_opened.source='recent'`
   - 폴더 상세: `content_opened.source='category'`
   - 검색 결과: `content_opened.source='search'`
   - 관련 콘텐츠: `content_opened.source='related'`
8. Rediscover 카드가 보이는 계정에서 홈을 열고 카드를 탭한다.
   - 기대 이벤트: `rediscover_impression`
   - 기대 이벤트: `content_opened.source='rediscover'`
   - 같은 세션에서 같은 content_id impression은 1회만 기록
9. 신규 계정으로 온보딩을 완료한다.
   - 기대 이벤트: `onboarding_completed`
10. 테스트가 끝나면 `ops_*` 쿼리 중 저장 성공률/중복/진입 경로를 같은 날짜 범위로 실행해 raw event와 집계가 일치하는지 확인한다.

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
