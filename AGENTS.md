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

Documentation Requirements

Record important decisions in:

/docs/decision-log.md

Record AI usage in:

/docs/ai-usage-log.md

Each AI usage log should include:

* problem
* AI tool used
* prompt summary
* result
* lesson learned

This project should demonstrate that AI was used to support problem solving, not to replace developer judgment.