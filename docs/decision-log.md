# Decision Log

## 2026-06-15

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
