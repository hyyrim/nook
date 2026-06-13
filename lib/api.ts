import { supabase } from './supabase';
import { classifyContent } from './ai';
import { fetchLinkMetadata, normalizeUrl } from './metadata';
import type { Category, Content } from '@/types';

async function requireUserId() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return user.id;
}

// ─── Categories ───

export async function getCategories() {
  const userId = await requireUserId();

  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data as Category[];
}

export async function getCategoryWithCount(categoryId: string) {
  const userId = await requireUserId();

  const { data: category, error: catError } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', userId)
    .eq('id', categoryId)
    .single();
  if (catError) throw catError;

  const { count, error: countError } = await supabase
    .from('contents')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('category_id', categoryId);
  if (countError) throw countError;

  return { category: category as Category, count: count ?? 0 };
}

export async function getCategoriesWithCounts() {
  const userId = await requireUserId();

  const { data: categories, error: catError } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });
  if (catError) throw catError;

  const { data: counts, error: countError } = await supabase
    .from('contents')
    .select('category_id')
    .eq('user_id', userId)
    .not('category_id', 'is', null);
  if (countError) throw countError;

  const countMap: Record<string, number> = {};
  for (const row of counts ?? []) {
    if (row.category_id) {
      countMap[row.category_id] = (countMap[row.category_id] ?? 0) + 1;
    }
  }

  return (categories as Category[]).map(cat => ({
    ...cat,
    count: countMap[cat.id] ?? 0,
  }));
}

export async function createCategory(name: string) {
  const userId = await requireUserId();

  const { data, error } = await supabase
    .from('categories')
    .insert({ user_id: userId, name })
    .select()
    .single();
  if (error) throw error;
  return data as Category;
}

export async function updateCategory(id: string, name: string) {
  const userId = await requireUserId();

  const { data, error } = await supabase
    .from('categories')
    .update({ name })
    .eq('user_id', userId)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Category;
}

export async function deleteCategory(id: string) {
  const userId = await requireUserId();

  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('user_id', userId)
    .eq('id', id);
  if (error) throw error;
}

// ─── Contents ───

export async function getRecentContents(limit = 10) {
  const userId = await requireUserId();

  const { data, error } = await supabase
    .from('contents')
    .select('*, categories(name)')
    .eq('user_id', userId)
    .order('saved_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data as (Content & { categories: { name: string } | null })[];
}

export async function getContentsByCategory(categoryId: string) {
  const userId = await requireUserId();

  const { data, error } = await supabase
    .from('contents')
    .select('*')
    .eq('user_id', userId)
    .eq('category_id', categoryId)
    .order('saved_at', { ascending: false });
  if (error) throw error;
  return data as Content[];
}

export async function getUncategorizedContents() {
  const userId = await requireUserId();

  const { data, error } = await supabase
    .from('contents')
    .select('*')
    .eq('user_id', userId)
    .is('category_id', null)
    .order('saved_at', { ascending: false });
  if (error) throw error;
  return data as Content[];
}

export async function getContentById(id: string) {
  const userId = await requireUserId();

  const { data, error } = await supabase
    .from('contents')
    .select('*, categories(name)')
    .eq('user_id', userId)
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as Content & { categories: { name: string } | null };
}

export async function saveContent(input: {
  url: string;
  title?: string;
  thumbnail_url?: string;
  domain?: string;
}) {
  const userId = await requireUserId();

  const normalizedUrl = normalizeUrl(input.url);
  const metadata = await fetchLinkMetadata(normalizedUrl);
  const contentInput = {
    ...input,
    url: normalizedUrl,
    title: input.title ?? metadata.title,
    description: metadata.description ?? null,
    thumbnail_url: input.thumbnail_url ?? metadata.thumbnail_url,
    domain: input.domain ?? metadata.domain,
  };
  const metaDescription = metadata.description;

  const { data, error } = await supabase
    .from('contents')
    .insert({ user_id: userId, ...contentInput })
    .select()
    .single();
  if (error) throw error;

  const saved = data as Content;

  // 비동기 AI 분류 (저장 UX와 분리, 실패해도 저장은 유지)
  classifyAndUpdate(saved, metaDescription).catch(err =>
    console.warn('AI classification failed:', err),
  );

  return saved;
}

export async function refreshContentMetadata(
  content: Content & { categories?: { name: string } | null },
): Promise<Content & { categories: { name: string } | null }> {
  const userId = await requireUserId();
  const metadata = await fetchLinkMetadata(content.url);
  const updates: {
    title?: string;
    description?: string;
    thumbnail_url?: string;
    domain?: string;
  } = {};

  if ((!content.title || content.title === content.url) && metadata.title) {
    updates.title = metadata.title;
  }

  if (!content.description && metadata.description) {
    updates.description = metadata.description;
  }

  if (!content.thumbnail_url && metadata.thumbnail_url) {
    updates.thumbnail_url = metadata.thumbnail_url;
  }

  if (!content.domain && metadata.domain) {
    updates.domain = metadata.domain;
  }

  if (Object.keys(updates).length === 0) {
    return {
      ...content,
      categories: content.categories ?? null,
    };
  }

  const { data, error } = await supabase
    .from('contents')
    .update(updates)
    .eq('user_id', userId)
    .eq('id', content.id)
    .select('*, categories(name)')
    .single();
  if (error) throw error;
  return data as Content & { categories: { name: string } | null };
}

export async function updateContent(id: string, updates: {
  category_id?: string | null;
  tags?: string[];
  title?: string;
}) {
  const userId = await requireUserId();

  if (updates.category_id) {
    const { data: category, error: categoryError } = await supabase
      .from('categories')
      .select('id')
      .eq('user_id', userId)
      .eq('id', updates.category_id)
      .maybeSingle();
    if (categoryError) throw categoryError;
    if (!category) throw new Error('Category not found');
  }

  const { data, error } = await supabase
    .from('contents')
    .update(updates)
    .eq('user_id', userId)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Content;
}

export async function deleteContent(id: string) {
  const userId = await requireUserId();

  const { error } = await supabase
    .from('contents')
    .delete()
    .eq('user_id', userId)
    .eq('id', id);
  if (error) throw error;
}

export async function markContentViewed(id: string) {
  const userId = await requireUserId();

  const { error } = await supabase
    .from('contents')
    .update({ viewed_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('id', id);
  if (error) throw error;
}

// ─── Rediscover (저장 빈도 높은 카테고리의 안 본 콘텐츠 우선) ───

export async function getRediscoverContents(limit = 5) {
  const userId = await requireUserId();

  // 1. 카테고리별 콘텐츠 수 집계 (많은 순)
  const { data: catCounts, error: countError } = await supabase
    .from('contents')
    .select('category_id')
    .eq('user_id', userId)
    .not('category_id', 'is', null);
  if (countError) throw countError;

  const freq: Record<string, number> = {};
  for (const row of catCounts ?? []) {
    freq[row.category_id!] = (freq[row.category_id!] ?? 0) + 1;
  }

  // 2. 안 본 콘텐츠 가져오기
  const { data, error } = await supabase
    .from('contents')
    .select('*, categories(name)')
    .eq('user_id', userId)
    .is('viewed_at', null);
  if (error) throw error;

  const items = data as (Content & { categories: { name: string } | null })[];

  // 3. 카테고리 빈도 높은 순 → 미분류는 마지막 → saved_at 오래된 순
  items.sort((a, b) => {
    const freqA = a.category_id ? (freq[a.category_id] ?? 0) : -1;
    const freqB = b.category_id ? (freq[b.category_id] ?? 0) : -1;
    if (freqB !== freqA) return freqB - freqA;
    return new Date(a.saved_at).getTime() - new Date(b.saved_at).getTime();
  });

  return items.slice(0, limit);
}

// ─── AI Classification (비동기) ───

async function classifyAndUpdate(content: Content, description?: string) {
  const userId = content.user_id;
  const result = await classifyContent({
    url: content.url,
    title: content.title,
    domain: content.domain,
    description,
  });
  if (!result) return;

  const updates: { tags?: string[]; category_id?: string | null; title?: string } = {};

  if (result.tags.length > 0) {
    updates.tags = result.tags;
  }

  // AI가 제안한 제목이 있고, 기존 제목이 제네릭이면 업데이트
  if (result.suggested_title) {
    updates.title = result.suggested_title;
  }

  if (result.category !== null) {
    // 카테고리 이름 → ID 매핑
    const { data: cat } = await supabase
      .from('categories')
      .select('id')
      .eq('user_id', userId)
      .eq('name', result.category)
      .single();
    if (cat) {
      updates.category_id = cat.id;
    }
  }

  if (Object.keys(updates).length > 0) {
    await supabase
      .from('contents')
      .update(updates)
      .eq('user_id', userId)
      .eq('id', content.id);
  }
}

// ─── Onboarding ───

export async function createInitialCategories(names: string[]) {
  const userId = await requireUserId();

  const rows = names.map(name => ({ user_id: userId, name }));
  const { data, error } = await supabase
    .from('categories')
    .insert(rows)
    .select();
  if (error) throw error;
  return data as Category[];
}
