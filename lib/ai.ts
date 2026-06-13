import { supabase } from './supabase';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_API_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY ?? '';

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

  // 유저의 카테고리 목록 가져오기
  const { data: categories, error: catError } = await supabase
    .from('categories')
    .select('name');
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
  const hasDescription = input.description.trim().length > 0;
  const titleInstruction = input.needsTitle
    ? `
3. The current title is generic (just a username + platform name). ${hasDescription ? 'Use the Description to generate a concise, descriptive title (Korean preferred, under 40 chars).' : 'There is no description available, so set suggested_title to null — do NOT guess or infer from the username/account name.'}`
    : '';

  const responseFormat = input.needsTitle
    ? '{"tags": ["tag1", "tag2"], "category": "CategoryName or null", "suggested_title": "제목 or null"}'
    : '{"tags": ["tag1", "tag2"], "category": "CategoryName or null"}';

  return `You are a content classifier for a personal archive app.

Given a URL and its metadata, you must:
1. Generate 1-5 relevant tags (short keywords in the content's language)
2. Classify the content into one of the user's categories, or null if none match${titleInstruction}

User's categories:
${input.categories.join(', ')}

Content to classify:
- URL: ${input.url}
- Title: ${input.title}
- Description: ${input.description}

Rules:
- Tags should be concise (1-2 words each), relevant to the content topic
- For category, pick the BEST matching category from the user's list above
- If no category is a good fit, return null
- Do NOT create new categories${input.needsTitle ? '\n- suggested_title: ONLY generate if you have actual content description. Do NOT infer from username, account bio, or profile name. If no description is available, return null.' : ''}
- Respond ONLY with valid JSON, no explanation

Response format:
${responseFormat}`;
}

// 제네릭 제목 패턴 (Instagram 등 본문 캡션이 title에 안 들어오는 사이트)
const GENERIC_TITLE_PATTERNS = [
  /instagram\s+사진\s+및\s+동영상/i,
  /instagram\s+photos?\s+and\s+videos?/i,
  /on\s+instagram/i,
  /instagram\s*릴스/i,
  /instagram\s*reels?/i,
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
