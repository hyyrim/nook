# Nook MVP 측정 명세서

## 1. 목적

Nook이 단순 저장 도구를 넘어 반복 저장과 콘텐츠 재발견에 도움이 되는지 실제 베타 사용자 행동으로 확인한다.

이 문서는 베타 시작 전에 가설, 계산식, 이벤트 정의를 고정하기 위한 명세다. 현재는 측정 설계 단계이며, 이벤트 수집 구현은 별도 작업으로 진행한다.

## 2. 핵심 가설

### H1. 첫 저장

**가설**: 온보딩을 완료한 사용자는 24시간 이내 첫 콘텐츠를 저장한다.

**핵심 지표**: 첫 저장 전환율

```text
온보딩 완료 후 24시간 이내 첫 저장을 완료한 사용자 수
÷ 온보딩 완료 사용자 수 × 100
```

**판단 목적**: 사용자가 Nook의 핵심 행동인 저장까지 도달하는지 확인한다.

### H2. 반복 저장

**가설**: 첫 콘텐츠를 저장한 사용자는 7일 이내 두 번째 콘텐츠를 저장한다.

**핵심 지표**: 7일 내 두 번째 저장률

```text
첫 저장 후 7일 이내 콘텐츠를 1개 이상 추가 저장한 사용자 수
÷ 첫 저장 사용자 수 × 100
```

**판단 목적**: Nook이 일회성 체험이 아니라 반복해서 사용하는 저장 도구가 될 가능성을 확인한다.

### H3. 콘텐츠 재발견

**가설**: 자연스럽게 재방문한 사용자는 Rediscover를 통해 과거 콘텐츠를 다시 연다.

**핵심 지표**: Rediscover 사용자 클릭률

```text
Rediscover에서 콘텐츠를 1회 이상 연 사용자 수
÷ Rediscover를 1회 이상 본 사용자 수 × 100
```

**보조 지표**: Rediscover 노출 대비 콘텐츠 열람 수

```text
Rediscover를 통한 content_opened 이벤트 수
÷ rediscover_impression 이벤트 수 × 100
```

**해석 제한**: 알림 기능이 없는 MVP에서는 Rediscover가 재방문을 만들었다고 해석하지 않는다. 사용자가 이미 재방문한 이후 과거 콘텐츠 열람을 유도했는지만 측정한다.

## 3. 운영 지표

다음 항목은 제품 가설이 아니라 측정 신뢰성과 저장 UX 상태를 확인하기 위한 보조 지표다.

- 저장 성공률: 저장 성공 건수 ÷ 저장 시도 건수
- 저장 미상 손실률: (save_attempted − save_failed − 신규 contents row 수) ÷ save_attempted (§12.3 참조)
- 중복 저장 시도율: 중복 URL 저장 시도 건수 ÷ 전체 저장 시도 건수
- 자연 재방문율: 첫 저장 다음 날부터 7일 이내 다시 앱 또는 Share Extension을 사용한 사용자 ÷ 첫 저장 사용자
- 진입 경로 비율: `direct`와 `share_sheet` 진입 사용자 비율

## 4. 데이터 기준

### 원본 데이터

정확한 결과 데이터는 이벤트보다 Supabase의 실제 레코드를 우선한다.

- 온보딩 완료: 온보딩 완료 시각 또는 완료 이벤트
- 콘텐츠 저장 성공: `contents` 테이블에 생성된 레코드와 `saved_at`
- 첫 번째·두 번째 저장: 사용자별 `saved_at` 오름차순
- 중복 URL: 새 콘텐츠 레코드로 집계하지 않음

### 행동 이벤트

| 이벤트 | 발생 시점 | 필수 속성 |
|---|---|---|
| `onboarding_completed` | 온보딩이 정상 완료된 직후 | `user_id`, `occurred_at` |
| `app_opened` | 앱 세션이 시작될 때 | `user_id`, `entry_source`, `occurred_at` |
| `save_attempted` | URL 저장 요청 직전 | `user_id`, `entry_source`, `occurred_at` |
| `save_failed` | 저장 요청이 실패했을 때 | `user_id`, `failure_reason`, `occurred_at` |
| `rediscover_impression` | Rediscover 영역이 사용자에게 실제 노출될 때 | `user_id`, `content_id`, `occurred_at` |
| `content_opened` | Content Detail 진입이 완료될 때 | `user_id`, `content_id`, `source`, `occurred_at` |

`contents` 테이블이 저장 성공의 원본이므로 별도의 `save_succeeded` 이벤트는 핵심 지표 계산에 사용하지 않는다. 추후 운영 모니터링이 필요하면 보조 이벤트로 추가할 수 있다.

## 5. 이벤트 속성 사전

### `entry_source`

- `direct`: 홈 화면 아이콘 등을 통한 일반 앱 진입
- `share_sheet`: iOS 공유 시트를 통한 진입

### `content_opened.source`

- `rediscover` — Home Rediscover 카드에서 진입
- `recent` — 최근 저장 리스트(Home 최근 저장 카드 또는 Recent Saved 화면)에서 진입
- `category` — Category Detail에서 진입
- `search` — 검색 결과에서 진입
- `related` — Content Detail의 "관련 콘텐츠"에서 진입
- `direct` — 딥링크/외부 공유 등 위 경로에 해당하지 않거나 source가 누락된 경우 폴백 (§12.5 참조)

### `failure_reason`

- `duplicate_url`
- `invalid_url`
- `network_error`
- `server_error`
- `unknown`

## 6. 공통 이벤트 필드

이벤트 저장소를 구현할 때 다음 필드를 공통으로 사용한다.

| 필드 | 설명 |
|---|---|
| `id` | 이벤트 중복 기록 방지를 위한 고유 ID |
| `user_id` | Supabase Auth 사용자 ID |
| `event_name` | 이벤트 이름 |
| `content_id` | 콘텐츠 관련 이벤트일 때만 사용 |
| `properties` | 이벤트별 추가 속성 |
| `occurred_at` | 실제 발생 시각 |
| `app_version` | 앱 버전별 비교 및 오류 분리 |
| `event_version` | 이벤트 정의 변경 추적 |

분석 이벤트에는 URL, 콘텐츠 제목, 설명, 태그 원문, 이메일을 저장하지 않는다.

## 7. 집계 규칙

- 시간은 DB에 UTC로 저장하고 결과 보고 시 KST로 변환한다.
- 개발자와 테스트 계정은 모든 결과에서 제외한다.
- 사용자 단위 지표는 같은 사용자의 반복 행동을 한 번만 집계한다.
- H2는 첫 저장 후 7일의 관찰 기간이 모두 지난 사용자만 분모에 포함한다.
- Rediscover impression은 컴포넌트 렌더링 횟수가 아니라 실제 사용자 노출을 기준으로 한다.
- 이벤트 재전송에 대비해 동일한 이벤트 ID는 한 번만 저장한다.
- 베타 시작 후에는 가설과 계산식을 변경하지 않는다. 변경이 필요하면 새로운 버전으로 기록한다.

## 8. 베타 운영 조건

- 권장 측정 기간: 최소 2주
- 권장 초기 표본: 실제 사용자 20명 이상
- 분석 대상: 측정 기간 안에 온보딩을 완료한 신규 사용자
- 테스트 계정 목록: 베타 시작 전에 별도 관리
- 성공 기준: 첫 베타에서는 임의의 업계 기준을 적용하지 않고 기준선 데이터를 확보한다.

표본이 작을 때는 백분율만 제시하지 않고 반드시 사용자 수를 함께 표시한다.

## 9. 결과 기록 양식

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

## 10. 구현 전 확인사항

- 이벤트별 발생 위치를 코드에서 한 곳으로 확정한다.
- RLS를 활성화하고 이벤트 insert도 `user_id = auth.uid()`로 제한한다.
- 앱 클라이언트에서 다른 사용자의 이벤트 또는 전체 통계를 조회하지 못하게 한다.
- 집계 SQL은 버전 관리해 동일한 결과를 재현할 수 있게 한다.
- 베타 시작 전 테스트 계정으로 전체 흐름을 한 번 검증한다.

## 11. 데이터 확인 방법

MVP 베타 단계에서는 별도 BI 도구 없이 Supabase 직결로 통계를 확인한다. 표본이 20명 수준이라 SQL 직접 실행이 가장 빠르고 정확하다.

### 11.1 집계 쿼리 위치

- `docs/analytics-queries/` 디렉토리에 SQL 파일을 버전 관리한다.
  - `h1_first_save.sql` — H1 첫 저장 전환율
  - `h2_repeat_save.sql` — H2 7일 내 두 번째 저장률
  - `h3_rediscover.sql` — H3 Rediscover 클릭률 + 보조 노출/열람 비율
  - `ops_save_success.sql` — 저장 성공률 + 저장 미상 손실률
  - `ops_duplicate.sql` — 중복 저장 시도율
  - `ops_revisit.sql` — 자연 재방문율
  - `ops_entry_source.sql` — 진입 경로 비율
- 모든 쿼리 상단에 `WHERE NOT is_test_account` 일관 적용.

### 11.2 실행 방식

- Supabase Dashboard → SQL Editor에서 위 쿼리를 직접 실행한다.
- 자주 보는 쿼리는 SQL Snippet으로 즐겨찾기 등록한다.
- 결과는 매주 1회 집계해 `docs/analytics-results/<YYYY-WW>.md`에 §9 결과 양식 그대로 기록한다.

### 11.3 권한 / 안전 장치

- SQL Editor는 서비스 운영자(=본인)만 접근. 앱 클라이언트는 절대 집계 통계를 직접 조회하지 않는다.
- 쿼리 결과에 URL/이메일/콘텐츠 제목이 포함되지 않도록 `properties`만 집계 대상으로 둔다.
- 베타 종료 후 사용자 늘면 Metabase/Retool 연결 검토. 그 전엔 과한 도입이다.

## 12. 구현 결정 사항

§4 행동 이벤트 표는 "무엇을" 측정할지 정의했고, 본 섹션은 "어떻게" 측정할지 구현 단계 결정을 고정한다.

### 12.1 `onboarding_completed` 발화 시점

**결정**: `app/choose-interests.tsx`에서 관심 카테고리 선택 → `categories` 테이블에 row 생성 완료 직후 발화.

**근거**: 로그인만 하고 카테고리 안 만든 사용자는 Nook의 분류 흐름을 시작한 것이 아니다. H1 분모를 "카테고리 생성까지 마친 사용자"로 잡아야 후속 가설(H2 반복 저장, H3 Rediscover)의 측정 흐름과 일관된다.

### 12.2 `app_opened` 발화 위치와 `entry_source` 정의

**결정**:
- 메인 앱(`lib/AuthProvider.tsx` 또는 루트 `_layout.tsx`)에서 발화. Share Extension은 별도 프로세스라 자체 트래커를 두지 않는다.
- iOS Share Sheet → Nook 탭 → 메인 앱이 foreground 진입 + share intent 수신 → 이 시점에 `entry_source='share_sheet'`로 1회 발화.
- 아이콘 탭으로 진입 → `entry_source='direct'`로 발화.
- 세션 정의: 앱이 background로 내려간 뒤 **30초 이상** 경과 후 다시 foreground로 올라오면 새 세션으로 간주한다. 30초 이내 복귀는 같은 세션 — `app_opened` 재발화하지 않는다.

**근거**: Share Extension에서 직접 이벤트 발화는 인증 토큰 공유, 멱등 처리, 누락 디버깅 모두 복잡도가 급증한다. 메인 앱 단일 발화로 두면 진실 소스가 하나다.

### 12.3 저장 미상 손실률 — 새 운영 지표

**결정**: §3 운영 지표에 다음 항목을 추가한다.

```text
저장 미상 손실률
= (save_attempted 건수 − save_failed 건수 − 신규 contents row 수)
÷ save_attempted 건수
```

`save_attempted`만 남고 후속(`save_failed` 또는 contents row) 어느 쪽에도 안 잡힌 갭. 앱 크래시, 네트워크 끊김, 백그라운드 종료 등을 의심한다. 베타 단계에서 이 값이 5% 이상이면 별도 디버깅을 트리거한다.

### 12.4 `rediscover_impression` "실제 노출" 기준

**결정**:
- 트리거: Rediscover 카드가 viewport에 진입한 시점(즉시). 시간 임계값(예: 1초 이상 머묾)은 적용하지 않는다.
- 멱등: **같은 세션 내 같은 사용자의 같은 `content_id`는 1회만 발화한다.** 클라이언트 메모리 Set으로 본 content_id를 추적한다.

**근거**: H3 분모는 "Rediscover를 1회 이상 본 사용자 수"이므로 사용자 단위 1회면 충분하다. 시간 임계값은 측정 결과를 의미 있게 바꾸지 않으면서 구현 복잡도만 늘린다. 세션당 dedup은 H3 분모/분자 계산을 깔끔하게 만든다.

### 12.5 `content_opened.source` 안전 장치

**결정**:
- `lib/analytics.ts`에 `ContentOpenedSource` union type을 정의해 컴파일 타임에 source 누락을 차단한다.
  ```ts
  export type ContentOpenedSource = 'rediscover' | 'recent' | 'category' | 'search' | 'related' | 'direct';
  ```
- §5의 5개 값(rediscover/recent/category/search/related)에 더해 `direct` 폴백을 추가한다. 딥링크/외부 공유 링크 등으로 진입한 케이스를 잡는다. 검색과 관련 콘텐츠 진입은 분석 시 행동 의미가 달라서 `library` 단일 묶음을 `search` / `related`로 분리한다.
- Expo Router 진입부 `router.push({ pathname: '/content/[id]', params: { id, source } })`에서 source를 명시적으로 전달한다. `app/content/[id].tsx` mount 시 `useLocalSearchParams`로 받아 누락이면 `'direct'`로 폴백한다.

**근거**: H3 클릭률 계산은 `source='rediscover'` 식별에 의존한다. source가 누락된 이벤트가 섞이면 H3가 과소 측정된다. 타입 시스템으로 누락을 IDE 단계에서 차단하는 것이 가장 저렴하다.

## 13. 검증용 모니터 쿼리

개발/실기기 테스트 단계에서 본인 user_id의 이벤트가 실제로 들어오는지 확인할 때 쓰는 쿼리. 집계가 아닌 raw stream 모니터링용이므로 §11 집계 쿼리와 별도로 둔다.

**주의**: Supabase Dashboard SQL Editor는 `postgres` 권한으로 실행돼 `auth.uid()`가 NULL을 반환한다. 따라서 본인 user_id를 직접 박아 필터해야 한다.

### 13.1 본인 user_id 확인

```sql
select id, email from auth.users where email = 'YOUR_EMAIL';
```

### 13.2 본인 이벤트 최신순 (시나리오 검증 메인 쿼리)

```sql
select
  occurred_at at time zone 'Asia/Seoul' as kst_time,
  event_name,
  properties,
  content_id,
  app_version
from analytics_events
where user_id = 'YOUR_USER_ID'
order by occurred_at desc
limit 50;
```

### 13.3 세션별 이벤트 묶음 보기

```sql
select
  properties ->> 'session_id' as session_id,
  count(*) as event_count,
  min(occurred_at) at time zone 'Asia/Seoul' as session_start_kst,
  array_agg(event_name order by occurred_at) as events
from analytics_events
where user_id = 'YOUR_USER_ID'
group by properties ->> 'session_id'
order by session_start_kst desc;
```

### 13.4 RLS 검증 (다른 사용자 격리 확인)

```sql
-- RLS는 client에서만 강제됨. SQL Editor에서는 모든 row가 보임 — 정상.
-- 실제 검증은 앱 client에서 supabase.from('analytics_events').select() 호출했을 때
-- 본인 row만 나오는지로 확인한다.
select user_id, count(*)
from analytics_events
group by user_id;
```

### 13.5 본인 UUID 박힌 사본은 gitignore

매번 UUID 복붙하기 귀찮으면 `docs/analytics-queries/local-monitor.sql`에 본인 UUID 박힌 사본을 두고 쓰면 된다. 이 패턴(`docs/analytics-queries/local-*.sql`)은 `.gitignore`로 차단해 개인 UUID가 저장소에 새지 않게 한다.

