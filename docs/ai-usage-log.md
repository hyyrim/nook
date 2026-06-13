# AI Usage Log

This file records AI-assisted development work for Nook.

---

## 2026-06-13. Phase 1 stabilization review and scoped fixes

**Problem**: Review the current project state and address the highest-priority stabilization gaps without changing the Claude Design visual direction.

**AI tool used**: Codex

**Prompt summary**: The user asked Codex to review existing changes, identify remaining work, then proceed one item at a time. The review prioritized TypeScript health, Expo Router structure, Supabase query safety, prompt versioning, and documentation requirements.

**Result**:
- Verified `npx tsc --noEmit` passes.
- Added explicit `user_id` scoping to Supabase category/content queries.
- Scoped AI classification category reads to the authenticated user.
- Synchronized the runtime classification prompt with `prompts/classify/v1.txt`.
- Added required documentation files: `docs/decision-log.md` and `docs/ai-usage-log.md`.
- Confirmed the Report tab is an intentional Phase 2 `Coming soon` placeholder.

**Lesson learned**: RLS is necessary but not enough for this project standard. Keeping client queries explicitly scoped makes multi-user data assumptions easier to audit during AI-assisted development.

---

## 2026-06-13. Simulation test UI fixes before Phase 2

**Problem**: Apply the Notion "시뮬레이션 테스트" findings before moving to Phase 2, while leaving Library bulk edit for Phase 2.

**AI tool used**: Codex

**Prompt summary**: The user asked Codex to read the Notion simulation test notes and fix items 1-6. Item 7, Library detail bulk edit, should remain Phase 2.

**Result**:
- Added a Home placeholder state when Recent Saved exists but Rediscover has no items.
- Moved the Content Detail original-link action into the category/source row.
- Preserved multiline descriptions from metadata and added a detail-screen formatter.
- Added collapsed long descriptions with a More/close toggle.
- Added a title edit bottom sheet from Content Detail.
- Removed the category-change sheet delay and tuned its animation timing.

**Lesson learned**: Simulation notes are most useful when they capture exact visual discomfort. Small spacing, placement, and transition fixes can remove a lot of perceived roughness without expanding MVP scope.
