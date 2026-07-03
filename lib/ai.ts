import { supabase } from './supabase';

// 프롬프트/모델은 supabase/functions/classify/index.ts로 이동.
// 앱 번들에서 Anthropic API 키/직접 호출을 제거하기 위해 서버로 위임.
export const CLASSIFY_PROMPT_VERSION = 'v1';

type ClassifyResult = {
  tags: string[];
  category: string | null;
  suggested_title?: string;
};

type ClassifyResponse = {
  result: ClassifyResult | null;
  prompt_version?: string;
  error?: string;
};

export async function classifyContent(content: {
  url: string;
  title?: string;
  domain?: string;
  description?: string;
}): Promise<ClassifyResult | null> {
  const { data, error } = await supabase.functions.invoke<ClassifyResponse>(
    'classify',
    {
      body: {
        url: content.url,
        title: content.title,
        domain: content.domain,
        description: content.description,
      },
    },
  );

  if (error) {
    console.warn('classify function error:', error);
    return null;
  }
  if (!data || data.error) {
    if (data?.error) console.warn('classify server error:', data.error);
    return null;
  }
  return data.result;
}
