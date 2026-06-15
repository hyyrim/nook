# Decision Log

## 2026-06-15

### Decision

Profile 화면의 `계정 삭제` 액션을 1depth에서 직접 노출하지 않고, `계정 설정` 2depth 라우트(`app/account-settings.tsx`)로 이동한다.

### Why

- 계정 삭제는 App Store 정책상 제공되어야 하지만, 일반 설정 목록에서 빨간색으로 크게 보이면 앱의 기본 경험보다 위험 액션이 먼저 눈에 띈다
- 액션 시트에 `계정 삭제` 하나만 있으면 UX가 어색하고 숨기려는 느낌
- 2depth 라우트로 계정 정보(이메일, 로그인 방식)와 함께 배치하면 자연스러운 계정 관리 맥락 제공

### Impact

- Profile > 계정 섹션: `로그아웃`(일반 스타일) + `계정 설정`
- 계정 설정 페이지: 이메일, 로그인 방식(Google/Apple), 로그아웃, 하단 낮은 위계 `계정 삭제하기`
- 삭제 확인은 Native Alert 유지 ("계정을 삭제할까요?" / "저장한 콘텐츠와 카테고리가 모두 삭제돼요. 이 작업은 되돌릴 수 없어요.")
- `로그아웃`은 Profile과 계정 설정 양쪽에 배치 (빠른 액션 vs 계정 상세 맥락)

---

### Decision

로그인 전 사용자가 서비스를 먼저 확인할 수 있도록, 로그인 화면 하단에 낮은 위계의 `먼저 둘러보기` 진입 버튼을 추가하는 방향으로 검토한다.

### Why

- 현재 `로그인 → 온보딩 → 메인` 흐름은 데이터 구조상 명확하지만, 사용자가 Nook의 가치를 느끼기 전에 로그인 장벽을 만날 수 있다
- Nook은 개인 아카이브 앱이므로 결국 로그인이 필요하지만, 저장/카테고리/폴더 같은 개인 데이터 액션이 발생하는 순간 로그인 안내를 띄우는 편이 더 자연스럽다
- `건너뛰기`보다 `먼저 둘러보기`가 가입 회피가 아니라 서비스 탐색 선택지로 느껴져 제품 의도와 더 잘 맞는다

### Impact

- 로그인 화면 최하단에 회색 계열 보조 버튼 또는 텍스트 버튼으로 `먼저 둘러보기`를 배치한다
- 둘러보기 상태에서는 Home, 폴더 등 MVP 화면의 구조와 빈 상태 또는 샘플 상태를 확인할 수 있게 한다
- 링크 저장, 카테고리 추가/수정, 콘텐츠 상세의 개인화 액션, Profile 수정처럼 사용자 데이터가 필요한 행동에서는 `로그인이 필요해요` 안내를 띄운다
- 안내 문구는 Nook의 한국어 `~해요` 톤을 따른다
- Phase 1 안정화 범위에서는 새 주요 화면을 만들기보다 기존 로그인/라우팅 구조에 게스트 플래그와 로그인 유도 모달을 최소 변경으로 붙이는 방향을 우선 검토한다

---

### Decision

MVP 안내 문구는 한국 사용자 기준으로 한글화하고, 짧고 친근한 `~해요` 톤을 기본 카피라이팅 방향으로 사용한다.

### Why

- 1차 배포 대상이 한국 사용자이므로 한글/영어 혼용보다 한국어 중심 경험이 자연스럽다
- MVP 단계에서는 언어 전환 기능보다 핵심 플로우 안정화와 문구 일관성이 우선이다
- 토스식 카피처럼 짧고 명확한 `~해요` 문장은 개인 아카이브 앱의 부담 없는 사용 경험에 잘 맞는다

### Impact

- 화면 안내 문구, 빈 상태, CTA, 확인 메시지는 한국어로 우선 정리한다
- 문구는 과하게 친근하거나 설명적이지 않게 짧고 행동 중심으로 작성한다
- 다국어 전환 기능은 Phase 2로 두되, 반복 문구는 추후 분리하기 쉽게 관리한다

---

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
- Prioritize onboarding route gating, flow verification, and 폴더/save flow stability
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

---

### Decision

1depth 탭 타이틀은 26px/700, 2depth 하위 화면 타이틀은 17px/600으로 구분하고 Typography 상수로 관리한다.

### Why

- 기존에 모든 화면 타이틀이 32px/800으로 동일하여 화면 깊이 구분이 안 됨
- iOS 네이티브 앱(설정 등)의 nav bar 패턴을 참고하여 2depth는 센터 정렬 + 작은 폰트로 위계 표현
- 페이지가 늘어날수록 디자인 토큰 없이는 크기가 제각각 될 위험

### Impact

- `constants/typography.ts`에 `pageTitle`(26px), `navTitle`(17px) 추가
- `CLAUDE.md` 디자인 시스템에 Page Title / Nav Title 규격 명시
- 기존 1depth 탭(폴더, 리포트, 프로필) 타이틀 32px → 26px
- 2depth(카테고리 상세, 계정 설정) 타이틀을 nav bar 센터로 이동, 17px

---

### Decision

발견된 콘텐츠 알고리즘을 카테고리 빈도 기반에서 관심도 × 망각도 스코어링으로 변경한다.

### Why

- 카테고리별 콘텐츠 수(빈도)는 저장량을 반영할 뿐 실제 관심도를 나타내지 않음
- "재발견"의 핵심은 사용자가 관심 있는 영역에서 놓친 콘텐츠를 꺼내주는 것
- viewed_at 필드를 활용하면 추가 테이블 없이 조회율 기반 관심도 계산 가능
- 기간 제한 없이 모든 미열람 콘텐츠를 대상으로 하면 데이터가 무한히 쌓임

### Impact

- 관심도 = 카테고리별 viewed_at != null 비율, 망각도 = 저장 경과일 / 7
- score = 관심도 × 망각도, 카테고리당 최대 2개 다양성 제한
- 14일 기간 제한 (테스트 단계, 출시 후 확장 예정)
- 미분류 콘텐츠는 관심도 0으로 자연스럽게 후순위

---

### Decision

관련 콘텐츠 알고리즘을 최근 10개 기반에서 전체 콘텐츠 대상 복합 점수로 변경하고, 최소 점수 임계값을 둔다.

### Why

- 기존: 최근 저장 10개 중 같은 카테고리 우선 → 매칭 범위가 좁고 무관한 콘텐츠 노출 가능
- 태그 정확 매칭은 드물지만, 카테고리/태그/도메인을 복합으로 쓰면 신호가 충분
- 무관한 콘텐츠(예: 요리 글에 음악 추천)는 없는 것보다 나쁨

### Impact

- 전체 콘텐츠 대상: 같은 카테고리 +3, 태그 겹침 ×2, 같은 도메인 +1
- 최소 2점 이상만 표시 (도메인만 같은 경우 제외)
- 0점이면 관련 콘텐츠 섹션 비표시

---

### Decision

원문 바로가기에서 설치된 네이티브 앱(YouTube, Instagram, X, Naver 등)으로 열리도록 앱 URL scheme 연동 추가

### Why

- 기존에는 모든 링크가 Safari로만 열려서, 앱이 설치되어 있어도 인앱 경험을 활용하지 못함
- 사용자가 주로 저장하는 콘텐츠 출처(유튜브, 인스타, 네이버 블로그 등)는 앱에서 여는 게 UX가 훨씬 좋음

### Impact

- `lib/utils.ts`에 `openInAppOrBrowser` 유틸 추가 (canOpenURL 체크 + Safari fallback)
- `app.json`에 `LSApplicationQueriesSchemes` 등록 (youtube, instagram, twitter, naversearchapp 등)
- 네이티브 설정 변경이므로 EAS Build 재빌드 필요
