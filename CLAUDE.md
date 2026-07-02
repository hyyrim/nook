## 서비스 개요

Nook은 흩어진 콘텐츠를 빠르게 저장하고, AI가 자동으로 분류하며, 저장했지만 잊혀진 콘텐츠를 다시 발견하도록 돕는 AI 기반 개인 아카이브 iOS 앱이다.

**슬로건**: every nook and cranny

**현재 상태**: v1.0.0 MVP 정식 출시 완료 (2026-06-25). Phase 2 진입 — 1차 범위 동결 원칙은 해제되었고, Phase 2 작업 범위는 `docs/progress.md`의 "Phase 2 범위" 섹션 참조.

---

## 기술 스택

```
- Framework:  React Native (Expo)
- Build:      Expo Development Build
- Share:      expo-share-intent
- Backend:    Supabase (Auth + DB + Storage)
- AI:         Claude API - claude-haiku-4-5
- Deploy:     EAS Build
```

---

## 핵심 플로우

```jsx
[온보딩] 관심 카테고리 선택 → 초기 categories 생성

[저장]
공유 버튼 → Share Extension → URL 전달
→ 백엔드에서 OG 메타데이터 추출 (title, thumbnail, domain)
→ 즉시 저장
→ 비동기 AI 분류 (Haiku 단일 호출 → 태그 + 카테고리)
   · 카테고리는 해당 유저의 카테고리 중 분류
   · 매칭 없으면 미분류 (category_id = NULL)
→ 폴더 자동 분류
→ Home Rediscover(미열람) / Forgotten(오래 안 본) 섹션에서 재발견
→ Report 탭에서 관심사 회고
```

---

## 화면 목록

```jsx
- Onboarding        관심 카테고리 선택 → 초기 카테고리 생성
- Home              최근 저장 + Rediscover(미열람) + Forgotten(오래 안 본) 섹션
- Recent Saved      전체 콘텐츠 최근 저장순 리스트
- 폴더              카테고리별 폴더 그리드 (미분류 폴더 포함)
- Category Detail   카테고리 내 콘텐츠 리스트
- Content Detail    콘텐츠 상세 + 태그(수정) + 카테고리 이동 + 관련 콘텐츠
- Report            관심사 회고 (관심 분포 + 관련 주제, 기간 선택)
- 저장 Bottom Sheet  URL 직접 입력 저장
- Profile           유저 정보 + 설정
- Account Settings  이메일 / 로그인 방식 / 로그아웃 / 계정 삭제
- Search            전체 콘텐츠 title/domain/tags 검색
```

---

## 데이터 모델

```jsx
users
- id            (Supabase auth.uid())
- email
- created_at

categories
- id
- user_id
- name
- created_at
- updated_at

contents
- id
- user_id
- category_id     (nullable, NULL = 미분류)
- url
- title
- thumbnail_url
- domain
- tags            (text[])
- saved_at
- viewed_at
- created_at
- updated_at
```

**제약 / 보안**

- `contents`: unique(user_id, url) — 사용자별 중복 URL 방지
- 모든 테이블 RLS 활성화 — user_id = auth.uid() 인 행만 접근 가능
- `category_id`: nullable. NULL = 미분류. 폴더 탭에서 `category_id IS NULL` 뷰로 "미분류" 폴더 노출
- `viewed_at`: Content Detail 진입 시점에 업데이트 (원문 클릭 기준 아님)
- `tags`: 별도 테이블 없이 text[] 배열 저장 (MVP에서 태그 필터링 미지원)

---

## 핵심 원칙

**멀티유저 + 데이터 격리**

- 멀티유저 서비스. 모든 테이블 RLS 활성화 (user_id = auth.uid() 기준)
- 모든 쿼리는 인증된 유저의 데이터에만 접근. 절대 user_id 필터 누락 금지

**카테고리 전략**

- 온보딩에서 사용자가 관심 카테고리 선택(최소 3개 / 최대 6개) → 초기 categories 생성
- AI는 **해당 유저의 카테고리 중에서만** 분류. 매칭 안 되면 미분류(category_id = NULL)
- AI는 새 카테고리를 생성하지 않음 (파편화 방지)
- 미분류는 별도 행이 아니라 `category_id IS NULL`로 표현
- 사용자가 미분류 콘텐츠를 Content Detail에서 적절한 카테고리로 이동
- (기록) 미분류 방치 방지 장치는 MVP 제외, 2차 검토

**Phase 2 범위 (현재 진행 중)**

- 1차 완료: Forgotten Content, Report 1차(관심사 회고)
- 남은 후보: Interest Insight, 푸시 알림, 소셜 공유, 태그 필터링, 카카오 로그인, AI 요약, 미분류 관리 장치, Report 2차(주차별 흐름·AI 코멘트)
- 우선순위와 세부 작업은 `docs/progress.md`의 "Phase 2 범위" 섹션을 단일 진실 소스로 사용

**AI 단일 호출 원칙**

- 태그 + 카테고리를 반드시 단일 프롬프트로 처리 (요약 생성 안 함)
- 저장 UX와 AI 분류는 반드시 분리 (비동기)
- 중복 URL은 unique(user_id, url) 제약으로 저장 시점에 차단 → AI 재호출 없음

**카테고리 / 태그 수정**

- 카테고리: AI 분류 후 사용자가 Content Detail에서 이동 / 폴더 탭에서 관리 가능
- 태그: AI 자동 생성 후 사용자가 Content Detail에서 수정 가능

**코드 품질**

- 컴포넌트는 `/components` 디렉토리에 위치
- 프롬프트는 `/prompts` 디렉토리에서 버전 관리
- Supabase 쿼리는 `/lib/supabase` 에 위치
- 타입 정의는 `/types` 디렉토리에 위치

**카테고리 관리 플로우**

- 추가: 폴더 → "카테고리 추가" 탭 → Bottom Sheet (빈 인풋) → 추가
- 수정: Category Detail 우상단 … → Bottom Sheet (기존 이름 채워진 인풋) → 수정
- 삭제: Category Detail 우상단 … → 확인 Alert → 삭제
- 추가/수정 Bottom Sheet는 동일 컴포넌트 재사용 (mode prop으로 분기)

---

## 디자인 시스템

```
Background:      #F2F2F2
Card:            #FFFFFF
Text Primary:    #1A1A1A
Text Secondary:  #767676
Text Tertiary:   #ABABAB
Border:          #E5E5E5
Accent (Red):    #E5251A  ← 재발견 닷, CTA에만 절제 사용
Success (Green): #34C759

Font: iOS 시스템 기본 폰트 (한글: Apple SD Gothic Neo)
- Page Title (1depth):  700 / 26px  ← 탭 화면 (홈, 폴더, 리포트, 프로필)
- Nav Title (2depth):   600 / 17px  ← 하위 화면 (카테고리 상세, 계정 설정 등)
- Title:   700 / 20px
- Subtitle: 600 / 16px
- Body:    400 / 14px
- Caption: 400 / 12px
```

---

## 디렉토리 구조

```jsx
nook/
├── app/                  # Expo Router 화면
│   ├── (tabs)/
│   │   ├── index.tsx     # Home
│   │   ├── library.tsx   # 폴더
│   │   ├── report.tsx    # Report (관심사 회고)
│   │   └── profile.tsx   # Profile
│   ├── onboarding.tsx    # 온보딩 (관심 카테고리 선택)
│   ├── content/[id].tsx  # Content Detail
│   └── category/[id].tsx # Category Detail
├── components/           # 공통 컴포넌트
├── lib/
│   ├── supabase.ts       # Supabase 클라이언트
│   └── ai.ts             # Claude API 호출
├── prompts/              # AI 프롬프트 버전 관리
│   └── classify/
│       ├── v1.txt
│       └── eval.ts
├── types/                # TypeScript 타입
├── constants/            # 색상, 폰트 등
└── CLAUDE.md
```

---

## AI 프롬프트 구조

**사용 모델**: `claude-haiku-4-5`

**입력**: URL + OG 메타데이터(title, description) + 해당 유저의 카테고리 목록

**출력 형식** (단일 호출로 아래 항목 전부 반환):

```json
{
  "tags": ["AI", "Agent", "Workflow"],
  "category": "AI"
}
```

- `category`: 유저의 카테고리 중 하나. 매칭되는 게 없으면 `null` (미분류)

**온보딩 기본 카테고리 옵션** (사용자가 이 중 최소 3개 / 최대 6개 선택):

`AI / 테크 / 경제 / 비즈니스 / 커리어 / 디자인 / 인테리어 / 여행 / 음식 / 음악 / 영화 / 운동`

**엣지 케이스: 유저 카테고리 중 매칭 없을 때**

→ `category = null` (미분류)로 저장

→ 사용자가 Content Detail에서 적절한 카테고리로 이동


---

## 참고 문서

- 진행 상태: `docs/progress.md`
- 의사결정 로그: `docs/decisions.md`