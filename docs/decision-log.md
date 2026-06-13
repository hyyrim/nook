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
