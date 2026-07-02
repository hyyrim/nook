# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v56.0.0/ before writing any code.

## Project Overview

Nook is an AI-powered personal archive iOS app.

It helps users quickly save scattered content, automatically classify it with AI, and rediscover saved-but-forgotten content later.

Slogan: every nook and cranny

This project prioritizes:

* clear problem definition
* MVP scope control
* consistent design implementation
* safe multi-user data handling
* documented AI-assisted development decisions

⸻

## Tech Stack

* Framework: React Native with Expo
* Routing: Expo Router
* Build: Expo Development Build
* Share: expo-share-intent
* Backend: Supabase Auth, Database, Storage
* AI: Claude API, claude-haiku-4-5
* Deploy: EAS Build
* Language: TypeScript

⸻

## Core User Flow

### Onboarding

User selects interest categories.

* minimum: 3 categories
* maximum: 6 categories

Selected categories are used to create the user’s initial category records.

### Save Content

User shares a URL through the iOS share sheet.

Flow:

1. Share Extension receives URL
2. Backend extracts OG metadata
    * title
    * thumbnail
    * domain
3. Content is saved immediately
4. AI classification runs asynchronously
5. AI returns tags and one category
6. Content appears in Library
7. Content may later appear in Home Rediscover section

AI classification must not block the save UX.

⸻

## MVP Screens

The 1st MVP includes only:

* Onboarding
* Home
* Recent Saved
* Library
* Category Detail
* Content Detail
* Save Bottom Sheet
* Profile

Do not add new major screens unless explicitly requested.

⸻

## Out of Scope for MVP

Do not implement these in the 1st MVP:

* Forgotten Content
* Interest Insight
* Report
* Push notifications
* Social sharing
* Tag filtering
* Kakao login
* AI summary
* Unclassified content management automation

If any of these are needed, leave placeholders only or document them as Phase 2.

⸻

## Data Model

### users

* id: Supabase auth.uid()
* email
* created_at

### categories

* id
* user_id
* name
* created_at
* updated_at

### contents

* id
* user_id
* category_id: nullable
* url
* title
* thumbnail_url
* domain
* tags: text[]
* saved_at
* viewed_at
* created_at
* updated_at

⸻

## Security Rules

This is a multi-user service.

All user data must be isolated by user_id.

Required rules:

* Enable RLS on every table
* Every query must be scoped to the authenticated user
* Never omit user_id filtering in Supabase queries
* contents.user_id = auth.uid()
* categories.user_id = auth.uid()
* contents.url must be unique per user
* Use unique(user_id, url) to prevent duplicate saves

⸻

## Category Strategy

Categories are user-owned records.

Rules:

* Users select initial categories during onboarding
* AI can only classify content into that user’s existing categories
* AI must not create new categories
* If there is no matching category, save as unclassified
* Unclassified content is represented by category_id = NULL
* Do not create a separate “Unclassified” category row
* Library should expose unclassified content as a virtual folder
* Users can move unclassified content from Content Detail

## Default onboarding category options:

AI / 테크 / 경제 / 비즈니스 / 커리어 / 디자인 / 인테리어 / 여행 / 음식 / 음악 / 영화 / 운동

⸻

## AI Classification Rules

Use one AI call only.

Input:

* URL
* OG metadata
    * title
    * description
* current user’s category list

Output:

{
  "tags": ["AI", "Agent", "Workflow"],
  "category": "AI"
}

Rules:

* Return tags and category in a single response
* Do not generate summaries
* Category must be one of the user’s categories
* If there is no match, return category: null
* AI classification must run asynchronously
* Duplicate URLs must not trigger AI re-classification

Prompt files must be versioned under:

/prompts/classify/

⸻

## Design System

Follow the Claude Design export and existing visual direction.

Colors

Background:      #F2F2F2
Card:            #FFFFFF
Text Primary:    #1A1A1A
Text Secondary:  #767676
Text Tertiary:   #ABABAB
Border:          #E5E5E5
Accent Red:      #E5251A

Accent Red should be used sparingly, mainly for:

* rediscover dot
* CTA

Typography

Use Pretendard.

Page Title (1depth):  700 / 26px  ← 탭 화면 (홈, 폴더, 리포트, 프로필)
Nav Title (2depth):   600 / 17px  ← 하위 화면 (카테고리 상세, 계정 설정 등)
Title:     700 / 20px
Subtitle:  600 / 16px
Body:      400 / 14px
Caption:   400 / 12px

⸻

## Directory Rules

Use this structure:

nook/
├── app/
│   ├── (tabs)/
│   │   ├── index.tsx
│   │   ├── library.tsx
│   │   ├── report.tsx
│   │   └── profile.tsx
│   ├── onboarding.tsx
│   ├── content/[id].tsx
│   └── category/[id].tsx
├── components/
├── constants/
├── lib/
│   ├── supabase.ts
│   └── ai.ts
├── prompts/
│   └── classify/
│       ├── v1.txt
│       └── eval.ts
├── types/
├── CLAUDE.md
└── AGENTS.md

Rules:

* Shared UI components go in /components
* Constants go in /constants
* Supabase client and query logic go in /lib
* AI prompt files go in /prompts
* Type definitions go in /types

⸻

## Category Management Flow

### Add Category

Library → Add Category → Bottom Sheet → create category

### Edit Category

Category Detail → top-right menu → Bottom Sheet with existing name → update category

### Delete Category

Category Detail → top-right menu → Alert confirmation → delete category

Use one reusable Bottom Sheet component for both add and edit.

Use a mode prop to distinguish behavior.

⸻

## Development Rules for AI Agents

Before editing files:

1. Read this AGENTS.md
2. Check existing file structure
3. Summarize the intended change
4. Modify only the files needed for the task

Do not:

* rewrite large parts of the app unnecessarily
* change the design direction without explicit instruction
* add out-of-scope MVP features
* refactor unrelated files
* remove existing Claude Design export structure unless required for correctness
* create new categories through AI classification
* add AI summary features

Prefer:

* small commits
* minimal diffs
* TypeScript-safe changes
* existing component reuse
* Expo Router conventions
* clear separation between UI, Supabase, and AI logic

⸻

Current Development Priority

Current priority is Phase 1 stabilization.

Focus on:

1. Expo Router app structure
2. running npx expo start
3. fixing TypeScript errors
4. keeping Claude Design export UI intact
5. ensuring Home, Library, Profile, Detail screens navigate correctly

Do not start Supabase, AI classification, or onboarding persistence before the app runs correctly.

⸻

Suggested AI Tool Roles

Claude Code

Use for:

* architecture review
* Supabase schema review
* RLS strategy
* Share Extension design
* AI classification flow
* complex refactoring
* project-level decisions

Codex

Use for:

* TypeScript error fixes
* Expo Router runtime fixes
* import/path alias fixes
* small component adjustments
* boilerplate
* isolated UI fixes without changing design direction

ChatGPT

Use for:

* task planning
* decision log writing
* AI usage log writing
* portfolio framing
* workflow review

⸻

Documentation Convention

This project maintains current working logs at the root of `docs/` and archives completed periods under `docs/archive/`. All AI agents (Claude Code, Codex, ChatGPT) must follow this convention.

### 1. 의사결정 로그: `docs/decisions.md`

현재 진행 중인 Phase의 기술/디자인/UX 의사결정을 기록합니다. 완료된 Phase의 긴 기록은 `docs/archive/decisions-*.md`로 이동합니다.

포맷:
```
## NNN. 제목 (날짜)

**결정**: 무엇을 결정했는지
**배경**: 왜 이 결정이 필요했는지
**결과**: 구체적으로 무엇이 변경되었는지
**교훈** (optional): 배운 점
```

규칙:
* 번호는 순차 증가 (현재 마지막 번호 확인 후 +1)
* archive 파일의 마지막 번호도 확인하고, 번호는 전체 문서에서 중복 없이 이어서 사용
* 날짜는 `YYYY-MM-DD` 형식
* 한글로 작성, 기술 용어는 영어 허용
* 대안 검토가 있었다면 `**대안 검토**` 항목 추가
* 이전 결정을 고도화한 경우 `> 참고: 이후 NNN에서 고도화됨` 표시
* 완료된 Phase를 정리할 때만 `docs/archive/decisions-phase-N.md`로 이동
* 평소 새 결정은 `docs/decisions.md`에만 추가

### 2. AI 사용 로그: `docs/ai-usage-log.md`

현재 기간의 AI 도구 사용 내역을 한 줄로 기록합니다. 상세 내용은 `decisions.md`를 참고. 완료된 기간의 긴 로그는 `docs/archive/ai-usage-log-*.md`로 이동합니다.

포맷:
```
| AI 도구 | 작업 내용 |
```

규칙:
* 날짜별 섹션 (`## YYYY-MM-DD`)
* 테이블 형식, 한 줄에 하나의 작업
* 관련 의사결정이 있으면 `(→ 결정 NNN)` 링크 추가
* 의사결정과 내용을 중복 작성하지 않음
* 평소 새 로그는 `docs/ai-usage-log.md`에만 추가
* 월 또는 Phase가 끝나 문서가 길어졌을 때만 archive로 이동

### 3. 진행 상태: `docs/progress.md`

현재 Phase의 완료 항목, 다음 범위, 보류/기술 메모를 기록합니다. 완료된 Phase의 긴 진행 기록은 `docs/archive/progress-*.md`로 이동합니다.

규칙:
* `docs/progress.md`는 현재 상태를 빠르게 파악할 수 있게 유지
* 완료된 오래된 차수는 Phase 종료 또는 문서 정리 시점에 archive로 이동
* archive 이동은 기록 비용을 늘리지 않도록 자주 하지 않음

### 폐기된 파일

* `docs/decision-log.md` — `decisions.md`로 통합됨 (삭제)

This project should demonstrate that AI was used to support problem solving, not to replace developer judgment.
