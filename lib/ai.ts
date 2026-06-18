import { supabase } from './supabase';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_API_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY ?? '';
export const CLASSIFY_PROMPT_VERSION = 'v1';

type ClassifyResult = {
  tags: string[];
  category: string | null;
  suggested_title?: string;
};

export async function classifyContent(content: {
  url: string;
  title?: string;
  domain?: string;
  description?: string;
}) {
  if (!ANTHROPIC_API_KEY) {
    console.warn('Anthropic API key not set, skipping classification');
    return null;
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // 유저의 카테고리 목록 가져오기
  const { data: categories, error: catError } = await supabase
    .from('categories')
    .select('name')
    .eq('user_id', user.id);
  if (catError) throw catError;

  const categoryNames = (categories ?? []).map(c => c.name);
  if (categoryNames.length === 0) return null;

  const titleIsGeneric = !content.title || isGenericTitle(content.title);
  const prompt = buildPrompt({
    url: content.url,
    title: content.title ?? '',
    description: content.description ?? '',
    categories: categoryNames,
    needsTitle: titleIsGeneric,
  });

  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const errBody = await response.text();
    console.error('Claude API error:', response.status, errBody);
    return null;
  }

  const data = await response.json();
  const text = data.content?.[0]?.text ?? '';

  return parseClassifyResponse(text, categoryNames);
}

function buildPrompt(input: {
  url: string;
  title: string;
  description: string;
  categories: string[];
  needsTitle: boolean;
}): string {
  // Keep this prompt contract in sync with prompts/classify/v1.txt.
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

// 제네릭 제목 패턴 (Instagram 등 본문 캡션이 title에 안 들어오는 사이트)
// metadata.ts의 GENERIC_TITLE_PATTERNS와 동기화 유지
const GENERIC_TITLE_PATTERNS = [
  /instagram\s+(사진|동영상|photos?|videos?|reels?|릴스)/i,
  /on\s+instagram/i,
  /\(@[\w.]+\)\s*[·•]\s*Instagram/i,
  /^Instagram(의|에서)/i,
];

function isGenericTitle(title: string) {
  return GENERIC_TITLE_PATTERNS.some(p => p.test(title));
}

function parseClassifyResponse(
  text: string,
  validCategories: string[],
): ClassifyResult | null {
  try {
    // JSON 블록 추출 (```json ... ``` 또는 순수 JSON)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);

    const tags: string[] = Array.isArray(parsed.tags)
      ? parsed.tags.filter((t: unknown) => typeof t === 'string').slice(0, 5)
      : [];

    let category: string | null = null;
    if (parsed.category && parsed.category !== 'null') {
      // 유저 카테고리 목록에 있는 경우만 허용
      const match = validCategories.find(
        c => c.toLowerCase() === String(parsed.category).toLowerCase(),
      );
      category = match ?? null;
    }

    const suggested_title =
      typeof parsed.suggested_title === 'string'
        && parsed.suggested_title.trim()
        && parsed.suggested_title !== 'null'
        ? parsed.suggested_title.trim()
        : undefined;

    return { tags, category, suggested_title };
  } catch {
    console.error('Failed to parse classify response:', text);
    return null;
  }
}
