# Nook 배포 준비 체크리스트

최종 업데이트: 2026-06-22

목표: 2026-06-24(수)까지 TestFlight 제출이 가능한 상태로 만든다.

## 배포 원칙

- 이번 주 목표는 App Store 정식 승인보다 TestFlight 업로드 가능 상태를 먼저 만드는 것이다.
- MVP 범위를 넓히지 않는다. Report, push notification, AI summary, social feature는 배포 전 작업에서 제외한다.
- 저장 UX, Auth/Onboarding, 원문 이동, 분석 이벤트 적재만 release blocker로 본다.
- Apple Developer / App Store Connect 정보가 필요한 단계는 계정 준비가 완료된 뒤 진행한다.

## 수요일까지 작업 순서

| 순서 | 작업 | 완료 기준 | 상태 |
|---|---|---|---|
| 1 | TypeScript / Expo 설정 확인 | `npm exec tsc -- --noEmit` 통과, `npx expo-doctor` 21/21 통과, SDK 56 버전대 확인 | 완료 |
| 2 | Analytics 실기기 검증 | 6개 이벤트가 Supabase에 적재되고 운영 쿼리와 raw event가 맞음 | 코드 보강 완료 / 실기기 실행 대기 |
| 3 | Auth / Onboarding 회귀 테스트 | 신규/기존/로그아웃/카테고리 0개/계정 삭제 후 재가입 흐름 확인 | 대기 |
| 4 | 저장 품질 최종 회귀 | 주요 플랫폼 저장, 중복 저장, invalid URL, AI 분류, Detail, 원문 이동 확인 | 일부 완료 |
| 5 | iOS 배포 정보 확인 | Apple Team, App Store Connect 앱, bundle id, Sign in with Apple capability 확인 | 대기 |
| 6 | Production build dry run | `eas build -p ios --profile production` 실행 가능 상태 확인 | 대기 |
| 7 | TestFlight 제출 | production 빌드 업로드 또는 제출 커맨드 실행 | 대기 |

## Release Blocker 기준

배포 전에 반드시 막아야 하는 문제:

- 앱 실행 불가, 라우터 진입 실패, 흰 화면
- 로그인/세션 복원 실패로 사용자가 앱에 들어가지 못함
- 신규 유저 온보딩 완료 후 카테고리 생성 실패
- Share Sheet 저장이 주요 플랫폼에서 반복적으로 실패
- 중복 저장이 새 row를 만들거나 사용자에게 실패 상태를 명확히 주지 않음
- Content Detail에서 원문 바로가기가 주요 플랫폼 URL을 손상함
- Supabase query에서 `user_id` 스코프가 빠져 다른 사용자 데이터가 노출될 가능성

배포 후 backlog로 미룰 수 있는 문제:

- 특정 플랫폼의 본문 추출 품질 고도화
- 태그 수정, 다중 편집, 정렬 옵션
- Report / Forgotten Content / Interest Insight
- push notification
- AI summary

## 실기기 Smoke Test

### Auth / Onboarding

- 로그아웃 상태에서 앱 실행 → 로그인 화면 또는 온보딩 시작점 확인
- 신규 계정으로 로그인 → 관심사 3개 미만 선택 시 완료 불가
- 관심사 3~6개 선택 → 카테고리 row 생성 → Home 진입
- 앱 종료 후 재실행 → 세션 복원 → 온보딩 재진입 없음
- 로그아웃 후 재로그인 → 기존 카테고리 유지
- 카테고리 0개 계정으로 진입 → 온보딩으로 유도

### Save

- Save Bottom Sheet에 정상 URL 입력 → 즉시 저장 → AI 분류는 비동기
- 같은 URL 재저장 → duplicate 처리
- 잘못된 URL 입력 → invalid_url 처리
- iOS Share Sheet에서 저장 → 앱 진입 → 저장 완료
- Instagram / YouTube / X / Threads / Notion / Naver Blog / Medium / Velog 저장 품질 확인

### Navigation

- Home 최근 저장 → Content Detail
- Recent Saved → Content Detail
- Library → Category Detail → Content Detail
- Search → Content Detail
- Content Detail 관련 콘텐츠 → 다른 Content Detail
- Content Detail 원문 바로가기 → 원본 URL 또는 앱 Universal Link 정상 이동

### Analytics

- `app_opened`
- `save_attempted`
- `save_failed`
- `rediscover_impression`
- `content_opened`
- `onboarding_completed`

## EAS / TestFlight 준비

현재 확인된 설정:

- Expo SDK: 56
- iOS bundle identifier: `com.hyerimhan.nook`
- EAS project id: `f9e3f2df-f0df-4d35-b7a3-15bc1169f33c`
- production build: `autoIncrement: true`
- TypeScript check: `npm exec tsc -- --noEmit` 통과
- Expo Doctor: `npx expo-doctor` 21/21 통과

계정 준비 후 필요한 값:

- Apple ID
- Apple Team ID
- App Store Connect App ID
- Sign in with Apple capability 활성화 여부

권장 커맨드:

```bash
npm exec tsc -- --noEmit
npx expo-doctor
eas build -p ios --profile production
eas submit -p ios --latest
```

`eas.json`의 `submit.production.ios`는 Apple/App Store Connect 정보가 확정된 뒤 채운다.
