# Profile Account Deletion UX Discussion

## Context

Profile 화면의 `계정 삭제` 액션이 현재 사용자에게 너무 강하게 노출되어 보인다.

기존 화면에서는 `계정` 섹션 안에 `로그아웃`과 `계정 삭제`가 나란히 있었고, 두 항목 모두 Accent Red 계열로 표시되어 위험 액션이 일반 계정 액션보다 더 눈에 띄었다.

최근 임시 수정으로 `계정 삭제`를 `계정 관리` 액션 시트 안에 넣었지만, 액션 시트에 `계정 삭제` 하나만 표시되는 구조는 UX가 어색하다. 사용자는 `계정 관리`를 눌렀을 때 더 완성된 계정 설정 맥락을 기대할 가능성이 높다.

## Product Goal

- App Store 심사 요건을 만족한다.
- 사용자가 계정 삭제 기능을 찾을 수 있게 한다.
- 실수로 누르기 쉬운 위험 액션처럼 보이지 않게 한다.
- Nook의 조용하고 정돈된 Profile 화면 분위기를 유지한다.
- MVP 범위를 크게 늘리지 않는다.

## Apple Guidance

Apple은 계정 생성을 지원하는 앱이 앱 안에서 계정 삭제를 시작할 수 있어야 한다고 안내한다.

Key points:

- 계정 삭제 옵션은 앱 안에서 쉽게 찾을 수 있어야 한다.
- 보통 앱의 account settings 안에 포함된다.
- 계정 전체와 관련 개인 데이터 삭제를 제공해야 한다.
- 삭제 의도를 확인하기 위한 추가 단계는 허용된다.
- 삭제를 불필요하게 어렵게 만들면 App Review를 통과하지 못할 수 있다.

References:

- Apple App Review Guidelines 5.1.1(v): https://developer.apple.com/app-store/review/guidelines/
- Apple account deletion guidance: https://developer.apple.com/support/offering-account-deletion-in-your-app/

## Common App Patterns

### Pattern A: Account Settings 2depth

Many apps place account deletion under a dedicated account settings area.

Typical structure:

- Profile
- Settings
- Account
- Account ownership / Account management
- Deactivation or deletion

Examples:

- Meta apps commonly route account deletion through Accounts Center > Personal details > Account ownership and control > Deactivation or deletion.
- X places deactivation under Settings and privacy > Your account.
- TikTok places deletion under account management before confirmation.

This pattern makes the destructive action discoverable while keeping it out of the main profile list.

References:

- AP on Meta account deletion flow: https://apnews.com/article/de2f6bd8bfc4fb0626c952e48117d16c
- Business Insider on X account deactivation flow: https://www.businessinsider.com/how-to-delete-x-twitter-account-permanently
- Lifewire on TikTok account deletion flow: https://www.lifewire.com/how-to-delete-tiktok-account-4781530

### Pattern B: Low-Priority Footer Link

Some apps keep the destructive action on the same settings page but move it to the bottom as a small, low-emphasis text button.

Typical structure:

- Account section
- Logout
- Legal / app info
- Footer text button: Delete account

This reduces visual noise but still leaves the action available.

Tradeoff:

- It is simpler than adding a route.
- It may still make Profile feel policy-driven rather than product-driven.
- It is less structured than a real account settings area.

### Pattern C: Action Sheet From Profile

Profile shows `계정 관리`, then an action sheet exposes `계정 삭제`.

This is the current temporary direction.

Tradeoff:

- It adds one interaction before deletion.
- It avoids a new route.
- But if the sheet only contains `계정 삭제`, the menu feels empty and artificial.
- It may feel like the app is hiding the option rather than organizing it.

## Recommended Direction for Nook

Use Pattern A: a small account settings 2depth.

Suggested structure:

Profile:

- 정보
  - 개인정보 처리방침
  - 서비스 이용약관
- 계정
  - 로그아웃
  - 계정 설정

Account Settings:

- 계정 정보
  - 이메일
- 계정
  - 로그아웃
- 위험 구역 or footer
  - 계정 삭제하기

Deletion flow:

1. User opens Profile.
2. User taps `계정 설정`.
3. User sees account info and normal account actions.
4. `계정 삭제하기` appears at the bottom with low visual emphasis.
5. Tapping it opens a clear confirmation Alert.
6. Alert explains that saved content, categories, and account data will be permanently deleted.
7. User confirms deletion.

## Copy Recommendation

Profile row:

- `계정 설정`

Account settings title:

- `계정 설정`

Delete action:

- `계정 삭제하기`

Confirmation title:

- `계정을 삭제할까요?`

Confirmation body:

- `저장한 콘텐츠와 카테고리가 모두 삭제돼요. 이 작업은 되돌릴 수 없어요.`

Confirmation buttons:

- Cancel: `취소`
- Destructive: `삭제하기`

## Implementation Notes for Claude Code

- Keep the change small.
- Do not add a major MVP screen. Treat `계정 설정` as a lightweight settings subpage if using a route.
- Prefer Expo Router conventions.
- Candidate route: `app/account-settings.tsx`
- Add the screen to the root stack in `app/_layout.tsx` only if needed.
- Reuse existing visual styles from `app/(tabs)/profile.tsx`.
- Keep Accent Red only for the final destructive action, not for the whole account section.
- Preserve the existing `deleteAccount()` logic and Supabase sign-out behavior.
- Keep the final Alert confirmation.
- Do not touch Supabase schema, AI classification, onboarding persistence, or unrelated tabs.

## Open Questions

- Should `로그아웃` remain on the Profile page, the Account Settings page, or both?
- Should Account Settings be a full route or a bottom sheet?
- If a bottom sheet is used, should it contain enough content to feel like a real account settings surface rather than a one-action menu?
- Should the delete confirmation require typing a word such as `삭제` before final deletion, or is the native Alert enough for MVP?

## Current Recommendation

For MVP, use a full lightweight route:

- Profile keeps `로그아웃` and `계정 설정`.
- Account Settings shows email and a low-emphasis `계정 삭제하기` footer action.
- Native Alert remains the final destructive confirmation.

This is the cleanest balance between App Store compliance, discoverability, and visual calm.
