# AI Usage Log

## 2026-06-15

- Problem: 중복 링크를 저장할 때 Supabase unique constraint 원문이 Alert에 그대로 노출되어 사용자 안내가 불친절했다.
- AI tool used: Codex
- Prompt summary: 중복 링크 저장 실패 안내가 너무 불친절하다는 피드백과 화면 캡처를 바탕으로 사용자 친화적인 안내로 수정 요청.
- Result: 중복 URL 에러 판별을 `lib/api.ts`의 공통 헬퍼로 분리하고, Save Bottom Sheet Alert와 Share Intent 토스트 모두 `이미 저장된 링크예요` 톤의 한국어 안내를 사용하도록 바꿨다.
- Lesson learned: 데이터베이스 제약조건은 저장 안정성을 위해 필요하지만, 사용자에게는 기술 원문이 아니라 현재 상태와 다음 행동을 알려주는 카피로 번역되어야 한다.

---

- Problem: Library의 `카테고리 추가` 카드가 dashed 사각형이라 다른 폴더 카드들과 형태 언어가 달라 보였다.
- AI tool used: Codex
- Prompt summary: 카테고리 추가 dashed 외곽선을 폴더 모양으로 표현할 수 있는지 요청.
- Result: `components/FolderCard.tsx`에서 AddCategoryCard를 일반 사각형 대신 폴더 카드와 같은 탭+본체 구조로 바꾸고, 탭과 본체 모두 dashed 외곽선을 사용하도록 조정했다.
- Lesson learned: 추가 액션 카드도 주변 반복 카드의 실루엣을 공유하면 화면 전체의 패턴이 더 일관적으로 읽힌다.

---

- Problem: Home의 `다시 볼 콘텐츠` 섹션에서 서브타이틀이 정보량 대비 화면을 바쁘게 만들고, Rediscover 카드의 `음악 카테고리` 표기가 설명문처럼 보여 카테고리 정보의 위계가 약했다.
- AI tool used: Codex
- Prompt summary: 다시 볼 콘텐츠 서브타이틀 제거, red dot 유지 여부 판단, 카드 하단 카테고리 표기 방식 검토 및 반영 요청.
- Result: `다시 볼 콘텐츠`의 서브타이틀을 제거하고 red dot은 6px로 작게 유지했다. Rediscover 카드 하단은 `음악 카테고리` 대신 폴더 아이콘과 카테고리명만 표시하도록 바꿨다.
- Lesson learned: Rediscover 섹션은 Accent Red dot으로 충분히 신호를 줄 수 있고, 카드 내부 카테고리는 텍스트 설명보다 아이콘+짧은 명칭이 더 가볍고 일관적이다.

---

- Problem: 검색창 placeholder가 `음악에서 검색...`, `아카이브 검색...`처럼 기능적이지만 Nook의 브랜드 톤과는 조금 딱딱하게 느껴졌다.
- AI tool used: Codex
- Prompt summary: 검색창 placeholder를 Nook에 어울리는 톤으로 바꾸고 싶다는 요청.
- Result: 공통 SearchBar 기본 문구와 전체 검색 placeholder를 `저장한 콘텐츠 찾기`로 바꾸고, Category Detail은 `이 폴더에서 찾기`로 조정했다. 빈 검색 안내는 `제목, 출처, 태그로 찾아보세요`로 정리하고 위치를 화면 중앙보다 살짝 위로 내렸다.
- Lesson learned: Nook의 검색 카피는 브랜드 감성보다 사용자가 무엇을 찾는지 즉시 알 수 있는 짧은 문구가 더 자연스럽다.

---

- Problem: Category Detail에서 카테고리 이름과 `n개 저장됨` 텍스트가 너무 붙어 보여 헤더 정보 위계가 답답했다.
- AI tool used: Codex
- Prompt summary: 카테고리 상세 화면의 카테고리 이름과 저장 개수 텍스트 사이 간격 조정 요청.
- Result: `app/category/[id].tsx`에서 제목 하단 여백을 2px에서 8px로 늘려 제목과 카운트 사이를 분리했다.
- Lesson learned: 큰 제목과 보조 메타 정보 사이에는 최소한의 breathing room이 있어야 화면 위계가 자연스럽게 읽힌다.

---

- Problem: 하단 탭의 가운데 `+` 버튼이 일반 탭 아이템과 같은 높이에 가까워 보여 주요 저장 액션으로서 강조가 약했다.
- AI tool used: Codex
- Prompt summary: 하단 탭의 라운드 `+` 버튼을 탭바보다 더 위로 나오게 만들어 비슷한 앱들처럼 강조해달라는 요청.
- Result: `app/(tabs)/_layout.tsx`의 FAB 크기를 56px로 키우고, 탭바 위로 18px 띄웠다. 그림자는 과하게 퍼지지 않도록 최종적으로 더 절제된 값으로 조정했다.
- Lesson learned: 저장처럼 핵심 액션은 탭바 안에 묻히기보다 살짝 떠 있는 FAB 형태로 분리하면 시각적 우선순위가 명확해진다.

---

- Problem: Content Detail의 `관련 콘텐츠` 제목과 설명, 카드 목록이 다닥다닥 붙어 보여 섹션 구분감이 부족했다.
- AI tool used: Codex
- Prompt summary: 관련 콘텐츠 영역의 공백을 점검하고, 기본 간격은 균일하게 유지하되 내용 카드와 관련 콘텐츠 사이만 살짝 더 벌어지도록 조정 요청.
- Result: `app/content/[id].tsx`에서 제목-설명 간격, 설명 줄높이, 카드 간격을 정리하고, 내용 카드와 관련 콘텐츠 사이의 여백은 최종적으로 더 분리감 있게 유지했다.
- Lesson learned: 하단 추천 영역은 기본 리듬과 분리감을 함께 봐야 하며, 실제 화면에서 답답하면 카드와 다음 섹션 사이를 더 명확히 벌리는 편이 자연스럽다.

---

- Problem: 최근 저장 콘텐츠의 저장 시점이 `1d ago`처럼 영어로 표시되어 한국어 UI 톤과 맞지 않았다.
- AI tool used: Codex
- Prompt summary: content 저장 시점 표시를 영어에서 한글로 바꾸는 소소한 UI 수정 요청.
- Result: 공통 상대시간 포맷터를 수정해 `방금 전`, `1분 전`, `1시간 전`, `1일 전`, `1주 전`, `1개월 전` 형식으로 표시되게 했다.
- Lesson learned: 여러 화면에서 쓰는 표시 문구는 화면별로 고치기보다 공통 유틸에서 한 번에 맞추는 편이 일관성과 유지보수에 좋다.

---

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

---

- Problem: 링크 저장 시 잘못된 URL을 입력해도 저장이 시도되어 에러가 발생하고, 카테고리 추가 시 동일한 이름을 중복 생성할 수 있었다.
- AI tool used: Claude Code
- Prompt summary: SaveBottomSheet에 URL 유효성 검사, CategoryBottomSheet에 중복 카테고리 방지 추가 요청.
- Result: http/https 프로토콜 검사로 잘못된 URL 차단, 대소문자 무시 중복 검사로 카테고리 중복 방지. errorText 스타일은 Typography 상수로 통합.
- Lesson learned: 사용자 입력 검증은 서버 에러에 의존하기보다 클라이언트에서 선제적으로 처리하는 게 UX가 매끄럽다. 공통 스타일은 상수로 관리해야 화면 간 불일치를 방지할 수 있다.

---

- Problem: 2depth 페이지와 1depth 탭 화면의 타이틀 크기가 동일(32px)하여 화면 위계 구분이 어려웠다.
- AI tool used: Claude Code
- Prompt summary: 2depth는 iOS Settings 스타일(센터 17px), 1depth는 26px로 조정 요청.
- Result: Typography에 pageTitle(26px)과 navTitle(17px) 상수 추가, CLAUDE.md 디자인 시스템에도 반영.
- Lesson learned: 1depth와 2depth의 타이틀 크기 차이가 화면 깊이 인지에 큰 영향을 준다. 디자인 토큰으로 관리해야 페이지가 늘어나도 일관성을 유지할 수 있다.

---

- Problem: '발견된 콘텐츠' 알고리즘이 카테고리별 콘텐츠 수(빈도)만 기준으로 하여 실제 관심도를 반영하지 못하고, 콘텐츠가 무한히 쌓이는 구조였다.
- AI tool used: Claude Code
- Prompt summary: 발견된 콘텐츠에 적합한 알고리즘 논의 → 관심도 × 망각도 방식 채택, 테스트 단계 기간 제한 논의.
- Result: 관심도(viewed/total) × 망각도(경과일/7) 스코어링, 카테고리당 최대 2개, 14일 기간 제한 적용.
- Lesson learned: "재발견"은 사용자가 실제로 관심 있는 영역에서 놓친 콘텐츠를 꺼내주는 것이다. 테스트 단계에서는 짧은 기간 제한으로 알고리즘 동작을 빠르게 확인하고, 출시 후 늘리는 전략이 효과적이다.

---

- Problem: 관련 콘텐츠가 최근 저장 10개에서만 같은 카테고리를 찾아 매칭 정확도가 낮았고, 무관한 콘텐츠가 표시될 수 있었다.
- AI tool used: Claude Code
- Prompt summary: 관련 콘텐츠 알고리즘을 태그/카테고리/도메인 복합 점수 기반으로 개선 요청.
- Result: 전체 콘텐츠 대상 복합 스코어링(카테고리+3, 태그×2, 도메인+1). 최소 2점 이상만 표시하여 무관한 콘텐츠 노출 방지.
- Lesson learned: 도메인만 같은 경우는 관련성이 낮을 수 있으므로 최소 점수 임계값을 두어 품질을 보장하는 게 중요하다.

---

- Problem: 원문 바로가기를 누르면 항상 Safari로만 열려서, 설치된 앱이 있어도 앱으로 이동하지 않았다.
- AI tool used: Claude Code
- Prompt summary: YouTube, Instagram, X, Naver 등 설치된 앱으로 열리게 구현 요청.
- Result: openInAppOrBrowser 유틸 추가(도메인→앱 URL scheme 매핑 + canOpenURL 체크 + Safari fallback). app.json에 LSApplicationQueriesSchemes 등록.
- Lesson learned: iOS에서 앱 URL scheme을 사용하려면 LSApplicationQueriesSchemes에 등록이 필수이며, 네이티브 설정이라 EAS Build 재빌드가 필요하다.
