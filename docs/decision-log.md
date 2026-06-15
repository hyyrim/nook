# Decision Log

## 2026-06-15

### Decision

계정 삭제 기능 구현 (App Store 정책 필수)

### Why

- App Store 정책상 계정 생성을 제공하면 계정 삭제도 제공해야 함
- Codex 리뷰에서 App Store 제출 요건 누락으로 지적됨

### Impact

- Supabase RPC `delete_user_account()` 함수로 contents → categories → auth.users 순서 삭제
- Profile 화면 Account 섹션에 Delete Account 버튼 추가
- 2단계 확인 Alert 후 삭제 + 자동 로그아웃

---

### Decision

iOS 배포 준비: Apple 로그인 구현, EAS Build 설정, 앱 에셋 교체

### Why

- App Store 정책상 소셜 로그인(Google) 제공 시 Apple 로그인 필수
- Apple Developer 승인 대기 중 코드/설정을 미리 준비하여 승인 후 바로 빌드 가능하도록
- 기본 Expo 플레이스홀더 에셋을 Nook 브랜드 에셋으로 교체

### Impact

- lib/auth.ts에 signInWithApple 추가 (expo-apple-authentication + expo-crypto)
- onboarding 화면에 Apple 로그인 버튼 추가 (Apple 상단, Google 하단)
- eas.json 생성 (development/preview/production 프로필)
- 앱 아이콘, 스플래시, 홈 로고 교체

---

### Decision

태그 수정 기능을 MVP에서 제외, 추후 구현으로 이동

### Why

- Smoke testing 결과 태그 수정 외 모든 핵심 플로우(auth, onboarding, 저장, 카테고리 CRUD, 카테고리 이동) 정상 동작 확인
- 태그는 AI가 자동 생성하며, 수정 없이도 MVP 사용에 지장 없음
- MVP 범위를 줄여 iOS 배포 준비에 집중

### Impact

- Content Detail에서 태그는 읽기 전용으로 표시
- 태그 수정 UI는 추후 구현 시 추가

---

### Decision

Auth/onboarding 라우팅 가드를 카테고리 존재 여부 기반으로 3단 분기하도록 변경

### Why

- 기존 라우팅 가드는 session 유무만 확인하여, 기존 유저 재로그인 시 choose-interests를 다시 거치는 문제 발생
- onboarding.tsx에서 직접 navigate하는 것과 _layout.tsx 가드가 race condition 유발
- createInitialCategories에 중복 방지가 없어 온보딩 재진입 시 카테고리 중복 생성 가능
- getSession 실패 시 isLoading이 해제되지 않아 무한 로딩 가능

### Impact

- 라우팅 가드: no session → onboarding, session + 카테고리 없음 → choose-interests, session + 카테고리 있음 → tabs
- onboarding.tsx에서 직접 navigate 제거, 라우팅 가드에 위임
- createInitialCategories에 기존 카테고리 존재 시 skip 로직 추가
- AuthProvider에 getSession 에러 핸들링 추가

---

### Decision

Freeze scope to the originally defined MVP before expanding to Report, Forgotten Content, or other phase-2 ideas.

### Why

- The repo already includes meaningful implementation work for Google auth, Supabase session persistence, onboarding screens, and data access
- However, the original MVP still needs reliable end-to-end behavior, especially around onboarding gating, real data flow, and save flow verification
- Expanding scope now would increase coordination cost between implementation and review

### Impact

- Do not spend time re-adding auth or Supabase foundations that already exist
- Prioritize onboarding route gating, flow verification, and Library/save flow stability
- Keep Report and Forgotten Content out of the active implementation scope for now
- iOS distribution preparation remains important, especially Apple Developer enrollment and bundle identity decisions

---

### Decision

Do not treat the project as "MVP 100% complete with only Apple Developer approval tasks remaining."

### Why

- The repo includes major implementation work already, but that does not automatically mean the app is submission-ready
- A review of the current codebase shows that some remaining work is still app-level, not only Apple account or distribution setup
- App Store readiness must be judged by actual flows and policy requirements, not just by the existence of screens and integrations

### Impact

- Keep verifying whether Sign in with Apple is fully implemented in app code, not only planned in Apple capabilities
- Keep checking onboarding/auth route behavior using real user-state conditions
- Keep App Store readiness items such as account deletion and privacy/help entry points in scope until explicitly confirmed complete
- Do not compress the remaining work into "Apple approval only" until those checks are closed
