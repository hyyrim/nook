# Decision Log

This file is the canonical decision log required by AGENTS.md.

Historical decisions from earlier Phase 1 work are currently preserved in `docs/decisions.md`.
New decisions should be recorded here going forward.

---

## 011. Explicit Supabase user scoping in client queries (2026-06-13)

**Decision**: Every app-level Supabase query in `lib/api.ts` and `lib/ai.ts` now explicitly scopes reads and writes to the authenticated `user_id`, in addition to database RLS.

**Context**: Nook is a multi-user archive. RLS protects the database, but the project rule also requires client query code to never omit `user_id` filtering.

**Result**:
- Added a shared `requireUserId()` helper in `lib/api.ts`.
- Added `.eq('user_id', userId)` to category and content reads, updates, and deletes.
- Validated category moves against the current user's category records.
- Scoped AI classification category lookup to the current user's categories.

---

## 012. Classification prompt v1 contract sync (2026-06-13)

**Decision**: Keep `lib/ai.ts` prompt construction synchronized with `prompts/classify/v1.txt`.

**Context**: The runtime prompt had evolved to support optional `suggested_title` for generic platform titles, but the versioned prompt file still documented only `tags` and `category`.

**Result**:
- Added `CLASSIFY_PROMPT_VERSION = 'v1'`.
- Updated `prompts/classify/v1.txt` to match the runtime prompt contract.
- Preserved the rule that AI must not create categories or generate summaries.

---

## 013. Phase 1 simulation fixes and Phase 2 boundary (2026-06-13)

**Decision**: Apply small UI/UX fixes from the Notion simulation test before Phase 2, but keep Library bulk edit as Phase 2 scope.

**Context**: The simulation test surfaced polish issues in Home and Content Detail. These affected perceived quality but did not require new major screens or backend changes. Library bulk edit needs a broader selection/editing model, so it should not be squeezed into Phase 1.

**Result**:
- Added a Home placeholder for the state where Recent Saved exists but Rediscover has no items.
- Improved Content Detail source/original-link placement, description spacing, multiline display, and long-text expansion.
- Added a focused title edit bottom sheet from Content Detail.
- Tuned category-change sheet timing and removed the extra delay between action sheet and bottom sheet.
- Added auth-session guards so protected screens do not fetch user data before the session is ready.
- Deferred Library bulk edit to Phase 2.
