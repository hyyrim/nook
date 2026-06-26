# Claude Handoff — 2026-06-26

## 현재 상태

Report 화면 1차 구현은 PR #27로 `main`에 merge 완료.

- PR: https://github.com/hyyrim/nook/pull/27
- 현재 브랜치: `main`
- 리포트는 실제 데이터만 사용하도록 정리됨
- 개발용 더미 선택기는 검증 후 제거됨
- 마지막 확인: `npx tsc --noEmit` 통과

## Report 1차 완료 내용

- 기간 선택: `최근` 고정 텍스트 + `일주일 / 14일 / 한달` 드롭다운
- 관심 분포: 선택 기간 기준 카테고리 비율 표시
- progress bar 진입 애니메이션
- 관련 주제: 카테고리별 상위 태그 표시
- 미분류 안내: 미분류 콘텐츠가 있으면 정리 CTA 노출
- 데이터 부족 상태: 선택 기간 기준 부족 문구 표시
- Top 카테고리 강조 테스트는 원복

관련 결정 로그:

- `docs/decisions.md` 결정 057: 리포트 카테고리 집계 중복 제거
- 결정 058: 리포트 개발 모드 더미 케이스 선택기 검증 후 제거
- 결정 059: 리포트 기간 라벨과 섹션 헤더 정렬 개선
- 결정 060: 리포트 기간 선택 직접 제어
- 결정 061: 리포트 관심 분포 Top 카테고리 강조 테스트 원복

## 다음 작업 우선순위

### 1. 홈 > 잊고 있던 콘텐츠 노출 테스트

가장 먼저 진행 추천.

현재 구현 상태:

- `app/(tabs)/index.tsx`
  - `getForgottenContents(10, 14)` 호출
  - `forgottenItems` state 유지
  - 데이터가 있으면 `잊고 있던 콘텐츠` 섹션 노출
  - 클릭 시 `/content/[id]`로 이동하며 `source: 'forgotten'` 전달
- `lib/api.ts`
  - `getForgottenContents(limit = 10, days = 30)` 구현
  - `viewed_at IS NOT NULL`
  - `viewed_at < now() - days`
  - `viewed_at ASC` 정렬
- `lib/analytics.ts`
  - `ContentOpenedSource`에 `'forgotten'` 추가됨
- `app/content/[id].tsx`
  - `CONTENT_OPENED_SOURCES` whitelist에 `'forgotten'` 추가됨

확인 필요:

- 홈 주석은 아직 `30일 이상 다시 보지 않은 콘텐츠`라고 되어 있으나 실제 호출은 14일 기준.
- `lib/api.ts` 기본값은 `days = 30`, 홈은 `14`를 명시. 기준을 14일로 확정할지, 기본값도 바꿀지 결정 필요.
- Rediscover와 Forgotten이 사용자가 보기에 명확히 다른지 확인 필요.
- `RediscoverCard` 재사용이 시각적으로 충분한지 확인 필요.
- `rediscover_impression`처럼 Forgotten impression 이벤트가 필요한지는 아직 미정.

추천 테스트 케이스:

- `viewed_at`이 null인 콘텐츠는 Forgotten에 나오지 않아야 함.
- `viewed_at`이 14일보다 최근인 콘텐츠는 나오지 않아야 함.
- `viewed_at`이 14일보다 오래된 콘텐츠는 나와야 함.
- 오래 안 본 순서대로 노출되는지 확인.
- 클릭 시 Content Detail 진입 후 `content_opened` source가 `forgotten`으로 기록되는지 확인.

### 2. 홈 > 다시발견 알고리즘 재검토

Forgotten 테스트 후 진행 추천.

검토 질문:

- Rediscover: 아직 열어보지 않은 콘텐츠
- Forgotten: 봤지만 오래 다시 열지 않은 콘텐츠
- 두 섹션이 동시에 있을 때 우선순위와 표현이 명확한가?
- Rediscover 알고리즘의 현재 `관심도 x 망각도 + 다양성` 기준이 실제 홈 경험에 맞는가?

### 3. 온보딩에서 카테고리 직접 추가

초기 관심사 정확도를 올리는 작업.

주의:

- 최소 3개 / 최대 6개 규칙 유지
- 직접 추가한 카테고리도 user-owned category로 생성
- 중복 이름 방지
- AI가 새 카테고리를 만들면 안 된다는 기존 전략 유지

### 4. 카테고리 폴더 순서 변경

범위가 커질 수 있음.

사전 검토:

- `categories`에 `sort_order` 컬럼 추가 필요 여부
- migration / RLS / 기존 데이터 backfill
- 온보딩 카테고리 생성 시 sort order 부여
- Library 화면 정렬 기준 변경

### 5. 리스트 viewType 설정

편의 기능. 우선순위 낮음.

검토:

- 화면별 저장인지 전역 저장인지
- SecureStore / Supabase profile preference 중 어디에 둘지
- 카드형/리스트형 UI 차이가 디자인 시스템과 맞는지

### 6. 푸시 알림

가장 뒤로 미루는 것을 추천.

이유:

- AGENTS 기준 MVP out of scope
- 알림 권한, 빈도, 피로도, Expo push setup 의사결정 필요
- Forgotten / Rediscover가 실제로 유효한지 먼저 검증해야 함

## 추천 진행 순서

1. Forgotten Content 노출 테스트 및 기준 정리
2. Rediscover / Forgotten 홈 알고리즘 정의 재검토
3. 온보딩 카테고리 직접 추가
4. 카테고리 폴더 순서 변경
5. 리스트 viewType 설정
6. 푸시 알림

## Claude에게 요청하면 좋은 첫 작업

홈의 `잊고 있던 콘텐츠` 기능을 리뷰하고 테스트 가능하게 정리해줘.

특히 아래를 봐줘:

- 14일 기준이 코드/문서/주석에서 일관적인지
- `getForgottenContents` 쿼리가 user_id scope와 RLS 원칙을 잘 따르는지
- 홈에서 Rediscover와 Forgotten의 역할이 겹치지 않는지
- analytics source `forgotten`이 Content Detail까지 정상 전달되는지
- 필요한 최소 수정만 제안하거나 적용해줘
