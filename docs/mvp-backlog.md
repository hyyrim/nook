# Nook MVP Backlog

Last updated: 2026-06-15

## Goal

Focus on the originally defined MVP first.

Do not expand scope yet to include:

- Report
- Forgotten Content
- Interest Insight
- Push notifications
- Social sharing
- Tag filtering
- Kakao login
- AI summary
- Unclassified content management automation

These remain out of scope until the original MVP is working end-to-end.

## Current Status

The project is significantly further along than an early scaffold.

Already implemented and working in the repo:

- Expo Router app structure
- Google login flow (Supabase + expo-auth-session)
- Supabase client and session persistence
- Onboarding entry screen + Choose Interests screen
- Initial category creation (3~6개 선택)
- Share Intent integration (expo-share-intent)
- AI classification (Claude Haiku 비동기 분류)
- Home — real Supabase queries (최근 저장 + Rediscover)
- Library — full CRUD with Supabase (카테고리 추가/수정/삭제, 미분류 가상 폴더)
- Category Detail — real data, 검색, 수정/삭제
- Content Detail — real data, 카테고리 이동, 관련 콘텐츠, 메타데이터 새로고침
- Save Bottom Sheet — URL 직접 입력 + 클립보드 붙여넣기
- Save via Share Intent — 자동 캡처 및 저장
- Metadata fetching (Instagram oEmbed, YouTube 등 플랫폼별 처리)

Priority is:

1. Verify auth/onboarding edge cases
2. Smoke test the full E2E flow
3. Prepare for iOS distribution

## Do Now

### 1. Auth flow hardening

- Verify that auth redirect, session restore, logout, and error states behave correctly
- Test edge cases: expired token, network failure during auth, account deletion
- Decide when Apple login should be added for iOS distribution and App Store policy readiness
  - App Store 정책상 소셜 로그인 제공 시 Apple 로그인 필수
- Keep Kakao login for later

### 2. Onboarding route gating

- Review and fix route gating behavior between:
  - logged out users
  - logged in users without categories
  - logged in users with categories
- Ensure onboarding is not skipped for new users
- Ensure returning users do not get sent back into onboarding unnecessarily

### 3. Onboarding completion checks

- Confirm `app/onboarding.tsx` and `app/choose-interests.tsx` work as intended
- Confirm minimum 3 / maximum 6 category selection rules
- Confirm initial category creation succeeds once
- Prevent duplicate or repeated initialization issues

### 4. Smoke testing

- Test new user flow end-to-end
- Test returning user flow end-to-end
- Test logout and re-entry
- Test save flow from app (Bottom Sheet)
- Test save flow from Share Extension / Development Build
- Test category CRUD (추가/수정/삭제)
- Test content detail (카테고리 이동)

## Already Done

The following items from the original backlog have been verified as implemented:

- ~~Replace remaining mock-only behavior~~ — Home, Library, Category Detail, Content Detail 모두 실제 Supabase 쿼리 사용
- ~~Library real data flow~~ — 카테고리 CRUD, 미분류 가상 폴더, 카운트 및 네비게이션 동작
- ~~Save flow reliability~~ — Bottom Sheet + Share Intent 모두 실제 저장 경로, AI 비동기 분류, 중복 방지 동작
- ~~Share Extension integration~~ — expo-share-intent로 구현 완료

## Defer For Later

- Kakao login
- Report implementation
- Forgotten Content
- Interest Insight
- Push notifications
- Social features
- Advanced AI classification behavior
- Tag editing in Content Detail

## iOS Distribution Preparation

### Apple Developer

- Enroll in Apple Developer Program
- Confirm team/account that will own the app

### App identity

- Confirm final iOS bundle identifier
- Confirm app naming and distribution ownership

### Signing and capabilities

- Prepare App ID and signing setup
- Add Sign in with Apple (App Store 정책 필수)
- Review whether Apple login is required before App Store submission based on the final login mix

### Build pipeline

- Prepare EAS Build for iOS
- Verify credentials flow

## Recommended Build Order

1. Auth flow hardening + Onboarding route gating
2. Onboarding completion verification
3. Smoke testing (full E2E)
4. Apple Developer registration and app identity decisions
5. Apple login integration
6. iOS build preparation

## Notes For Claude Code

- Do not widen scope before original MVP works
- Keep UI direction intact
- Prefer minimal diffs
- Do not re-implement auth or Supabase foundation that already exists
- Prioritize working auth/onboarding/data flow over new feature surfaces
- Treat current Report and Forgotten Content ideas as later-phase work unless explicitly reprioritized
