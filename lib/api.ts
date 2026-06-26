import { supabase } from './supabase';
import { classifyContent } from './ai';
import { emit, markClassified, markClassifying } from './events';
import { fetchLinkMetadata, isBadMetadataText, isGenericPlatformTitle, normalizeUrl, platformFallbackTitle } from './metadata';
import { analytics, type EntrySource, type FailureReason } from './analytics';
import type { Category, Content } from '@/types';

async function requireUserId() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return user.id;
}

function shouldPreferDescriptionUpdate(current: string | null, next?: string) {
  if (!next) return false;
  if (!current) return true;

  const currentLooksTruncated =
    current.endsWith('...') ||
    current.endsWith('…') ||
    /\.\.\.\s*$/.test(current);

  if (currentLooksTruncated && next.length > current.length) {
    return true;
  }

  return next.includes('\n') && !current.includes('\n') && next.length >= current.length;
}

export function isDuplicateContentUrlError(error: unknown) {
  const message = error instanceof Error
    ? error.message
    : typeof error === 'object' && error !== null && 'message' in error
      ? String((error as { message?: unknown }).message ?? '')
      : String(error ?? '');

  return (
    message.includes('contents_user_id_url_key') ||
    message.includes('contents_user_url_unique') ||
    message.includes('duplicate key value') ||
    (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: unknown }).code === '23505'
    )
  );
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

export async function getRelatedContents(content: Content, limit = 2) {
  const userId = await requireUserId();

  const { data, error } = await supabase
    .from('contents')
    .select('*, categories(name)')
    .eq('user_id', userId)
    .neq('id', content.id);
  if (error) throw error;

  const items = data as (Content & { categories: { name: string } | null })[];

  const scored = items.map((item) => {
    let score = 0;
    if (content.category_id && item.category_id === content.category_id) score += 3;
    const tagOverlap = item.tags.filter((t) => content.tags.includes(t)).length;
    score += tagOverlap * 2;
    if (content.domain && item.domain === content.domain) score += 1;
    return { item, score };
  });

  scored.sort((a, b) => b.score - a.score || new Date(b.item.saved_at).getTime() - new Date(a.item.saved_at).getTime());

  return scored.filter((s) => s.score >= 2).slice(0, limit).map((s) => s.item);
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

function classifyFailureReason(error: unknown): FailureReason {
  if (isDuplicateContentUrlError(error)) return 'duplicate_url';
  const message = error instanceof Error ? error.message : String(error ?? '');
  if (/invalid url|malformed|cannot parse url/i.test(message)) return 'invalid_url';
  if (/network|fetch|timeout|abort|ECONN|ENOTFOUND/i.test(message)) return 'network_error';
  if (
    (typeof error === 'object' && error !== null && 'code' in error) ||
    /5\d\d|server|database|postgres/i.test(message)
  ) return 'server_error';
  return 'unknown';
}

export async function saveContent(
  input: {
    url: string;
    title?: string;
    thumbnail_url?: string;
    domain?: string;
  },
  options?: {
    entry_source?: EntrySource;
    /** Safari 공유 시 share extension이 전달한 페이지 head meta. fetchLinkMetadata에 위임. */
    shareIntentMeta?: Record<string, string | undefined> | null;
  },
) {
  const entrySource = options?.entry_source ?? 'direct';
  void analytics.saveAttempted(entrySource);

  let saved: Content;
  let metaDescription: string | undefined;

  try {
    const userId = await requireUserId();

    const normalizedUrl = normalizeUrl(input.url);
    const metadata = await fetchLinkMetadata(normalizedUrl, {
      shareIntentMeta: options?.shareIntentMeta,
    });
    const contentInput = {
      ...input,
      url: normalizedUrl,
      title: input.title ?? metadata.title,
      description: metadata.description ?? null,
      thumbnail_url: input.thumbnail_url ?? metadata.thumbnail_url,
      domain: input.domain ?? metadata.domain,
    };
    metaDescription = metadata.description;

    const { data, error } = await supabase
      .from('contents')
      .insert({ user_id: userId, ...contentInput })
      .select()
      .single();
    if (error) throw error;

    saved = data as Content;
  } catch (err) {
    void analytics.saveFailed(classifyFailureReason(err), entrySource);
    throw err;
  }

  // 비동기 AI 분류 (저장 UX와 분리, 실패해도 저장은 유지).
  // markClassifying은 saveContent return 전에 동기로 수행되어
  // 호출자가 emit('content-saved')로 화면을 갱신할 때 "분류 중" 상태가 반영되도록 보장.
  markClassifying(saved.id);
  classifyAndUpdate(saved, metaDescription)
    .catch(err => console.warn('AI classification failed:', err))
    .finally(() => {
      markClassified(saved.id);
      emit('content-classified');
    });

  return saved;
}

export async function refreshContentMetadata(
  content: Content & { categories?: { name: string } | null },
): Promise<Content & { categories: { name: string } | null }> {
  const userId = await requireUserId();
  const metadata = await fetchLinkMetadata(content.url);
  const updates: {
    title?: string;
    description?: string | null;
    thumbnail_url?: string;
    domain?: string;
  } = {};

  if (
    (!content.title ||
      content.title === content.url ||
      isPlaceholderTitle(content) ||
      isMetadataPolluted(content)) &&
    metadata.title
  ) {
    updates.title = metadata.title;
  }

  if (shouldPreferDescriptionUpdate(content.description, metadata.description)) {
    updates.description = metadata.description;
  } else if (isMetadataPolluted(content) && isBadMetadataText(content.description)) {
    updates.description = metadata.description ?? null;
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

function isMetadataPolluted(content: Content) {
  return (
    isBadMetadataText(content.title) ||
    isBadMetadataText(content.description) ||
    isGenericPlatformTitle(content.title)
  );
}

function isPlaceholderTitle(content: Content) {
  if (!content.title) return false;
  return content.title === platformFallbackTitle(content.url);
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

export async function moveContents(ids: string[], categoryId: string | null) {
  if (ids.length === 0) return;

  const userId = await requireUserId();

  if (categoryId) {
    const { data: category, error: categoryError } = await supabase
      .from('categories')
      .select('id')
      .eq('user_id', userId)
      .eq('id', categoryId)
      .maybeSingle();
    if (categoryError) throw categoryError;
    if (!category) throw new Error('Category not found');
  }

  const { error } = await supabase
    .from('contents')
    .update({ category_id: categoryId })
    .eq('user_id', userId)
    .in('id', ids);
  if (error) throw error;
}

export async function deleteContents(ids: string[]) {
  if (ids.length === 0) return;

  const userId = await requireUserId();

  const { error } = await supabase
    .from('contents')
    .delete()
    .eq('user_id', userId)
    .in('id', ids);
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

  // 1. 전체 콘텐츠로 카테고리별 조회율(관심도) 계산
  const { data: allContents, error: allError } = await supabase
    .from('contents')
    .select('category_id, viewed_at')
    .eq('user_id', userId)
    .not('category_id', 'is', null);
  if (allError) throw allError;

  const catStats: Record<string, { total: number; viewed: number }> = {};
  for (const row of allContents ?? []) {
    const cid = row.category_id!;
    if (!catStats[cid]) catStats[cid] = { total: 0, viewed: 0 };
    catStats[cid].total++;
    if (row.viewed_at) catStats[cid].viewed++;
  }

  const interestRate = (categoryId: string | null): number => {
    if (!categoryId || !catStats[categoryId]) return 0;
    const s = catStats[categoryId];
    return s.total > 0 ? s.viewed / s.total : 0;
  };

  // 2. 안 본 콘텐츠 가져오기 (최근 14일 이내 저장분)
  const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from('contents')
    .select('*, categories(name)')
    .eq('user_id', userId)
    .is('viewed_at', null)
    .gte('saved_at', since);
  if (error) throw error;

  const items = data as (Content & { categories: { name: string } | null })[];
  const now = Date.now();

  // 3. 관심도 × 망각도 스코어 → 카테고리당 최대 2개
  const scored = items.map((item) => {
    const interest = interestRate(item.category_id);
    const daysSinceSaved = (now - new Date(item.saved_at).getTime()) / (1000 * 60 * 60 * 24);
    const forgottenness = Math.max(daysSinceSaved / 7, 0.1);
    return { item, score: interest * forgottenness };
  });

  scored.sort((a, b) => b.score - a.score);

  const result: typeof items = [];
  const catCount: Record<string, number> = {};
  for (const { item } of scored) {
    const cid = item.category_id ?? '__uncategorized__';
    catCount[cid] = (catCount[cid] ?? 0) + 1;
    if (catCount[cid] > 2) continue;
    result.push(item);
    if (result.length >= limit) break;
  }

  return result;
}

// Phase 2 리포트용 단일 fetch. 카테고리/분포/관련 주제를 클라이언트에서 derive.
// 미분류(category_id IS NULL)도 포함해서 가져옴 — "분류되지 않은 콘텐츠 N개" 안내 위해.
export type ReportItem = {
  id: string;
  category_id: string | null;
  categories: { name: string } | null;
  tags: string[];
  saved_at: string;
};

export async function getRecentContentsForReport(days: number): Promise<ReportItem[]> {
  const userId = await requireUserId();
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from('contents')
    .select('id, category_id, categories(name), tags, saved_at')
    .eq('user_id', userId)
    .gte('saved_at', since);
  if (error) throw error;
  // supabase 자동 추론 타입은 categories를 array로 보지만, 단일 FK join은 single object.
  // 기존 패턴(getRediscoverContents)과 동일하게 unknown 경유 캐스팅.
  return (data ?? []) as unknown as ReportItem[];
}

// 한 번이라도 열어봤지만 오랫동안 다시 보지 않은 콘텐츠.
// Rediscover(viewed_at IS NULL, 한 번도 안 본 것)와 명확히 구분.
export async function getForgottenContents(limit = 10, days = 30) {
  const userId = await requireUserId();

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from('contents')
    .select('*, categories(name)')
    .eq('user_id', userId)
    .not('viewed_at', 'is', null)
    .lt('viewed_at', since)
    .order('viewed_at', { ascending: true })
    .limit(limit);
  if (error) throw error;

  return (data ?? []) as (Content & { categories: { name: string } | null })[];
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

  // 이미 카테고리가 있으면 중복 생성 방지
  const { count } = await supabase
    .from('categories')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);
  if (count && count > 0) return [];

  const rows = names.map(name => ({ user_id: userId, name }));
  const { data, error } = await supabase
    .from('categories')
    .insert(rows)
    .select();
  if (error) throw error;
  return data as Category[];
}

// ─── Account ───

export async function deleteAccount() {
  const { error } = await supabase.rpc('delete_user_account');
  if (error) throw error;
}
