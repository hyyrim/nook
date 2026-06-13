import { supabase } from './supabase';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_API_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY ?? '';

type ClassifyResult = {
  tags: string[];
  category: string | null;
};

export async function classifyContent(content: {
  url: string;
  title?: string;
  domain?: string;
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

  const prompt = buildPrompt({
    url: content.url,
    title: content.title ?? '',
    description: '',
    categories: categoryNames,
  });

  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20241022',
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
}): string {
  return `You are a content classifier for a personal archive app.

Given a URL and its metadata, you must:
1. Generate 1-5 relevant tags (short keywords in the content's language)
2. Classify the content into one of the user's categories, or null if none match

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
- Do NOT create new categories
- Respond ONLY with valid JSON, no explanation

Response format:
{"tags": ["tag1", "tag2"], "category": "CategoryName or null"}`;
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

    return { tags, category };
  } catch {
    console.error('Failed to parse classify response:', text);
    return null;
  }
}
