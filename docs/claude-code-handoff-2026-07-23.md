# Claude Code Handoff — 2026-07-23

## Context

Current focus: Phase 2 / v1.2.4 TestFlight stabilization.

User wants Claude Code to continue from Codex changes without re-reading the whole thread.

## Completed In This Pass

- Simulator/dev-client sanity check: iOS simulator build succeeded earlier with `npx expo run:ios --device "iPhone 17"`.
- Empty state alignment:
  - `components/EmptyState.tsx`: added `variant="center"` and shared `translateY: -48` visual offset.
  - `app/reminders.tsx`: scheduled reminders empty state now reuses `EmptyState`.
  - `app/(tabs)/report.tsx`: insufficient report empty state uses same visual offset.
- Scheduled reminders UX:
  - `app/reminders.tsx`: optimistic single delete, header "전체 삭제", trash action button.
  - `lib/reminders.ts`: `cancelReminder` supports `throwOnError` in current diff.
- Notification onboarding/settings:
  - `app/notification-permission.tsx`: onboarding "나중에" writes `notification_settings.enabled=false`.
  - `app/notification-settings.tsx`: fallback default `enabled=false`.
  - Existing iOS denied flow already opens Settings; no extra native logic added.
- Category bottom sheet:
  - `components/CategoryBottomSheet.tsx`: added `showStyleControls` prop for onboarding name-only category add.
  - Attempted keyboard-visible hiding of style controls was reverted because it felt worse.

## Open Questions

- Notification IA is unresolved:
  - Current labels mix automatic unread-reminder push settings with user-created content reminders.
  - Codex recommendation was to rename "전체 알림" to "자동 알림", but user wants to think more.
  - Do not change DB column names for this yet.
- Category add bottom sheet with keyboard still needs a better UX if the user wants it fixed.
  - Avoid hiding color/icon controls while typing.
- User reported a freeze after toggling notification settings and returning home.
  - Logs showed dev-runtime `AppContextLost` and duplicate `react-native-screens` registrations after Metro/runtime got corrupted.
  - No retained `_layout.tsx` change for this; current code should be tested on real device only.

## Verification

- `npx tsc --noEmit` passed after the latest code changes.
- User said simulator verification is not needed; use real device testing from here.

## Real Device Test Command

```bash
npx expo start --dev-client
```

Use LAN mode for real device. Do not use `--localhost`.
