# AI Usage Log

## 2026-06-15

- Problem: Profile의 계정 삭제 UX를 Claude Code와 추가 논의하기 위한 맥락 문서가 필요했다.
- AI tool used: Codex
- Prompt summary: 기존 앱들은 계정 삭제를 어떤 방식으로 배치하는지 확인한 뒤, Claude Code와 논의할 수 있는 md 파일 작성 요청.
- Result: `docs/profile-account-deletion-ux.md`를 추가해 Apple 가이드, 일반 앱 패턴, Nook 추천 방향, 카피, 구현 체크포인트, open question을 정리했다.
- Lesson learned: 위험 액션은 단순히 숨기는 것보다 사용자가 기대하는 정보 구조 안에 배치해야 자연스럽다. 계정 삭제는 account settings 2depth 안에 두는 방향이 가장 설명 가능하다.

---

- Problem: Profile 화면에서 `계정 삭제`가 `로그아웃`과 같은 1depth 카드에 빨간색으로 노출되어 위험 액션이 과하게 강조되는 문제
- AI tool used: Codex
- Prompt summary: 프로필의 계정 삭제 액션을 한 단계 숨기거나 더 작게 표시하는 UX 대안 검토 및 최소 UI 수정 요청
- Result: 새 주요 화면을 추가하지 않고 기존 `ActionSheet`를 재사용해 `계정 관리` 안에 `계정 삭제`를 배치했다. `로그아웃`은 일반 계정 액션 색상으로 낮춰 Accent Red 노출을 줄였다.
- Lesson learned: App Store 정책상 계정 삭제는 접근 가능해야 하지만, 일반 설정 목록에서 직접 강조할 필요는 없다. 위험 액션은 별도 관리 액션 안에 두고 최종 Alert 확인을 유지하는 편이 안전하다.

---

- Problem: 로그인부터 시작하는 현재 진입 흐름이 초기 사용자에게 장벽으로 느껴질 수 있어, 로그인 전 서비스 탐색을 허용할지 검토가 필요했다.
- AI tool used: Codex
- Prompt summary: Nook에서 `로그인 후 메인 진입`과 `메인 먼저 노출 후 로그인 유도` 중 어떤 흐름이 더 적절한지 논의. 이어서 로그인 화면 하단에 `건너뛰기` 또는 `먼저 둘러보기` 버튼을 두고, 저장 등 개인 데이터 액션 시 로그인 안내를 띄우는 방향이 자연스러운지 검토.
- Result: 로그인 전 완전한 기능 사용이 아니라, 낮은 위계의 `먼저 둘러보기` 버튼으로 MVP 화면을 살펴볼 수 있게 하고 링크 저장, 카테고리 관리, 개인 폴더 액션 등에서 `로그인이 필요해요` 안내를 띄우는 방향을 추천했다. 문구는 `건너뛰기`보다 `먼저 둘러보기`가 더 적절하다고 판단했다.
- Lesson learned: 개인 데이터 기반 앱도 첫 화면에서 바로 로그인을 요구하기보다, 서비스 가치를 먼저 보여주고 데이터 저장이 필요한 순간 로그인 요청을 하면 장벽을 낮출 수 있다. 단, MVP 안정화 단계에서는 새 주요 화면을 늘리기보다 기존 라우팅과 UI를 최소 변경하는 방식이 좋다.

---

- Problem: 앱 화면에 한글/영어 안내 문구가 혼용되어 있어 1차 한국 사용자 배포 기준의 카피라이팅 방향 결정이 필요했다.
- AI tool used: Codex
- Prompt summary: MVP 단계에서 한국어 문구로 통일하고, 나중에 언어 변경 기능을 넣는 방향이 적절한지 검토. 토스식 `~해요` 톤이 Nook에 맞는지도 논의.
- Result: 1차 배포에서는 한국어 중심 문구로 통일하고, 짧고 친근한 `~해요` 톤을 기본 방향으로 삼기로 결정. 언어 전환 기능은 MVP 이후 Phase 2로 미루기로 했다.
- Lesson learned: MVP에서는 다국어 인프라보다 사용자 대상에 맞는 문구 일관성이 우선이다. 단, 반복 문구는 나중에 i18n으로 분리하기 쉽게 관리하는 편이 좋다.

---

- Problem: iOS 배포를 위한 Apple 로그인, 빌드 설정, 브랜드 에셋 적용 필요
- AI tool used: Claude Code + Codex
- Prompt summary: Apple 로그인 구현, EAS Build 설정, 앱 아이콘/스플래시/홈 로고 교체 요청
- Result: signInWithApple 함수 구현 (expo-apple-authentication + nonce 기반 Supabase 연동), onboarding에 Apple 버튼 추가, eas.json 생성, 에셋 교체 완료. 홈 로고 적용은 Codex에서 진행.
- Lesson learned: 네이티브 Apple 로그인은 Supabase signInWithIdToken + nonce로 처리하며, Secret Key는 웹 OAuth에만 필요하다. Apple Developer 승인 대기 중에도 코드/설정을 미리 준비할 수 있다.

---

- Problem: Auth/onboarding 라우팅에서 카테고리 존재 여부를 확인하지 않아, 기존 유저 재로그인 시 온보딩 재진입, race condition, 카테고리 중복 생성, 무한 로딩 등의 이슈 존재
- AI tool used: Claude Code
- Prompt summary: MVP 백로그 검토 후 auth/onboarding 흐름 점검 요청. 4개 이슈 발견 및 수정.
- Result: 라우팅 가드에 카테고리 3단 분기 추가, onboarding에서 직접 navigate 제거, createInitialCategories 중복 방지, getSession 에러 핸들링 추가
- Lesson learned: 라우팅 가드는 session뿐 아니라 유저 상태(카테고리 유무)까지 확인해야 올바른 분기가 가능하다. 직접 navigate와 가드가 공존하면 race condition이 발생할 수 있으므로, 가드에 위임하는 패턴이 안정적이다.

---

- Problem: The project needed a clear, shared implementation priority after scope drift around Report, Forgotten Content, and social login.
- AI tool used: Codex
- Prompt summary: Reorganize the current work into the original MVP scope, separate immediate work from deferred work, capture iOS distribution preparation items, then update the written notes after discovering that Google auth and Supabase integration were already implemented in the repo.
- Result: Updated the repo documentation so it no longer describes auth, Supabase, and onboarding as missing foundations. The backlog now reflects that the remaining work is mostly flow hardening, route gating, and MVP completion.
- Lesson learned: In a multi-agent workflow, documentation should be updated only after verifying the current repository state. Otherwise, backlog notes can quickly become stale and mislead implementation work.

---

- Problem: A follow-up review was needed to verify whether the app was truly "MVP complete except for Apple Developer approval tasks."
- AI tool used: Codex
- Prompt summary: Review the current repository state and validate the claim that only App ID capability setup, real-device Apple login/share-intent tests, and EAS/TestFlight/App Store steps remained.
- Result: The review concluded that the project should not be described that narrowly unless the remaining app-level checks are explicitly confirmed complete. The repository needs to be judged by real flow verification and App Store readiness, not only by the presence of implemented screens or integrations.
- Lesson learned: "Most major features exist" is not the same thing as "only distribution tasks remain." Final-stage claims should be made only after checking route behavior, policy-sensitive account flows, and real submission readiness requirements.
