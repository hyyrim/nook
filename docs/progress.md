# Nook 개발 진행 상태

최종 업데이트: 2026-07-23 (54차 — v1.2.4 시트 터치 먹통 근본 해결)

> v1.0.0 MVP 정식 출시 완료. 이후 작업은 Phase 2 범위 (현재 v1.2.4 — 시트 여닫이 후 터치 먹통 근본 해결 반영).
> 완료된 긴 진행 기록은 `docs/archive/`에 보관합니다.

Archived records:
- Phase 1: `docs/archive/progress-phase-1.md`
- Phase 2 part 1: `docs/archive/progress-phase-2-part-1.md` (19~29차)

## 현재 상태

| 항목 | 상태 |
|------|------|
| 현재 Phase | Phase 2 / v1.2.4 (시트 터치 먹통 근본 해결 반영) |
| 최근 앱 작업 | 54차 — 시트 여닫이 후 화면 터치 먹통 근본 해결: ActionSheet 핸드오프를 onDismiss 단일 신호로 구동(setTimeout·magic number·죽은 handoffDelay prop 제거) + category/[id].tsx 시트 조건부 mount 통일(content와 동일 패턴, PR #84 누락분) + ReminderSheet dismiss 경로 busy 가드(스케줄/취소 중 unmount race) + OMC 아티팩트 gitignore |
| 최근 문서 작업 | 54차 — 결정 108 (시트 터치 먹통 근본 해결, v1.2.4) |
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

## 완료 (41차 — 푸시 알림 성격 재정의 + 발송 시간 유저 지정)

| 항목 | 상태 |
|------|------|
| 알림 성격을 "미열람 리마인더" 단일 채널로 확정 (Forgotten/Rediscover 분리 폐기, → 결정 093) | ✅ |
| 후보 규칙 확정 — `viewed_at IS NULL AND saved_at BETWEEN 7~14일 전`, 3개 이상, 주 1회 상한 | ✅ |
| 마이그레이션 007 — `send_at_hour`/`send_at_minute` 추가, `quiet_hours_*`/`forgotten_enabled`/`rediscover_enabled` 삭제 | ✅ |
| `components/TimePickerSheet.tsx` 신규 — 48행 30분 단위 FlatList picker | ✅ |
| `app/notification-settings.tsx` — "전체 알림"(마스터) + "알림 종류"(미열람 리마인더 채널) 섹션 분리, 시간 wheel picker 카드 (→ 결정 094) | ✅ |
| `types/index.ts` — `NotificationSettings` 재구성, `NotificationType = 'unread_reminder'` 단일, `unread_reminder_enabled` 필드 추가 | ✅ |
| 마이그레이션 008 — `unread_reminder_enabled` 채널 컬럼 추가 (마스터/채널 분리로 향후 확장 대비) | ✅ |
| Edge Function `send-unread-reminder` + pg_cron `0,30 * * * *`은 42차(feat/push-edge)로 분리 | ⏸ |
| 온보딩 권한 요청 문구 재조정은 별도 스프린트에서 처리 | ⏸ |

## 완료 (42차 — 미열람 리마인더 Edge Function + pg_cron)

| 항목 | 상태 |
|------|------|
| `supabase/functions/send-unread-reminder/index.ts` 신규 — service role 인증, KST slot 매칭 유저 조회, 후보 계산, Expo Push 배치 전송, notification_logs insert (→ 결정 095) | ✅ |
| CRON_SECRET 기반 Authorization 검증 (pg_cron이 헤더에 담아 호출) | ✅ |
| 후보 파이프라인 5단계 — 최근 7일 발송 이력 → 후보 3개 이상 → 토큰 조회 → log_id 사전 발급 → Expo 배치 | ✅ |
| `lib/notifications.ts` — payload `data.type` `'unread_reminder'`로 축소, 라우팅 대상은 `/(tabs)` 임시 landing | ✅ |
| pg_cron 스케줄 `0,30 * * * *` SQL은 Supabase Dashboard에서 실행 예정 | ⏸ |
| 실기기 종단 검증(실제 알림 도착 + 딥링크 홈 이동)은 배포 후 별도 진행 | ⏸ |
| Expo receipt 조회 정리 함수는 43차 이후 별도 진행 | ⏸ |
| 딥링크 전용 화면 `/unread-reminder?log_id=...`도 43차 이후 별도 진행 | ⏸ |

## 완료 (43차 — 클립보드 감지 저장 프롬프트)

| 항목 | 상태 |
|------|------|
| `components/ClipboardSavePrompt.tsx` 신규 — 컴팩트 BottomSheet + 도메인/URL 카드 + "지금은 아니에요"/"저장" 이원 액션 (→ 결정 096) | ✅ |
| `lib/useClipboardSavePrompt.ts` 신규 — `Clipboard.hasUrlAsync` 필터로 iOS 배너 최소화, 400ms 디바운스, 세션 스코프 dismissed set | ✅ |
| `app/_layout.tsx` — 세션 활성 + Share Intent 미처리 + 온보딩 아님 조건일 때만 훅 활성, `<ClipboardSavePrompt>` 오버레이 렌더 | ✅ |
| `inAuthFlow` 컴퓨테이션을 컴포넌트 레벨로 hoist해 라우팅 가드와 클립보드 훅에서 공유 | ✅ |
| 신규 유저 첫 저장까지의 마찰을 최소화하는 activation 기능 | ✅ |

## 완료 (44차 — 콘텐츠 리마인더)

| 항목 | 상태 |
|------|------|
| `lib/reminders.ts` 신규 — 로컬 알림 CRUD (schedule/cancel), OS pending 큐가 진실의 원천, 프로필 발송 시간 재사용 (→ 결정 097) | ✅ |
| 프리셋 3개 확정 — 1시간 뒤 / 내일 / 주말. 각 라벨에 실제 요일·시간 동적 노출로 결정 피로 최소화 | ✅ |
| 주말 정책 — 월~금: 이번 주 토 / 토 유저시간 전: 오늘 / 토 유저시간 후: 일 / 일 유저시간 전: 오늘 / 일 유저시간 후: 다음 주 토 | ✅ |
| `lib/useContentReminder.ts` 신규 — 콘텐츠 id 기반 훅 (reminder/loading/busy/schedule/cancel) | ✅ |
| `components/ReminderSheet.tsx` 신규 — ActionSheet 톤, 예약 상태 + 프리셋 + 취소 옵션 | ✅ |
| `app/content/[id].tsx` — 우상단 nav에 bell 아이콘 (outline↔filled+accent), 시트 연결, 토스트 피드백 | ✅ |
| `lib/notifications.ts` — payload 타입에 `'reminder'` 추가, `content_id` 있으면 `/content/[id]`로 딥링크 | ✅ |
| 서버 백업 + 미열람 후보에서 예약된 콘텐츠 제외 로직은 후속 스프린트로 분리 | ⏸ |
| 커스텀 시간 선택 (date+time picker)도 후속 스프린트로 분리 | ⏸ |
| 다중 기기 sync는 서버 백업 도입 후 자동 커버 (별도 스프린트) | ⏸ |

## 완료 (45차 — 예정된 리마인더 목록)

| 항목 | 상태 |
|------|------|
| `lib/reminders.ts` — `getAllReminders()` 추가 (OS pending 큐 전체 스캔 후 시간 오름차순) (→ 결정 098) | ✅ |
| `lib/api.ts` — `getContentsByIds(ids)` 추가 (배치 조회로 콘텐츠 정보 매핑) | ✅ |
| `app/reminders.tsx` 신규 — 썸네일/제목/도메인/예정 시간 카드 리스트 + 우측 X 버튼으로 취소 (Alert 확인) | ✅ |
| `app/(tabs)/profile.tsx` — "예정된 리마인더" 진입점 + 개수 배지 (accent 색상), `useFocusEffect`로 자동 갱신 | ✅ |
| `app/_layout.tsx` — `reminders` Stack.Screen 등록 (`slide_from_right`) | ✅ |
| 빈 상태 안내 — "콘텐츠 상세에서 🔔 눌러 예약할 수 있어요" | ✅ |
| 지난 알림 이력은 서버 백업 도입 후 함께 처리 | ⏸ |
| 리마인더 시간이 프로필 발송 시간과 연동된다는 안내 UX (별도 스프린트) | ⏸ |
| 커스텀 프리셋 도입 시 시간도 사용자가 개별 선택 가능하도록 (별도 스프린트) | ⏸ |

## 완료 (46차 — 미열람 리마인더 딥링크 전용 화면)

| 항목 | 상태 |
|------|------|
| `types/index.ts` — `NotificationLog` 타입 추가 (`notification_logs` 스키마와 1:1) (→ 결정 099) | ✅ |
| `lib/api.ts` — `getNotificationLog(logId)` 추가 (RLS로 본인 로그만 접근, 없으면 null) | ✅ |
| `app/unread-reminder.tsx` 신규 — `log_id` 조회 → `content_ids` 배치 fetch → 원본 순서 유지 렌더, empty/error 상태 처리 | ✅ |
| `lib/notifications.ts` — `resolveRoute` 업데이트 (`unread_reminder` + `log_id` → `/unread-reminder?log_id=...`, 없으면 홈 fallback) | ✅ |
| `lib/analytics.ts` / `app/content/[id].tsx` — `ContentOpenedSource`에 `'unread_reminder'` 추가 | ✅ |
| `app/_layout.tsx` — `unread-reminder` Stack.Screen 등록 (`slide_from_right`) | ✅ |
| `opened_at` 기록은 알림 탭 핸들러와 화면 진입 양쪽에서 idempotent 호출 | ✅ |
| pg_cron `0,30 * * * *` SQL 실행 (Supabase Dashboard) | ✅ |
| 실기기 종단 검증 (실제 알림 도착 → 딥링크 화면 랜딩 → 상세 이동) | ✅ 48차에서 완료 |
| Expo receipt 조회 정리 함수 | ✅ 51차에서 완료 |
| 온보딩 권한 요청 문구 재조정 | ✅ 미열람 리마인더 성격(주 1회, 사용자 지정 시간)에 맞춰 문구 조정 |

## 완료 (47차 — Search 화면 최근 검색어 + 자주 쓰는 태그)

| 항목 | 상태 |
|------|------|
| `lib/searchHistory.ts` 신규 — SecureStore 기반 최근 검색어 CRUD (최대 10개, 대소문자 무시 dedup) (→ 결정 100) | ✅ |
| `app/search.tsx` — 빈 검색어 상태에 "최근 검색" + "자주 쓰는 태그" 두 섹션 chip row 노출 | ✅ |
| 최근 검색: 개별 X 삭제 + "모두 지우기". `onSubmitEditing`(엔터) 시 저장 | ✅ |
| 자주 쓰는 태그: 최근 200개 콘텐츠에서 tags 빈도 상위 10개. 대소문자 무시 카운트, 표시는 원본 유지 | ✅ |
| chip 탭 → `setQuery(term)` + `inputRef.blur()`로 검색 결과 즉시 노출 | ✅ |
| 태그 chip 탭은 최근 검색어에 저장하지 않음 (이미 자주 쓰는 태그 섹션에 노출됨, 중복 방지) | ✅ |
| 삭제된 콘텐츠 처리, 빈 상태 fallback(hintText) 유지 | ✅ |

## 완료 (48차 — 미열람 리마인더 실기기 종단 검증)

| 항목 | 상태 |
|------|------|
| Apple Developer Portal `com.hyerimhan.nook` App ID에 Push Notifications capability 활성화 (→ 결정 101) | ✅ |
| EAS `development-device` 프로파일의 Nook / ShareExtension 프로비저닝 프로필 재생성 (aps-environment 포함) | ✅ |
| Expo APNs Push Key(.p8) 등록 (Expo Push Service ↔ APNs 브릿지) | ✅ |
| 시드 SQL로 현재 KST 슬롯 발송 조건 준비 (미열람 후보 3개, 쿨다운 초기화) | ✅ |
| Edge Function `send-unread-reminder` 수동 curl 호출 → `sent: 1`, `expoErrors: 0` | ✅ |
| 실기기 알림 도착 + 탭 → `/unread-reminder?log_id=...` 자동 랜딩 | ✅ |
| 시드 콘텐츠 리스트 렌더 + 카드 탭 → `/content/[id]` 상세 이동 | ✅ |
| `notification_logs.opened_at` 정상 기록 | ✅ |
| Expo receipt 응답 message 로깅/노출 개선 (원인 진단 가속) | ✅ 51차에서 receipt_error / device_not_registered / delivered 상태로 세분화 저장 |
| Expo receipt 조회 정리 함수 (장기 실패 토큰 폐기) | ✅ 51차에서 완료 (즉시 응답 dead token 회수 + 지연 receipt 상태 업데이트) |

## 완료 (49차 — 썸네일 Storage 백업 + expo-image 전면 도입)

| 항목 | 상태 |
|------|------|
| `supabase/migrations/010_thumbnail_storage.sql` 신규 — `thumbnails` public 버킷 + 유저 폴더 제한 RLS 정책 (→ 결정 102) | ✅ |
| Supabase Storage 버킷 생성 (Dashboard SQL Editor에서 실행) | ✅ |
| `supabase/functions/backup-thumbnail/index.ts` 신규 — JWT 인증, imagescript로 300×400 리사이즈 + JPEG 70% 압축, Storage 업로드 `cacheControl: '31536000, immutable'` | ✅ |
| Edge Function 배포 완료 | ✅ |
| `lib/api.ts` — `backupThumbnailAsync(contentId, sourceUrl)` 헬퍼 + saveContent/refreshContentMetadata에 병렬 호출 연결 (fail-silent) | ✅ |
| `lib/api.ts` — `isStorageThumbnailUrl` + `migrateExpiredThumbnails` (일회성 재스크레이핑 헬퍼, 300ms rate limit) | ✅ |
| `expo-image` 도입 + 모든 콘텐츠 썸네일 렌더 컴포넌트 교체: `ContentCard`/`GridContentCard`/`RediscoverCard`/Content Detail hero + related/`reminders.tsx` (총 6개 사용처, `cachePolicy="memory-disk"` + `transition={150}` 통일) | ✅ |
| EAS dev-device 빌드 재생성 (expo-image 네이티브 모듈 포함) | ✅ |
| 실기기 신규 저장 → thumbnail_url이 Storage public URL로 저장됨 확인 | ✅ |
| 기존 만료 콘텐츠 마이그레이션 실행 | ⏭ 스킵 (기존 사용자 소수 · 백로그 정책상 스크립트만 유지) |

## 완료 (50차 — 코드 리뷰·보안 감사 + 우선순위 수정)

| 항목 | 상태 |
|------|------|
| code-reviewer + security-reviewer 병렬 감사 (48/49차 변경 정확성 + 전체 코드베이스 보안, → 결정 103) | ✅ |
| **H1 SSRF 방어** — `backup-thumbnail`에 `isAllowedUrl()` (사설 IPv4/IPv6, 클라우드 메타데이터, `.internal`/`.local` 차단) | ✅ |
| **H2 Timing-safe 비교** — `send-unread-reminder`의 CRON_SECRET 검증을 `timingSafeEqual()` 상수 시간 비교로 교체 | ✅ |
| **H3 Migrate race 방어** — `migrateExpiredThumbnails`가 backup 완료 후 DB 재조회로 실제 Storage URL 반영 여부 확인 | ✅ |
| **M4 스트리밍 read** — `backup-thumbnail`이 chunk 단위로 누적 바이트 카운트, `MAX_SOURCE_BYTES` 초과 즉시 cancel로 메모리 소진 방어 | ✅ |
| **M5 user_id 필터** — `backupThumbnailAsync` UPDATE에 `.eq('user_id', ...)` defense-in-depth 추가 | ✅ |
| **M6 페이지네이션** — `migrateExpiredThumbnails`가 1000행씩 `range()` 루프로 스캔 | ✅ |
| **M7 CORS wildcard 제거** — `classify` Edge Function에서 `Access-Control-Allow-Origin: '*'` 제거 (모바일 전용) | ✅ |
| **M8 계정 삭제 완전화** — `011_delete_user_account_full_cleanup.sql` 신규. `device_tokens`/`notification_settings`/`notification_logs`/`analytics_events`/Storage 오브젝트까지 명시 삭제 | ✅ |
| **M9 UPDATE 컬럼 제한** — `012_notification_logs_update_restrict.sql` 신규. `opened_at` 외 컬럼 변경을 트리거로 되돌림 | ✅ |
| **L3 딥링크 UUID 검증** — `lib/notifications.ts`의 `resolveRoute`가 `content_id`/`log_id` UUID 형식 확인 | ✅ |
| **L5 partial receipt** — `send-unread-reminder`가 다기기 부분 실패 시 `expo_receipt_status='partial'` 저장 | ✅ |
| L1 옛 Anthropic API 키 revoke 상태 확인 (Anthropic 대시보드 수동 확인) | ⏸ 운영 확인 |
| L2 classify 프롬프트 인젝션 방어 (본인 데이터만 오염이라 우선순위 낮음) | ⏸ |
| L4 SecureStore→AsyncStorage 이관 (검색어 비민감) | ⏸ |
| M15 send-unread-reminder N+1 (스케일 시 재검토) | ⏸ |

## 완료 (51차 — Expo Push Receipt 정리 함수 + dead token 회수)

| 항목 | 상태 |
|------|------|
| `013_notification_logs_receipt_checked.sql` 신규 — `receipt_checked_at` 컬럼 + receipt-미확인 partial index + 012 트리거에 `auth.uid() is null` skip 조건 추가(service role 우회) (→ 결정 104) | ✅ |
| `send-unread-reminder` 개선 — ticket 즉시 응답에서 `details.error === 'DeviceNotRegistered'` 감지 시 해당 `device_tokens` 행 즉시 삭제, `stats.deadTokensRemoved` 노출 | ✅ |
| `supabase/functions/cleanup-push-receipts/index.ts` 신규 — CRON_SECRET 인증, 23h 룩백 미확인 로그 조회, Expo `getReceipts` 1000개 배치, 상태별(`delivered`/`device_not_registered`/`receipt_error`) 그룹 UPDATE + `receipt_checked_at` 세팅, pending은 재시도 대기 | ✅ |
| `014_pg_cron_cleanup_push_receipts.sql` 신규 — `30 20 * * *` UTC(=KST 05:30) 하루 1회 스케줄. Supabase Dashboard SQL Editor에서 수동 실행 필요 | ⏸ Dashboard 실행 필요 |
| Edge Function `cleanup-push-receipts` 배포 (`supabase functions deploy cleanup-push-receipts --no-verify-jwt`) | ✅ CLI 배포 완료 |
| `013` 마이그레이션 Dashboard 실행 (`alter table` + 트리거 재정의) | ✅ CLI `db push`로 반영 |
| 다기기 receipt-단계 dead token 자동 회수 (ticket→token 매핑 필요, `push_delivery_attempts` 테이블 도입 후) | ⏸ 백로그 |

## 완료 (52차 — 코덱스 P1/P2/P3 hotfix)

| 항목 | 상태 |
|------|------|
| **P1 SSRF redirect 우회** — `backup-thumbnail`의 `fetchImageBytes`를 `redirect: 'manual'` + 매 hop `isAllowedUrl` 재검증 + MAX_REDIRECTS 5로 재작성 (→ 결정 105) | ✅ |
| **P1 backup-thumbnail 소유권** — body에서 `sourceUrl` 제거, `contentId`만 받아 userClient(RLS)로 `contents.thumbnail_url` 재조회. 다른 유저 콘텐츠는 RLS + `.eq(user_id)` defense-in-depth로 자동 차단. `lib/api.ts`의 `backupThumbnailAsync`도 body payload에서 sourceUrl 제거 | ✅ |
| **P2 Storage 정책 정리** — `015_thumbnail_storage_policy_tighten.sql` 신규. 010의 authenticated insert/update/delete 정책 drop, select는 own-folder 조건으로 좁힘 | ✅ |
| **P2 category cross-user 방어** — `016_contents_category_ownership.sql` 신규. BEFORE INSERT/UPDATE trigger로 `categories.user_id = contents.user_id` 강제, 없는 category_id는 null로 정정 | ✅ |
| **P2 SECURITY DEFINER search_path 고정** — `017_delete_user_account_search_path.sql` 신규. `set search_path = public, storage, auth, pg_temp` + 모든 테이블 schema-qualified | ✅ |
| **P3 tsconfig exclude** — `supabase/functions/**` 제외. `npx tsc --noEmit` 오류 0 확인 | ✅ |
| 015/016/017/018 Dashboard SQL Editor 수동 실행 | ✅ CLI `db push --include-all` 순서로 반영 (011~013·015~018 일괄, 014만 별도) |
| `supabase functions deploy backup-thumbnail` 재배포 | ✅ CLI 배포 완료 (v2) |
| DNS 리바인딩 완전 방어 (Deno.resolveDns → private IP 검사) | ⏸ 백로그 (redirect 재검증으로 대다수 표면 커버, 코덱스 재리뷰도 "accepted residual risk"로 확인) |

### 재리뷰 후속 (52차 재리뷰 반영)

| 항목 | 상태 |
|------|------|
| **재리뷰 P3 semantic 정석 fix** — `018_contents_category_composite_fk.sql` 신규. `categories(user_id, id) UNIQUE` + `contents(user_id, category_id) → categories(user_id, id)` composite FK + `ON DELETE SET NULL (category_id)`. 016 trigger 제거 — 관계 무결성이 DB 레벨에서 강제됨. 실유저 없는 시점이라 정석 승격 채택 (→ 결정 106) | ✅ |
| **재재리뷰 배포 안정성** — 018에 pre-clean UPDATE 추가 (cross-user/orphan category_id를 FK 추가 전에 null로 정리) + `do $$ if not exists ... $$` 블록으로 constraint 추가를 idempotent 처리 (Dashboard 수동 재시도 여지 확보) | ✅ |
| **Supabase CLI 도입 + 배포** — `~/.local/bin/supabase` 바이너리 설치(brew CLT 이슈 우회), `supabase init` + `link --project-ref zylisctltefsipwryzvj`, `migration repair --status applied 001~010`, `db push`로 011~013·015~018 일괄 반영. Edge Function 3개(backup-thumbnail v2, send-unread-reminder v2, cleanup-push-receipts v1) CLI 배포 완료 | ✅ |
| **CLI 이력 관측** — `002_delete_user_account.sql`이 CLI 이력에서 pending 표시. 원격 스키마는 011/017이 완전 대체해 실질 무영향, 후속 push 시 include-all 필요 | ⏸ 관측 |
| 014 pg_cron 스케줄 등록 (`<CRON_SECRET>` 치환 후 Dashboard SQL Editor에서 수동 실행) | ⏸ Dashboard 실행 필요 |
| **Cleanup** — timestamp 실수 저장 asset 5개(`favicon/icon/logo.png * 시각.png`) + 미사용 `android-icon-*.png` 3개 삭제 | ✅ |
| **.gitignore 확장** — `AGENT.md`, `docs/portfolio-*.md`를 로컬 전용 개인 문서로 gitignore | ✅ |
| expo-doctor SDK 56 patch-version 불일치 (`expo`, `expo-router`, `expo-notifications` 등) | ⏸ SDK 업그레이드 스프린트에서 함께 |

## Phase 2 범위

### A. Phase 1 검토 발견 이슈 (우선순위 후보)

| 항목 | 상태 / 비고 |
|------|------|
| 온보딩 화면에서 카테고리 직접 추가 | ✅ 22차 완료 (결정 069). "+ 직접 추가" 칩 + CategoryBottomSheet 재사용 |
| 카테고리 순서 변경 | ✅ 24차 완료 (결정 071). 수동 정렬만 도입. 편집 전용 2depth 화면 + `react-native-draggable-flatlist` 세로 리스트 드래그. 자동 정렬 옵션(이름순/저장순/최근순)은 백로그 유지 |
| Rediscover 알고리즘 재고민 | ✅ 21차 완료 (결정 067). 정의를 "안 본 콘텐츠"에서 "관심사 기반 + 한동안 안 들여다본 콘텐츠"로 변경 |
| 리스트 viewType 설정 (콘텐츠) | ✅ 26차 Category Detail 1차 완료 (결정 073). Recent Saved / Search 등 다른 리스트 확장은 필요 시 후속 |
| 카테고리 아이콘 세트 교체 검토 | ✅ 완료. `lucide-react-native`로 이관 (웹 호환 대비). SF Symbols는 iOS 전용이라 배제 |

### B. CLAUDE.md 2차 범위 (1차 완료 + 남은 항목)

| 항목 | 상태 / 비고 |
|------|------|
| Forgotten Content | ✅ 1차 완료 (§055) |
| Report | ✅ 1차 완료 (§056~061). 2차 — 저장 리듬 히트맵(다음 후보), 저장→열람 지연 여정 세로 바(후보), 주차별 흐름, AI 코멘트. 백로그 — 관심사 페르소나 한 줄, 월간/연간 Wrapped 특별 리포트 |
| Interest Insight | ✅ 홈 카드로 1차 완료 (§068). Report 2차에서 정적 분석 형태 추가 검토 가능 |
| 푸시 알림 | 🟢 **1차 완료** (39~42, 46, 48, 51차). 완료: DB 스키마 / 클라이언트 토큰·설정 / 온보딩 권한 + 딥링크 라우팅 / 성격 재정의(미열람 리마인더 단일, 30분 단위 시간 지정) / Edge Function `send-unread-reminder` + pg_cron `0,30 * * * *` / 딥링크 전용 화면 `/unread-reminder?log_id=...` / 실기기 종단 검증 + APNs Push Key 등록(48차) / Expo receipt 정리 + dead token 즉시 회수(51차). v1.3 이후 채널(관심사 급부상 등) 및 다기기 receipt-단계 dead token 회수는 백로그. |
| 소셜 공유 | 미정 |
| 태그 필터링 | 🟡 진행 중. 47차에 Search 화면에 "자주 쓰는 태그" 추천 chip 진입점 추가 (검색어에 채우는 방식). 남음: Category Detail 내 태그 chip 필터, 다중 태그 AND 조합, 태그 자동완성 |
| 카카오 로그인 | 미정 |
| AI 요약 | 미정. AI 단일 호출 원칙(태그+카테고리)과 별도 호출로 분리 필요 |
| 미분류 관리 장치 | 미정. 미분류 방치 방지 UX 검토 |
| 오래된 링크 정리 제안 | 미정. 자동 삭제 대신 "오래 안 본 링크 정리 후보"를 제안하고 사용자가 삭제/유지/보관을 선택하는 방향. `viewed_at`/`saved_at` 기준 후보 산출 필요 |
| 썸네일 영구화 (v1.2 발견 이슈) | 🟢 **49차 완료**. Storage 백업(imagescript 리사이즈 + JPEG 70% 압축) + expo-image `cachePolicy="memory-disk"` 전면 도입. 신규 저장부터 Storage URL로 영구화됨. 기존 만료 콘텐츠는 소수라 마이그레이션 스킵(헬퍼 함수는 유지). |

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
