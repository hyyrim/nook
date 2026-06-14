# AI Usage Log

## 2026-06-15

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
