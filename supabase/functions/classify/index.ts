// Supabase Edge Function: classify
// 클라이언트에서 Anthropic API 키를 인라인하던 구조를 서버로 이전.
// 클라이언트는 URL/제목/도메인/설명만 넘기고, 서버가 유저 카테고리 조회 + Anthropic 호출 + 파싱을 담당.
//
// 배포:
//   supabase functions deploy classify --no-verify-jwt=false
// Secret 설정:
//   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// CORS 헤더 미설정. Nook은 모바일 전용이라 브라우저 프리플라이트가 발생하지 않고,
// wildcard 원본을 허용하면 유출된 JWT로 임의 사이트에서 Anthropic 크레딧을 소모할 수 있다.
// 향후 웹 클라이언트 추가 시 특정 origin allowlist로 재도입.

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-haiku-4-5-20251001';
const CLASSIFY_PROMPT_VERSION = 'v1';

type ClassifyInput = {
  url: string;
  title?: string;
  domain?: string;
  description?: string;
};

type ClassifyResult = {
  tags: string[];
  category: string | null;
  suggested_title?: string;
};

// lib/metadata.ts의 GENERIC_TITLE_PATTERNS와 동기화 유지.
const GENERIC_TITLE_PATTERNS = [
  /instagram\s+(사진|동영상|photos?|videos?|reels?|릴스)/i,
  /on\s+instagram/i,
  /\(@[\w.]+\)\s*[·•]\s*Instagram/i,
  /^Instagram(의|에서)/i,
  /^Threads(의|에서)/i,
  /\(@[\w.]+\)\s*[·•]\s*Threads/i,
  /on\s+Threads/i,
  /^X(에서|의)\s/i,
  /\(@[\w.]+\)\s*[·•]\s*X\b/i,
  /on\s+X(\s|$)/i,
  /^TikTok(에서|의)/i,
  /\(@[\w.]+\)\s*[·•]\s*TikTok/i,
  /on\s+TikTok/i,
  /\(@[\w.]+\)\s*님\s*$/,
];

function isGenericPlatformTitle(value?: string | null): boolean {
  if (!value) return false;
  return GENERIC_TITLE_PATTERNS.some((p) => p.test(value));
}

function buildPrompt(input: {
  url: string;
  title: string;
  description: string;
  categories: string[];
  needsTitle: boolean;
}): string {
  // prompts/classify/v1.txt와 계약 동기화 유지.
  return `You are a content classifier for a personal archive app.

Given a URL and its metadata, you must:
1. Generate 1-5 relevant tags (short keywords in the content's language)
2. Classify the content into one of the user's categories, or null if none match
3. If needs_title is true, generate suggested_title only when Description contains actual content. If Description is empty, set suggested_title to null.

User's categories:
${input.categories.join(', ')}

Content to classify:
- URL: ${input.url}
- Title: ${input.title}
- Description: ${input.description}
- Needs title: ${input.needsTitle ? 'true' : 'false'}

Rules:
- Tags should be concise (1-2 words each), relevant to the content topic
- For category, pick the BEST matching category from the user's list above
- If no category is a good fit, return null
- Do NOT create new categories
- Do NOT generate a summary
- suggested_title is optional and only for replacing generic platform titles
- If Needs title is false, return suggested_title as null
- Do NOT infer suggested_title from username, account bio, or profile name
- Respond ONLY with valid JSON, no explanation

Response format:
{"tags": ["tag1", "tag2"], "category": "CategoryName or null", "suggested_title": "Title or null"}`;
}

function parseClassifyResponse(
  text: string,
  validCategories: string[],
): ClassifyResult | null {
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);

    const tags: string[] = Array.isArray(parsed.tags)
      ? parsed.tags.filter((t: unknown) => typeof t === 'string').slice(0, 5)
      : [];

    let category: string | null = null;
    if (parsed.category && parsed.category !== 'null') {
      const match = validCategories.find(
        (c) => c.toLowerCase() === String(parsed.category).toLowerCase(),
      );
      category = match ?? null;
    }

    const suggestedTitleRaw =
      typeof parsed.suggested_title === 'string'
        ? parsed.suggested_title.trim()
        : '';
    const suggested_title =
      suggestedTitleRaw && suggestedTitleRaw !== 'null'
        ? suggestedTitleRaw
        : undefined;

    return { tags, category, suggested_title };
  } catch {
    return null;
  }
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Content-Type': 'text/plain' } });
  }
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'method_not_allowed' }, 405);
  }

  const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!anthropicKey) {
    console.error('ANTHROPIC_API_KEY not configured');
    return jsonResponse({ error: 'server_misconfigured' }, 500);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase env not available in function runtime');
    return jsonResponse({ error: 'server_misconfigured' }, 500);
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return jsonResponse({ error: 'unauthorized' }, 401);
  }

  // 유저의 JWT로 스코프한 클라이언트 — RLS가 자연스럽게 적용됨.
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userResult, error: userError } = await supabase.auth.getUser();
  if (userError || !userResult.user) {
    return jsonResponse({ error: 'unauthorized' }, 401);
  }
  const userId = userResult.user.id;

  let input: ClassifyInput;
  try {
    input = await req.json();
  } catch {
    return jsonResponse({ error: 'invalid_json' }, 400);
  }
  if (!input?.url || typeof input.url !== 'string') {
    return jsonResponse({ error: 'invalid_input' }, 400);
  }

  const { data: categories, error: catError } = await supabase
    .from('categories')
    .select('name')
    .eq('user_id', userId);
  if (catError) {
    console.error('categories fetch failed:', catError);
    return jsonResponse({ error: 'categories_fetch_failed' }, 500);
  }
  const categoryNames = (categories ?? []).map((c) => c.name as string);
  if (categoryNames.length === 0) {
    // 카테고리 없으면 분류할 게 없음.
    return jsonResponse({ result: null, prompt_version: CLASSIFY_PROMPT_VERSION });
  }

  const titleIsGeneric =
    !input.title || isGenericPlatformTitle(input.title);
  const prompt = buildPrompt({
    url: input.url,
    title: input.title ?? '',
    description: input.description ?? '',
    categories: categoryNames,
    needsTitle: titleIsGeneric,
  });

  let anthropicResponse: Response;
  try {
    anthropicResponse = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 256,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
  } catch (e) {
    console.error('Anthropic fetch failed:', e);
    return jsonResponse({ error: 'upstream_unavailable' }, 502);
  }

  if (!anthropicResponse.ok) {
    const errBody = await anthropicResponse.text();
    console.error('Anthropic error', anthropicResponse.status, errBody);
    return jsonResponse({ error: 'upstream_error', status: anthropicResponse.status }, 502);
  }

  const anthropicJson = await anthropicResponse.json();
  const text: string = anthropicJson.content?.[0]?.text ?? '';
  const result = parseClassifyResponse(text, categoryNames);

  return jsonResponse({ result, prompt_version: CLASSIFY_PROMPT_VERSION });
});
