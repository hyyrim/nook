# Nook 개발 진행 상태

최종 업데이트: 2026-07-04 (40차 — 푸시 알림 온보딩 스텝 + 딥링크 라우팅)

> v1.0.0 MVP 정식 출시 완료. 이후 작업은 Phase 2 범위 (현재 v1.1.1 — 30차 Anthropic 서버 이전 hotfix 반영).
> 완료된 긴 진행 기록은 `docs/archive/`에 보관합니다.

Archived records:
- Phase 1: `docs/archive/progress-phase-1.md`
- Phase 2 part 1: `docs/archive/progress-phase-2-part-1.md` (19~29차)

## 현재 상태

| 항목 | 상태 |
|------|------|
| 현재 Phase | Phase 2 / v1.1.1 (Anthropic API 서버 이전 hotfix 반영) |
| 최근 앱 작업 | 40차 — 푸시 알림 온보딩 권한 요청 스텝 + 딥링크 라우팅 + 설정 화면 폴리싱 |
| 최근 문서 작업 | 40차 — 결정 092 (푸시 알림 온보딩 스텝 + 딥링크 라우팅 + 설정 화면 폴리싱) |
| 현재 기록 파일 | `docs/decisions.md`, `docs/ai-usage-log.md`, `docs/progress.md` |
| Archive 위치 | `docs/archive/` |

## 완료 (30차 — Anthropic API 키 서버 이전)

| 항목 | 상태 |
|------|------|
| 기존 `EXPO_PUBLIC_ANTHROPIC_API_KEY` 제거 + 노출 키 revoke (→ 결정 077) | ✅ |
| `supabase/functions/classify/index.ts` 신규 — JWT 인증, 사용자 카테고리 조회, Anthropic 호출, 결과 파싱 서버 처리 | ✅ |
| `lib/ai.ts` — 클라이언트 직접 Anthropic fetch 제거, Supabase Edge Function invoke로 교체 | ✅ |
| AI 분류 fail-silent 계약 유지 | ✅ |

## 완료 (31차 — Content Detail 관련 콘텐츠 복귀 깜빡임 수정)

| 항목 | 상태 |
|------|------|
| Content Detail 본문/관련 콘텐츠 로드를 id 변경 기준 `useEffect`로 이동 (→ 결정 078) | ✅ |
| `viewed_at` 업데이트와 `content_opened` 분석 이벤트는 focus 진입마다 유지 | ✅ |
| 관련 콘텐츠 카드 → 새 상세 → 뒤로가기 시 이전 관련 콘텐츠 리스트 유지 | ✅ |

## 완료 (32차 — 리포트 미분류 카운트 전체 기준 고정)

| 항목 | 상태 |
|------|------|
| `getUncategorizedCount` 경량 count 쿼리 추가 (→ 결정 079) | ✅ |
| 리포트 미분류 알림 카운트를 기간 필터와 무관한 전체 미분류 기준으로 변경 | ✅ |
| 기록 부족 상태에서는 미분류 알림을 숨기는 기존 정책 유지 | ✅ |

## 완료 (33차 — MoveCategorySheet 등장 프레임 안정화)

| 항목 | 상태 |
|------|------|
| `MoveCategorySheet`의 `getCategories` fetch를 `InteractionManager.runAfterInteractions` 이후로 지연 (→ 결정 080) | ✅ |
| 시트가 빠르게 닫힐 경우 cleanup에서 task cancel | ✅ |
| Category Detail 선택 모드 / Content Detail 카테고리 변경 시트 모두 동일 패턴 적용 | ✅ |

## 완료 (34차 — Radius/pressed 토큰 정리)

| 항목 | 상태 |
|------|------|
| `constants/radius.ts` 신규 — `xs/sm/md/lg/xl/pill` 시맨틱 radius 스케일 추가 (→ 결정 081) | ✅ |
| `Colors.pressOverlay` 추가 | ✅ |
| 버튼/카드/시트 중심 20개 파일의 명확한 hardcoded radius 값을 토큰으로 이관 | ✅ |
| 특수 시각 의도가 있는 edge radius 값은 raw 유지 | ✅ |

## 완료 (35차 — PrimaryButton 공통 CTA 컴포넌트)

| 항목 | 상태 |
|------|------|
| `components/PrimaryButton.tsx` 신규 — variant/size/loading/disabled/fullWidth 지원 (→ 결정 082) | ✅ |
| ErrorState / MoveCategorySheet / SaveBottomSheet / CategoryBottomSheet / TagsSheet / ContentTitleSheet / choose-interests CTA 마이그레이션 | ✅ |
| disabled/busy 접근성 상태를 PrimaryButton 내부에서 자동 반영 | ✅ |
| Apple/Google 로그인 버튼은 auth provider 전용 패턴이라 공통화 범위에서 제외 | ✅ |

## 완료 (36차 — 출시 전 정책 문서 정리)

| 항목 | 상태 |
|------|------|
| `docs/privacy-policy.md` — 최종 업데이트일 2026-07-03 갱신 + 계정/콘텐츠/설정/분석 이벤트/AI 처리/제3자 제공자 범위 정리 (→ 결정 083) | ✅ |
| `docs/terms-of-service.md` — 링크 메타데이터, AI 보조 기능, 제3자 콘텐츠, 계정 삭제 및 면책 범위 보강 | ✅ |
| 계정 삭제 경로를 `Profile → 계정 설정 → 계정 삭제하기`로 문서에 반영 | ✅ |
| 광고 식별자/제3자 광고 SDK 미사용, 개인정보 판매 미사용 문구 명시 | ✅ |

## 완료 (37차 — Category Detail 헤더 검색 영역 재배치)

| 항목 | 상태 |
|------|------|
| `app/category/[id].tsx` — 일반 모드 헤더를 `NavHeader → SearchBar → 저장 개수/뷰 타입 버튼 → 콘텐츠 리스트` 순서로 변경 (→ 결정 084) | ✅ |
| 선택 모드에서는 검색/저장 개수/뷰 타입 영역 미노출, 선택 액션 헤더 아래 바로 리스트 표시 | ✅ |
| 기존 검색 로직, 뷰 타입 저장 로직, 콘텐츠 리스트 렌더링 로직 유지 | ✅ |

## 완료 (38차 — 카테고리 순서 편집 안정화)

| 항목 | 상태 |
|------|------|
| `app/reorder-categories.tsx` — 드롭 spring 설정 조정으로 드래그 후 정렬 반영 지연 체감 완화 (→ 결정 085) | ✅ |
| 드래그 중 저장/취소 잠금, `onDragEnd`에서 실제 순서 반영 후 잠금 해제 | ✅ |
| dirty 계산 length 비교 포함, 인증 로딩 중 empty 상태 선노출 방지 | ✅ |
| row/헤더 버튼 접근성 role/state/label 보강 | ✅ |
| `lib/api.ts` — `reorderCategories`가 Supabase update 결과와 실제 row 업데이트 여부를 확인하고 실패 시 throw | ✅ |
| `components/CategoryBottomSheet.tsx` — 카테고리 추가/수정 input 높이 44로 고정해 입력 중 크기 변동 방지 | ✅ |
| 취소는 기존 UX대로 확인 Alert 없이 즉시 뒤로가기 유지 | ✅ |

## 완료 (39차 — 푸시 알림 클라이언트 토큰/설정)

| 항목 | 상태 |
|------|------|
| `expo-notifications` + `expo-device` 설치, `app.json` plugin 등록 (→ 결정 091) | ✅ |
| `lib/notifications.ts` — 권한 요청 / Expo Push Token 발급 / 서버 upsert / 포그라운드 배너 노출 | ✅ |
| `lib/api.ts` — `upsertDeviceToken`, `getNotificationSettings`, `upsertNotificationSettings` 추가 | ✅ |
| `types/index.ts` — `NotificationSettings`, `NotificationType` 타입 추가 | ✅ |
| `app/notification-settings.tsx` 신규 — 전체 on/off + 종류별 토글 + 발송 시간 안내 + 권한 미허용 배너 | ✅ |
| `app/(tabs)/profile.tsx` — 로그아웃 카드에 "알림 설정" 진입점 추가 | ✅ |
| `app/_layout.tsx` — 세션 활성 시 `syncDeviceToken` 실행 + `notification-settings` Stack.Screen 등록 | ✅ |
| 온보딩 권한 요청 스텝과 딥링크 라우팅은 40차(feat/push-onboarding)로 분리 | ⏸ |

## 완료 (40차 — 푸시 알림 온보딩 스텝 + 딥링크 라우팅)

| 항목 | 상태 |
|------|------|
| `app/notification-permission.tsx` 신규 — Sparkles 카드 + "알림 받기" / "나중에" 액션 (→ 결정 092) | ✅ |
| `app/choose-interests.tsx` — 카테고리 생성 후 `/notification-permission` 스텝으로 replace | ✅ |
| `app/_layout.tsx` — `inAuthFlow`에 notification-permission 포함, Stack.Screen 추가 (`gestureEnabled: false`) | ✅ |
| `useNotificationRouting(active)` — 콜드 스타트 + 실행 중 알림 탭 두 경로 모두 처리 | ✅ |
| 알림 payload 계약 `data.type` ∈ `forgotten` / `rediscover` → 대응 화면으로 라우팅 | ✅ |
| `markNotificationOpened(logId)` — 알림 탭 시 `notification_logs.opened_at` 기록 | ✅ |
| `notification-settings` AppState 리스너로 iOS 설정 변경 후 복귀 시 배너 자동 갱신 | ✅ |
| 토글 하단 "저장 중…" hint 및 `saving` state 제거 | ✅ |

## Phase 2 범위

### A. Phase 1 검토 발견 이슈 (우선순위 후보)

| 항목 | 상태 / 비고 |
|------|------|
| 온보딩 화면에서 카테고리 직접 추가 | ✅ 22차 완료 (결정 069). "+ 직접 추가" 칩 + CategoryBottomSheet 재사용 |
| 카테고리 순서 변경 | ✅ 24차 완료 (결정 071). 수동 정렬만 도입. 편집 전용 2depth 화면 + `react-native-draggable-flatlist` 세로 리스트 드래그. 자동 정렬 옵션(이름순/저장순/최근순)은 백로그 유지 |
| Rediscover 알고리즘 재고민 | ✅ 21차 완료 (결정 067). 정의를 "안 본 콘텐츠"에서 "관심사 기반 + 한동안 안 들여다본 콘텐츠"로 변경 |
| 리스트 viewType 설정 (콘텐츠) | ✅ 26차 Category Detail 1차 완료 (결정 073). Recent Saved / Search 등 다른 리스트 확장은 필요 시 후속 |
| 카테고리 아이콘 세트 교체 검토 | 미완료. 현재 Ionicons `-outline` 28개. 웹 배포까지 통일된 톤을 위해 Lucide(웹 호환) 또는 Feather로 교체 검토. SF Symbols는 iOS 전용이라 배제 |

### B. CLAUDE.md 2차 범위 (1차 완료 + 남은 항목)

| 항목 | 상태 / 비고 |
|------|------|
| Forgotten Content | ✅ 1차 완료 (§055) |
| Report | ✅ 1차 완료 (§056~061). 2차 — 주차별 흐름, AI 코멘트는 별도 |
| Interest Insight | ✅ 홈 카드로 1차 완료 (§068). Report 2차에서 정적 분석 형태 추가 검토 가능 |
| 푸시 알림 | 🟡 **진행 중** (39~40차). 완료: (1) DB 스키마 (2) 클라이언트 토큰/설정 (3) 온보딩 권한 스텝 + 딥링크 라우팅. 남음: (4) Edge Function `send-daily-notifications` + Supabase pg_cron (매일 09:00 KST 발송) |
| 소셜 공유 | 미정 |
| 태그 필터링 | 미정. 현재 tags는 `text[]`로 저장만 됨 (CLAUDE.md 데이터 모델 참조) |
| 카카오 로그인 | 미정 |
| AI 요약 | 미정. AI 단일 호출 원칙(태그+카테고리)과 별도 호출로 분리 필요 |
| 미분류 관리 장치 | 미정. 미분류 방치 방지 UX 검토 |
| 오래된 링크 정리 제안 | 미정. 자동 삭제 대신 "오래 안 본 링크 정리 후보"를 제안하고 사용자가 삭제/유지/보관을 선택하는 방향. `viewed_at`/`saved_at` 기준 후보 산출 필요 |

### C. 기존 백로그

| 항목 | 비고 |
|------|------|
| 카테고리 폴더 컬러칩 | ✅ 23차 1차 완료. `categories.color/icon` 컬럼 + 폴더 카드/이동 시트/수정 시트 반영. 향후 필요 시 정렬/리스트 뷰와 함께 고도화 |
| 다른 플랫폼 본문 복구 | X는 oEmbed fallback, Notion은 public page API로 보강 완료. Naver Blog / Medium / Velog 본문 복구는 필요 시 별도 평가 |
| 링크 수명 관리 | 1차는 수동 삭제 UX 유지/강화. 2차는 `viewed_at`/`saved_at` 기준 정리 후보 섹션, 일괄 선택, 보관 또는 삭제 검토. 완전 자동 삭제는 opt-in + 복구 기간이 있을 때만 Phase 3로 검토 |

### D. 플랫폼 확장 — 웹 + Chrome 확장 (Phase 2~3)

플랫폼 로드맵상 iOS 앱 다음 우선순위. 사용자 핵심 니즈: **모바일에서 저장 + 데스크탑에서 조회**.

**역할 분리 (사용자 페르소나 기반)**

| 플랫폼 | 역할 | 저장 방식 |
|------|------|------|
| iOS 앱 | 저장(주) + 조회 | Share Extension (현재 운영 중) |
| 데스크탑 웹 | 조회(주) + URL 직접 입력 저장 | iOS와 동일한 Save UI 1개 (URL만 입력, AI 분류 맡김) |
| Chrome 확장 | 현재 페이지 1-클릭 저장 | popup의 "이 페이지 저장" 버튼 |

→ 저장 진입은 3가지: **iOS 공유 / 웹 URL 입력 / Chrome 확장 1-클릭**

**접근 방식 권장: RN Web (Expo Web) + Chrome 확장 별 빌드**

- 웹은 RN Web으로 현재 컴포넌트 재사용 (홈/폴더/Report/Search/Content Detail + Save Bottom Sheet)
- 데스크탑 반응형 우선 (≥1024px). 모바일 웹은 보조 (iOS 앱 있으니까)
- Chrome 확장은 manifest v3, 가벼운 popup UI + Edge Function 호출
- 웹 Save Bottom Sheet는 iOS 컴포넌트 그대로 재사용 — 데스크탑은 화면 중앙 모달, 모바일 웹은 바텀시트로만 분기

**아키텍처 영향 — 백엔드 재구조화 (선결 작업)**

웹/확장 착수 전 Supabase Edge Function으로 이전해야 할 것:

1. **메타데이터 추출 Edge Function** — 현재 `lib/metadata.ts`의 fetch + parsing 로직 이전. iOS도 함께 사용 → 보안 ↑, CORS 회피
2. **AI 분류 Edge Function** — 현재 `lib/ai.ts`의 Anthropic 직접 호출을 Edge Function 경유로. API 키 서버 보관 (브라우저 노출 차단)
3. (선택) **AI 분류 트리거 자동화** — 콘텐츠 INSERT 시 Supabase webhook/trigger로 Edge Function 자동 호출 → iOS/Web/확장 모두 단순히 raw insert만 하면 됨

이 작업은 웹 안 가도 iOS 보안 개선으로 가치 있음 (결정 004에서 이미 "프로덕션에서는 Edge Function 권장" 언급).

**검토할 의존성 / 대체 필요 영역 (웹)**

| 영역 | iOS 현 동작 | 웹 대응 |
|------|-----------|-----------|
| Google 로그인 | expo-auth-session | Supabase OAuth 리다이렉트 |
| Apple 로그인 | expo-apple-authentication (네이티브) | Sign in with Apple JS |
| 세션 저장 | expo-secure-store | localStorage / cookie session |
| 메타데이터 fetch | 클라이언트 fetch | Edge Function (선결 작업으로 해결) |
| AI 분류 | 클라이언트 Anthropic 호출 | Edge Function (선결 작업으로 해결) |
| 원문 바로가기 (앱 scheme) | Linking.openURL + LSApplicationQueriesSchemes | `window.open` 새 탭 |
| 바텀시트 키보드 회피 | Reanimated 4 useAnimatedKeyboard | 데스크탑은 모달 패턴 (저장 UI 없으니 사용 빈도 ↓) |
| 푸시 알림 (향후) | expo-notifications | Web Push API |
| 디자인 토큰 / 컴포넌트 | 그대로 | 그대로 사용, 데스크탑 레이아웃만 추가 |

**Chrome 확장 범위**

- manifest v3, popup UI (작은 카드)
- 현재 탭 URL 자동 캡처 → 옵션으로 카테고리/태그 미리 지정 가능
- Supabase Auth 토큰을 chrome.storage에 저장 (확장 첫 진입 시 웹 로그인 페이지로 보내 토큰 받아옴)
- 저장 = Edge Function `/save-content` POST → DB insert → AI 분류 트리거 (자동)
- "저장 완료" Toast 후 popup 자동 닫힘

**단계 분할 (확정 범위)**

| 단계 | 작업 | 예상 |
|------|------|------|
| **A. 백엔드 재구조화** | 메타 추출 + AI 분류 Edge Function 이전. iOS 클라이언트도 Edge Function 호출하도록 마이그레이션. 분류 자동 트리거 검토 | 1~2주 |
| **B. RN Web** | 로그인(OAuth 리다이렉트) + 홈/폴더/Report/Search/Content Detail + Save Bottom Sheet(URL 직접 입력) + 데스크탑 반응형 디자인 | 3~4주 |
| **C. Chrome 확장** | manifest v3, popup, URL 캡처, 인증 토큰 공유, 저장 API 호출, 결과 Toast | 2주 |

**총 예상**: 6~8주 (디자이너/QA 비용 별도)

**핵심 결정 포인트 (착수 전)**

1. 백엔드 재구조화 시점 — 웹 착수 전 선결 (안전) vs 웹과 병렬 (빠름)
2. 모바일 웹 지원 수준 — 데스크탑만 우선? 아니면 반응형으로 모바일 웹도?
3. Chrome 확장 인증 — 웹 로그인 후 토큰 공유 vs 확장 내 독립 로그인
4. 디자인 — 데스크탑 레이아웃 시안을 새로 디자인할지, iOS 화면 그대로 stretch할지

**리스크 / 트레이드오프**

- 백엔드 재구조화는 iOS 회귀 테스트 부담이 있음 (저장 → 메타 → AI 흐름 전체 재검증)
- RN Web의 데스크탑 UX 한계 — 컴포넌트는 동작하지만 "데스크탑답지 않은" 느낌 가능. 데스크탑 전용 디자인 시안이 결과 품질을 좌우
- Chrome 확장 인증 토큰 공유는 보안/UX 균형이 까다로움 — Supabase Auth의 magic link 또는 web 로그인 → 토큰 deep link 패턴 검토 필요

## 기술 메모

- expo CLI 경로: `node node_modules/expo/bin/cli` (npx expo 안 됨)
- npm install 시 `--legacy-peer-deps` 필요
- Share Extension은 Expo Go 불가, Development Build 필요
- .env 변수: EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY, EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID, EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID, EXPO_PUBLIC_ANTHROPIC_API_KEY
- Supabase DB 스키마 이미 적용됨 (재실행 금지)
- Auth: Google + Apple 소셜 로그인 (Supabase signInWithIdToken)
- Apple 로그인: 네이티브 방식 (expo-apple-authentication + nonce), Secret Key 불필요
